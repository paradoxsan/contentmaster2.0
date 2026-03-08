import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { format } from "date-fns";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import type { CalendarPost } from "@/components/calendar/CalendarDay";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import type { Post } from "@/types";

export function Planner() {
  const { currentUser } = useAuth();
  const [postsMap, setPostsMap] = useState<Map<string, CalendarPost[]>>(new Map());

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "posts"),
      where("userId", "==", currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const newMap = new Map<string, CalendarPost[]>();
      snap.docs.forEach((doc) => {
        const post = { id: doc.id, ...doc.data() } as Post;
        let dateObj = post.createdAt?.toDate();
        if (post.status === "scheduled" && post.scheduledAt) {
          dateObj = post.scheduledAt.toDate();
        } else if (post.status === "published" && post.publishedAt) {
          dateObj = post.publishedAt.toDate();
        }

        if (!dateObj) return;

        const dateKey = format(dateObj, "yyyy-MM-dd");
        const timeStr = format(dateObj, "h:mm a");

        const calPost: CalendarPost = {
          id: post.id,
          caption: post.caption,
          postType: post.postType,
          platforms: post.platforms,
          status: post.status,
          time: timeStr,
        };

        if (newMap.has(dateKey)) {
          newMap.get(dateKey)!.push(calPost);
        } else {
          newMap.set(dateKey, [calPost]);
        }
      });
      setPostsMap(newMap);
    });
    return unsub;
  }, [currentUser]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-meta-text">Planner</h2>
        <p className="mt-1 text-meta-text-secondary">
          View and manage your scheduled content. Select multiple days to bulk-schedule cross-posts.
        </p>
      </div>

      <CalendarGrid posts={postsMap} />
    </div>
  );
}
