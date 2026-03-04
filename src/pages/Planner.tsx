import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import type { CalendarPost } from "@/components/calendar/CalendarDay";

// Demo data to showcase the calendar — will be replaced with Firestore queries
const demoPosts = new Map<string, CalendarPost[]>();

export function Planner() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-meta-text">Planner</h2>
        <p className="mt-1 text-meta-text-secondary">
          View and manage your scheduled content
        </p>
      </div>

      <CalendarGrid posts={demoPosts} />
    </div>
  );
}
