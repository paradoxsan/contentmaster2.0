import type { PostStatus, PostType, Platform } from "@/types";

interface PostCardProps {
  caption: string;
  postType: PostType;
  platforms: Platform[];
  status: PostStatus;
  time: string;
}

const statusColors: Record<PostStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-meta-blue-light text-meta-blue",
  publishing: "bg-yellow-50 text-yellow-600",
  published: "bg-green-50 text-green-600",
  failed: "bg-red-50 text-red-600",
};

const typeLabels: Record<PostType, string> = {
  feed_post: "Post",
  story: "Story",
  reel: "Reel",
};

export function PostCard({
  caption,
  postType,
  platforms,
  status,
  time,
}: PostCardProps) {
  return (
    <div className="cursor-pointer rounded-md border border-meta-border bg-meta-surface p-1.5 text-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-1">
        {platforms.map((p) => (
          <span key={p} className="text-[10px] text-meta-text-secondary">
            {p === "facebook" ? "FB" : "IG"}
          </span>
        ))}
        <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${statusColors[status]}`}>
          {typeLabels[postType]}
        </span>
      </div>
      <p className="mt-0.5 truncate text-meta-text">{caption || "No caption"}</p>
      <p className="mt-0.5 text-[10px] text-meta-text-secondary">{time}</p>
    </div>
  );
}
