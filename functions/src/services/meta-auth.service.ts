import { db } from "../config/firebase";
import { META_API_VERSION, META_GRAPH_URL } from "../config/meta";

const APP_ID = process.env.META_APP_ID!;
const APP_SECRET = process.env.META_APP_SECRET!;

export function buildOAuthUrl(redirectUri: string, state: string): string {
  const scopes = [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_show_list",
    "instagram_basic",
    "instagram_content_publish",
    "business_management",
  ].join(",");

  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: "code",
    state,
  });

  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params}`;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const params = new URLSearchParams({
    client_id: APP_ID,
    client_secret: APP_SECRET,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`${META_GRAPH_URL}/oauth/access_token?${params}`);
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Failed to exchange code for token");
  }

  // Exchange short-lived token for long-lived token
  const longLivedParams = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: APP_ID,
    client_secret: APP_SECRET,
    fb_exchange_token: data.access_token,
  });

  const longRes = await fetch(`${META_GRAPH_URL}/oauth/access_token?${longLivedParams}`);
  const longData = await longRes.json();

  if (!longRes.ok || longData.error) {
    throw new Error(longData.error?.message ?? "Failed to get long-lived token");
  }

  return longData.access_token;
}

export async function getUserPages(accessToken: string) {
  const url = `${META_GRAPH_URL}/me/accounts?fields=id,name,picture,access_token,instagram_business_account,tasks&access_token=${accessToken}`;
  const res = await fetch(url);
  const data = await res.json();

  console.log("Meta /me/accounts response:", JSON.stringify(data));

  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Failed to fetch pages");
  }

  return data.data as Array<{
    id: string;
    name: string;
    picture?: { data: { url: string } };
    access_token: string;
    instagram_business_account?: { id: string };
  }>;
}

export async function saveMetaAccounts(
  userId: string,
  pages: Awaited<ReturnType<typeof getUserPages>>,
  userToken: string
) {
  const batch = db.batch();
  const savedIds: string[] = [];

  for (const page of pages) {
    // Save Facebook Page
    const pageRef = db.collection("metaAccounts").doc(`fb_${page.id}`);
    batch.set(
      pageRef,
      {
        id: `fb_${page.id}`,
        userId,
        metaUserId: page.id,
        type: "facebook_page",
        name: page.name,
        profilePictureUrl: page.picture?.data?.url ?? null,
        pageId: page.id,
        instagramBusinessAccountId: page.instagram_business_account?.id ?? null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    // Store page token securely
    const tokenRef = db.collection("metaTokens").doc(`fb_${page.id}`);
    batch.set(tokenRef, { accessToken: page.access_token, updatedAt: new Date() }, { merge: true });

    savedIds.push(`fb_${page.id}`);

    // Save linked Instagram Business Account if present
    if (page.instagram_business_account) {
      const igId = page.instagram_business_account.id;
      const igRef = db.collection("metaAccounts").doc(`ig_${igId}`);

      // Fetch IG account name
      let igName = `Instagram (${page.name})`;
      try {
        const igRes = await fetch(
          `${META_GRAPH_URL}/${igId}?fields=name,username&access_token=${page.access_token}`
        );
        const igData = await igRes.json();
        if (igData.username) igName = `@${igData.username}`;
      } catch { }

      batch.set(
        igRef,
        {
          id: `ig_${igId}`,
          userId,
          metaUserId: igId,
          type: "instagram_business",
          name: igName,
          profilePictureUrl: null,
          pageId: page.id,
          instagramBusinessAccountId: igId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );

      const igTokenRef = db.collection("metaTokens").doc(`ig_${igId}`);
      batch.set(igTokenRef, { accessToken: page.access_token, updatedAt: new Date() }, { merge: true });

      savedIds.push(`ig_${igId}`);
    }
  }

  // Store user-level token
  const userTokenRef = db.collection("metaTokens").doc(`user_${userId}`);
  batch.set(userTokenRef, { accessToken: userToken, updatedAt: new Date() }, { merge: true });

  await batch.commit();
  return savedIds;
}
