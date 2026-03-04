import { useState } from "react";
import { PlatformSelector } from "@/components/ui/PlatformSelector";
import { CaptionInput } from "@/components/ui/CaptionInput";
import { Button } from "@/components/ui/Button";
import { POST_TYPE_LABELS } from "@/lib/constants";
import type { Platform, PostType } from "@/types";

const postTypes: PostType[] = ["feed_post", "story", "reel"];

export function CreatePost() {
  const [platforms, setPlatforms] = useState<Platform[]>(["facebook"]);
  const [postType, setPostType] = useState<PostType>("feed_post");
  const [caption, setCaption] = useState("");

  const showCaption = postType !== "story";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-meta-text">Create Post</h2>
        <p className="mt-1 text-meta-text-secondary">
          Compose and schedule content for your accounts
        </p>
      </div>

      <div className="rounded-lg border border-meta-border bg-meta-surface p-6 shadow-sm">
        <div className="space-y-6">
          {/* Platform Selection */}
          <PlatformSelector selected={platforms} onChange={setPlatforms} />

          {/* Post Type Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-meta-text">
              Post Type
            </label>
            <div className="flex gap-2">
              {postTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setPostType(type);
                    if (type === "story") setCaption("");
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    postType === type
                      ? "bg-meta-blue text-white"
                      : "bg-meta-hover text-meta-text-secondary hover:bg-meta-border"
                  }`}
                >
                  {POST_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific notes */}
          {postType === "story" && (
            <div className="rounded-md bg-meta-blue-light p-3 text-sm text-meta-blue">
              Stories require media with a 9:16 aspect ratio (1080x1920).
              Instagram Stories do not support caption text.
            </div>
          )}
          {postType === "reel" && (
            <div className="rounded-md bg-meta-blue-light p-3 text-sm text-meta-blue">
              Reels require video content. Recommended aspect ratio is 9:16.
            </div>
          )}

          {/* Caption Input */}
          {showCaption && (
            <CaptionInput
              value={caption}
              onChange={setCaption}
              platforms={platforms}
            />
          )}

          {/* Media Upload Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-meta-text">Media</label>
            <div className="flex min-h-[200px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-meta-border bg-meta-bg transition-colors hover:border-meta-blue">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-meta-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-2 text-sm font-medium text-meta-text-secondary">
                  {postType === "reel"
                    ? "Drop your video here or click to upload"
                    : "Drop your media here or click to upload"}
                </p>
                <p className="mt-1 text-xs text-meta-text-secondary">
                  {postType === "reel"
                    ? "MP4, MOV up to 1GB"
                    : "JPG, PNG, MP4, MOV"}
                </p>
              </div>
            </div>
          </div>

          {/* Hashtags */}
          {showCaption && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-meta-text">
                Hashtags
              </label>
              <input
                type="text"
                placeholder="Add hashtags separated by spaces (e.g. #marketing #social)"
                className="w-full rounded-lg border border-meta-border bg-meta-surface px-4 py-3 text-[15px] text-meta-text placeholder:text-meta-text-secondary focus:border-meta-blue focus:outline-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-meta-border pt-6">
            <Button variant="secondary">Save as Draft</Button>
            <div className="flex gap-3">
              <Button variant="secondary">Schedule</Button>
              <Button>Publish Now</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
