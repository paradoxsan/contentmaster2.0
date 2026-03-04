import { META_GRAPH_URL } from "../config/meta";
import { db } from "../config/firebase";
import { MetaApiError } from "../utils/errors";
import { logger } from "../utils/logger";
import type { Post, Platform } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MetaApiResponse {
  id?: string;
  post_id?: string;
  uri?: string;
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
  };
}

interface ContainerStatusResponse {
  status_code: string;
  status?: string;
  error_message?: string;
}

export interface PublishResult {
  platform: Platform;
  success: boolean;
  metaPostId?: string;
  error?: string;
}

// ─── Token Resolution ────────────────────────────────────────────────────────

/**
 * Get access token for a given Meta account.
 * Tries Firestore metaTokens collection first, falls back to env var.
 */
async function getAccessToken(metaAccountId: string): Promise<string> {
  // Try Firestore first — token stored per account
  const tokenSnap = await db
    .collection("metaTokens")
    .doc(metaAccountId)
    .get();

  if (tokenSnap.exists) {
    const data = tokenSnap.data();
    if (data?.accessToken) {
      return data.accessToken as string;
    }
  }

  // Fallback to environment variable
  const envToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (envToken) {
    return envToken;
  }

  throw new MetaApiError(
    `No access token found for account ${metaAccountId}`,
    401
  );
}

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

