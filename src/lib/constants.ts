export const APP_NAME = "Content Master";

export const CAPTION_LIMITS = {
  facebook: 63206,
  instagram: 2200,
} as const;

export const POST_TYPE_LABELS = {
  feed_post: "Feed Post",
  story: "Story",
  reel: "Reel",
} as const;

export const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-meta-blue-light text-meta-blue",
  publishing: "bg-meta-orange/10 text-meta-orange",
  published: "bg-green-50 text-meta-green",
  failed: "bg-red-50 text-meta-red",
} as const;
