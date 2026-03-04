import type { Timestamp } from "firebase-admin/firestore";

export type PostType = "feed_post" | "story" | "reel";
export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";
export type Platform = "facebook" | "instagram";

export interface MediaItem {
  url: string;
  type: "image" | "video";
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

export interface Post {
  id: string;
  userId: string;
  metaAccountId: string;
  postType: PostType;
  platforms: Platform[];
  status: PostStatus;
  caption: string;
  media: MediaItem[];
  hashtags: string[];
  scheduledAt: Timestamp | null;
  publishedAt: Timestamp | null;
  metaPostIds: Record<string, string>;
  errorMessage: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
