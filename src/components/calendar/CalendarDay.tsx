import { PostCard } from "./PostCard";
import type { PostStatus, PostType, Platform } from "@/types";

export interface CalendarPost {
  id: string;
  caption: string;
  postType: PostType;
  platforms: Platform[];
  status: PostStatus;
  time: string;
}

interface CalendarDayProps {
  date: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  posts: CalendarPost[];
}

export function CalendarDay({
  date,
  isToday,
  isCurrentMonth,
  posts,
}: CalendarDayProps) {
  return (
    <div
      className={`min-h-[120px] border-b border-r border-meta-border p-1.5 ${
        isCurrentMonth ? "bg-meta-surface" : "bg-meta-bg"
      }`}
    >
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
          isToday
            ? "bg-meta-blue text-white"
            : isCurrentMonth
              ? "text-meta-text"
              : "text-meta-text-secondary/40"
        }`}
      >
        {date}
      </span>
      <div className="mt-1 space-y-1">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            caption={post.caption}
            postType={post.postType}
            platforms={post.platforms}
            status={post.status}
            time={post.time}
          />
        ))}
      </div>
    </div>
  );
}
