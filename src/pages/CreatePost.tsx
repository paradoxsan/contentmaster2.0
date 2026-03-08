import { useEffect, useState, useRef } from "react";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, storage, functions } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { PlatformSelector } from "@/components/ui/PlatformSelector";
import { CaptionInput } from "@/components/ui/CaptionInput";
import { Button } from "@/components/ui/Button";
import { POST_TYPE_LABELS } from "@/lib/constants";
import type { Platform, PostType, MetaAccount, MediaItem } from "@/types";

const postTypes: PostType[] = ["feed_post", "story", "reel"];

export function CreatePost() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [platforms, setPlatforms] = useState<Platform[]>(["facebook"]);
  const [postType, setPostType] = useState<PostType>("feed_post");
  const [caption, setCaption] = useState("");

  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialBulkDates = (location.state?.bulkDates as string[] | undefined) || [];
  const [scheduledDates, setScheduledDates] = useState<string[]>(
    initialBulkDates.length > 0
      ? initialBulkDates.map(d => new Date(d).toISOString().slice(0, 16))
      : [""]
  );

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "metaAccounts"),
      where("userId", "==", currentUser.uid),
      where("isActive", "==", true),
      where("type", "==", "facebook_page")
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => d.data() as MetaAccount);
      setAccounts(data);
      if (data.length > 0 && !selectedAccountId) {
        const firstAccount = data[0];
        if (firstAccount) {
          setSelectedAccountId(firstAccount.id);
        }
      }
    });
    return unsub;
  }, [currentUser, selectedAccountId]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }

  async function uploadFiles(userId: string): Promise<MediaItem[]> {
    const uploadedMedia: MediaItem[] = [];
    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      const storageRef = ref(storage, `uploads/${userId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      uploadedMedia.push({
        url,
        type: isVideo ? "video" : "image",
      });
    }
    return uploadedMedia;
  }

  async function handleSubmit(action: "draft" | "schedule" | "publish") {
    if (!currentUser || !selectedAccountId) {
      alert("Please select a Meta Account first.");
      return;
    }
    if (files.length === 0 && postType !== "feed_post") {
      alert(`${postType} requires media.`);
      return;
    }

    const datesToProcess = action === "schedule" ? scheduledDates.filter(d => Boolean(d)) : [null];

    if (action === "schedule" && datesToProcess.length === 0) {
      alert("Please select at least one valid date and time for scheduling.");
      return;
    }

    setProcessing(true);
    try {
      const mediaItems = await uploadFiles(currentUser.uid);
      const hashtags = caption.match(/#[a-zA-Z0-9_]+/g) || [];

      // Create a document and scheduled job for EACH date selected
      for (const dateStr of datesToProcess) {
        const scheduledTimestamp = dateStr ? Timestamp.fromDate(new Date(dateStr)) : null;

        const postData = {
          userId: currentUser.uid,
          metaAccountId: selectedAccountId,
          postType,
          platforms,
          status: action === "draft" ? "draft" : (action === "schedule" ? "scheduled" : "publishing"),
          caption,
          media: mediaItems, // Note: They share the same media storage pointers.
          hashtags,
          scheduledAt: scheduledTimestamp,
          publishedAt: null,
          metaPostIds: {},
          errorMessage: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "posts"), postData);

        if (action === "publish") {
          const apiCall = httpsCallable(functions, "api");
          apiCall({ action: "publishNow", postId: docRef.id }).catch(err => {
            console.error("Failed to publish post natively: ", err);
          });
        } else if (action === "schedule") {
          await addDoc(collection(db, "scheduledJobs"), {
            postId: docRef.id,
            status: "pending",
            scheduledAt: scheduledTimestamp,
            createdAt: serverTimestamp(),
            attempts: 0,
            maxAttempts: 3
          });
        }
      }

      navigate("/planner");
    } catch (err) {
      console.error(err);
      alert("Error: " + (err as Error).message);
    } finally {
      setProcessing(false);
    }
  }

  const showCaption = postType !== "story";
  const isBulkScheduling = scheduledDates.length > 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-meta-text">
          {isBulkScheduling ? "Bulk Create Posts" : "Create Post"}
        </h2>
        <p className="mt-1 text-meta-text-secondary">
          {isBulkScheduling ? `Creating identical posts for ${scheduledDates.length} selected days.` : "Compose and schedule content for your accounts"}
        </p>
      </div>

      <div className="rounded-lg border border-meta-border bg-meta-surface p-6 shadow-sm">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-meta-text">Account</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full rounded-lg border border-meta-border bg-meta-surface px-4 py-3 text-[15px] focus:border-meta-blue focus:outline-none"
            >
              <option value="" disabled>Select an account</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <PlatformSelector selected={platforms} onChange={setPlatforms} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-meta-text">Post Type</label>
            <div className="flex gap-2">
              {postTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setPostType(type);
                    if (type === "story") setCaption("");
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${postType === type
                    ? "bg-meta-blue text-white"
                    : "bg-meta-hover text-meta-text-secondary hover:bg-meta-border"
                    }`}
                >
                  {POST_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {postType === "story" && (
            <div className="rounded-md bg-meta-blue-light p-3 text-sm text-meta-blue">
              Stories require media with a 9:16 aspect ratio (1080x1920). Instagram Stories do not support caption text.
            </div>
          )}
          {postType === "reel" && (
            <div className="rounded-md bg-meta-blue-light p-3 text-sm text-meta-blue">
              Reels require video content. Recommended aspect ratio is 9:16.
            </div>
          )}

          {showCaption && (
            <CaptionInput value={caption} onChange={setCaption} platforms={platforms} />
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-meta-text">Media</label>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept={postType === 'reel' ? "video/mp4,video/quicktime" : "image/*,video/mp4,video/quicktime"}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[200px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-meta-border bg-meta-bg transition-colors hover:border-meta-blue"
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-meta-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm font-medium text-meta-text-secondary">
                  {files.length > 0
                    ? `${files.length} file(s) selected`
                    : (postType === "reel" ? "Click to upload video" : "Click to upload media")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-meta-text">Schedule Content</label>

            {scheduledDates.map((date, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => {
                    const next = [...scheduledDates];
                    next[idx] = e.target.value;
                    setScheduledDates(next);
                  }}
                  className="rounded-lg border border-meta-border bg-meta-surface px-4 py-2 text-sm focus:border-meta-blue focus:outline-none"
                />
                {scheduledDates.length > 1 && (
                  <button type="button" onClick={() => setScheduledDates(scheduledDates.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-600 text-sm">
                    Remove
                  </button>
                )}
                {idx === 0 && scheduledDates.length === 1 && (
                  <span className="text-xs text-meta-text-secondary">Leave empty to Publish Now</span>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => setScheduledDates([...scheduledDates, ""])}
              className="text-sm text-meta-blue hover:text-meta-blue-dark font-medium flex items-center gap-1"
            >
              + Add another date
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-meta-border pt-6">
            <Button variant="secondary" onClick={() => handleSubmit("draft")} disabled={processing}>Save Draft(s)</Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => handleSubmit("schedule")} disabled={processing || !scheduledDates[0]}>
                {isBulkScheduling ? `Schedule ${scheduledDates.length} Posts` : "Schedule"}
              </Button>
              <Button onClick={() => handleSubmit("publish")} disabled={processing || isBulkScheduling}>
                {processing ? "Processing..." : "Publish Now"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