async function metaApiRequest(
  endpoint: string,
  method: "GET" | "POST",
  params: Record<string, string> = {}
): Promise<MetaApiResponse> {
  const url = new URL(`${META_GRAPH_URL}${endpoint}`);

  if (method === "GET") {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const options: RequestInit = { method };

  if (method === "POST") {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(params);
  }

  logger.info(`Meta API ${method} ${endpoint}`);

  const response = await fetch(url.toString(), options);
  const data = (await response.json()) as MetaApiResponse;

  if (data.error) {
    logger.error("Meta API error", data.error);
    throw new MetaApiError(
      data.error.message,
      response.status,
      data.error.code
    );
  }

  return data;
}

// ─── Facebook Publishing ─────────────────────────────────────────────────────

async function publishToFacebookFeed(
  pageId: string,
  accessToken: string,
  post: Post
): Promise<string> {
  const media = post.media;
  const caption = post.caption || "";

  // Text-only post
  if (media.length === 0) {
    const result = await metaApiRequest(`/${pageId}/feed`, "POST", {
      message: caption,
      access_token: accessToken,
    });
    return result.id ?? result.post_id ?? "";
  }

  // Single photo
  if (media.length === 1 && media[0]?.type === "image") {
    const result = await metaApiRequest(`/${pageId}/photos`, "POST", {
      url: media[0].url,
      caption: caption,
      access_token: accessToken,
    });
    return result.id ?? result.post_id ?? "";
  }

  // Single video
  if (media.length === 1 && media[0]?.type === "video") {
    const result = await metaApiRequest(`/${pageId}/videos`, "POST", {
      file_url: media[0].url,
      description: caption,
      access_token: accessToken,
    });
    return result.id ?? "";
  }

  // Multiple photos — upload each unpublished, then create multi-photo post
  const photoIds: string[] = [];
  for (const item of media) {
    if (item.type === "image") {
      const result = await metaApiRequest(`/${pageId}/photos`, "POST", {
        url: item.url,
        published: "false",
        access_token: accessToken,
      });
      if (result.id) photoIds.push(result.id);
    }
  }

  const params: Record<string, string> = {
    message: caption,
    access_token: accessToken,
  };
  photoIds.forEach((id, i) => {
    params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
  });

  const result = await metaApiRequest(`/${pageId}/feed`, "POST", params);
  return result.id ?? result.post_id ?? "";
}

async function publishToFacebookStory(
  pageId: string,
  accessToken: string,
  post: Post
): Promise<string> {
  const media = post.media[0];
  if (!media) throw new MetaApiError("Story requires at least one media item", 400);

  if (media.type === "image") {
    // Upload photo unpublished, then create story from it
    const photoResult = await metaApiRequest(`/${pageId}/photos`, "POST", {
      url: media.url,
      published: "false",
      access_token: accessToken,
    });

    const result = await metaApiRequest(`/${pageId}/photo_stories`, "POST", {
      photo_id: photoResult.id ?? "",
      access_token: accessToken,
    });
    return result.post_id ?? result.id ?? "";
  }

  // Video story
  const result = await metaApiRequest(`/${pageId}/video_stories`, "POST", {
    video_url: media.url,
    access_token: accessToken,
  });
  return result.post_id ?? result.id ?? "";
}

async function publishToFacebookReel(
  pageId: string,
  accessToken: string,
  post: Post
): Promise<string> {
  const media = post.media[0];
  if (!media || media.type !== "video") {
    throw new MetaApiError("Reel requires a video media item", 400);
  }

  const result = await metaApiRequest(`/${pageId}/video_reels`, "POST", {
    video_url: media.url,
    description: post.caption || "",
    access_token: accessToken,
  });
  return result.id ?? "";
}

// ─── Instagram Publishing ────────────────────────────────────────────────────

/**
 * Poll Instagram media container until it's ready or fails.
 * Instagram processes video asynchronously — we need to wait.
 */
async function waitForContainerReady(
  containerId: string,
  accessToken: string,
  maxAttempts = 30
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = (await metaApiRequest(`/${containerId}`, "GET", {
      fields: "status_code",
      access_token: accessToken,
    })) as unknown as ContainerStatusResponse;

    if (status.status_code === "FINISHED") return;

    if (status.status_code === "ERROR") {
      throw new MetaApiError(
        `Instagram container failed: ${status.error_message ?? "unknown error"}`,
        400
      );
    }

    // Wait 2s before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new MetaApiError("Instagram container processing timed out", 408);
}

async function publishToInstagramFeed(
  igUserId: string,
  accessToken: string,
  post: Post
): Promise<string> {
  const media = post.media;
  const caption = post.caption || "";

  if (media.length === 0) {
    throw new MetaApiError("Instagram feed posts require at least one media item", 400);
  }

  // Single image
  if (media.length === 1 && media[0]?.type === "image") {
    const container = await metaApiRequest(`/${igUserId}/media`, "POST", {
      image_url: media[0].url,
      caption,
      access_token: accessToken,
    });

    const result = await metaApiRequest(`/${igUserId}/media_publish`, "POST", {
      creation_id: container.id ?? "",
      access_token: accessToken,
    });
    return result.id ?? "";
  }

  // Single video
  if (media.length === 1 && media[0]?.type === "video") {
    const container = await metaApiRequest(`/${igUserId}/media`, "POST", {
      video_url: media[0].url,
      caption,
      media_type: "VIDEO",
      access_token: accessToken,
    });
    await waitForContainerReady(container.id ?? "", accessToken);

    const result = await metaApiRequest(`/${igUserId}/media_publish`, "POST", {
      creation_id: container.id ?? "",
      access_token: accessToken,
    });
    return result.id ?? "";
  }

  // Carousel (multiple items)
  const childIds: string[] = [];
  for (const item of media) {
    const params: Record<string, string> = {
      is_carousel_item: "true",
      access_token: accessToken,
    };
    if (item.type === "image") {
      params.image_url = item.url;
    } else {
      params.video_url = item.url;
      params.media_type = "VIDEO";
    }

    const child = await metaApiRequest(`/${igUserId}/media`, "POST", params);
    if (child.id) {
      if (item.type === "video") {
        await waitForContainerReady(child.id, accessToken);
      }
      childIds.push(child.id);
    }
  }

  const carousel = await metaApiRequest(`/${igUserId}/media`, "POST", {
    media_type: "CAROUSEL",
    caption,
    children: childIds.join(","),
    access_token: accessToken,
  });

  const result = await metaApiRequest(`/${igUserId}/media_publish`, "POST", {
    creation_id: carousel.id ?? "",
    access_token: accessToken,
  });
  return result.id ?? "";
}

async function publishToInstagramStory(
  igUserId: string,
  accessToken: string,
  post: Post
): Promise<string> {
  const media = post.media[0];
  if (!media) throw new MetaApiError("Story requires at least one media item", 400);

  const params: Record<string, string> = {
    media_type: "STORIES",
    access_token: accessToken,
  };

  if (media.type === "image") {
    params.image_url = media.url;
  } else {
    params.video_url = media.url;
  }

  const container = await metaApiRequest(`/${igUserId}/media`, "POST", params);

  if (media.type === "video") {
    await waitForContainerReady(container.id ?? "", accessToken);
  }

  const result = await metaApiRequest(`/${igUserId}/media_publish`, "POST", {
    creation_id: container.id ?? "",
    access_token: accessToken,
  });
  return result.id ?? "";
}

async function publishToInstagramReel(
  igUserId: string,
  accessToken: string,
  post: Post
): Promise<string> {
  const media = post.media[0];
  if (!media || media.type !== "video") {
    throw new MetaApiError("Reel requires a video media item", 400);
  }

  const container = await metaApiRequest(`/${igUserId}/media`, "POST", {
    video_url: media.url,
    caption: post.caption || "",
    media_type: "REELS",
    access_token: accessToken,
  });
  await waitForContainerReady(container.id ?? "", accessToken);

  const result = await metaApiRequest(`/${igUserId}/media_publish`, "POST", {
    creation_id: container.id ?? "",
    access_token: accessToken,
  });
  return result.id ?? "";
}

// ─── Platform Dispatcher ─────────────────────────────────────────────────────

async function publishToPlatform(
  platform: Platform,
  post: Post,
  accessToken: string,
  pageId: string,
  igUserId: string | null
): Promise<string> {
  if (platform === "facebook") {
    switch (post.postType) {
      case "feed_post":
        return publishToFacebookFeed(pageId, accessToken, post);
      case "story":
        return publishToFacebookStory(pageId, accessToken, post);
      case "reel":
        return publishToFacebookReel(pageId, accessToken, post);
    }
  }

  if (platform === "instagram") {
    if (!igUserId) {
      throw new MetaApiError("No Instagram Business Account linked to this page", 400);
    }
    switch (post.postType) {
      case "feed_post":
        return publishToInstagramFeed(igUserId, accessToken, post);
      case "story":
        return publishToInstagramStory(igUserId, accessToken, post);
      case "reel":
        return publishToInstagramReel(igUserId, accessToken, post);
    }
  }

  throw new MetaApiError(`Unknown platform: ${platform}`, 400);
}

// ─── Main Publish Function ───────────────────────────────────────────────────

/**
 * Publish a post to all selected platforms.
 * Resolves the Meta account, gets the token, and fans out to each platform.
 */
export async function publishPost(post: Post): Promise<PublishResult[]> {
  logger.info(`Publishing post ${post.id} to platforms: ${post.platforms.join(", ")}`);

  // Get the linked Meta account
  const accountDoc = await db
    .collection("metaAccounts")
    .doc(post.metaAccountId)
    .get();

  if (!accountDoc.exists) {
    throw new MetaApiError(`Meta account ${post.metaAccountId} not found`, 404);
  }

  const account = accountDoc.data()!;
  const pageId = (account.pageId as string) ?? "";
  const igUserId = (account.instagramBusinessAccountId as string) ?? null;
  const accessToken = await getAccessToken(post.metaAccountId);

  const results: PublishResult[] = [];

  for (const platform of post.platforms) {
    try {
      const metaPostId = await publishToPlatform(
        platform,
        post,
        accessToken,
        pageId,
        igUserId
      );

      results.push({ platform, success: true, metaPostId });
      logger.info(`Published to ${platform}: ${metaPostId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      results.push({ platform, success: false, error: message });
      logger.error(`Failed to publish to ${platform}`, { error: message });
    }
  }

  return results;
}

/**
 * Publish a post and update its Firestore document with the results.
 * This is the main entry point used by the scheduler and API.
 */
export async function publishPostAndUpdateStatus(
  postId: string
): Promise<PublishResult[]> {
  const postDoc = await db.collection("posts").doc(postId).get();

  if (!postDoc.exists) {
    throw new MetaApiError(`Post ${postId} not found`, 404);
  }

  const post = { id: postDoc.id, ...postDoc.data() } as Post;
  const postRef = db.collection("posts").doc(postId);

  // Mark as publishing
  await postRef.update({
    status: "publishing",
    updatedAt: new Date(),
  });

  const results = await publishPost(post);

  // Build metaPostIds map from successful publishes
  const metaPostIds: Record<string, string> = { ...post.metaPostIds };
  let allSucceeded = true;
  let anySucceeded = false;

  for (const result of results) {
    if (result.success && result.metaPostId) {
      metaPostIds[result.platform] = result.metaPostId;
      anySucceeded = true;
    } else {
      allSucceeded = false;
    }
  }

  const status = allSucceeded ? "published" : anySucceeded ? "published" : "failed";

  const errorMessage = allSucceeded
    ? null
    : results
        .filter((r) => !r.success)
        .map((r) => `${r.platform}: ${r.error}`)
        .join("; ");

  await postRef.update({
    status,
    metaPostIds,
    publishedAt: anySucceeded ? new Date() : null,
    errorMessage,
    updatedAt: new Date(),
  });

  logger.info(`Post ${postId} final status: ${status}`);
  return results;
}
