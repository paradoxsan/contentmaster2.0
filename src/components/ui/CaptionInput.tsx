import { CAPTION_LIMITS } from "@/lib/constants";
import type { Platform } from "@/types";

interface CaptionInputProps {
  value: string;
  onChange: (value: string) => void;
  platforms: Platform[];
  disabled?: boolean;
}

export function CaptionInput({
  value,
  onChange,
  platforms,
  disabled = false,
}: CaptionInputProps) {
  const activeLimit = platforms.includes("instagram")
    ? CAPTION_LIMITS.instagram
    : CAPTION_LIMITS.facebook;

  const charCount = value.length;
  const isOverLimit = charCount > activeLimit;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-meta-text">Caption</label>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Write your caption..."
          rows={5}
          className={`w-full resize-none rounded-lg border px-4 py-3 text-[15px] text-meta-text placeholder:text-meta-text-secondary focus:outline-none ${
            disabled
              ? "cursor-not-allowed border-meta-border bg-gray-50 opacity-50"
              : isOverLimit
                ? "border-meta-red bg-meta-surface focus:border-meta-red"
                : "border-meta-border bg-meta-surface focus:border-meta-blue"
          }`}
        />
        <div className="mt-1 flex items-center justify-between">
          <div className="flex gap-2">
            {platforms.map((p) => (
              <span
                key={p}
                className="rounded-full bg-meta-hover px-2 py-0.5 text-xs text-meta-text-secondary"
              >
                {p === "facebook" ? "FB" : "IG"}: {CAPTION_LIMITS[p].toLocaleString()} max
              </span>
            ))}
          </div>
          <span
            className={`text-xs ${
              isOverLimit ? "font-semibold text-meta-red" : "text-meta-text-secondary"
            }`}
          >
            {charCount.toLocaleString()} / {activeLimit.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
