import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

interface MetaAccount {
  id: string;
  type: "facebook_page" | "instagram_business";
  name: string;
  profilePictureUrl: string | null;
  isActive: boolean;
}

export function Accounts() {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [searchParams] = useSearchParams();

  const successCount = searchParams.get("connected") ? Number(searchParams.get("count") ?? 0) : null;
  const errorCode = searchParams.get("error");

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "metaAccounts"),
      where("userId", "==", currentUser.uid),
      where("isActive", "==", true)
    );

    const unsub = onSnapshot(q, (snap) => {
      setAccounts(snap.docs.map((d) => d.data() as MetaAccount));
      setLoading(false);
    });

    return unsub;
  }, [currentUser]);

  async function handleConnect() {
    if (!currentUser) return;
    setConnecting(true);
    try {
      const idToken = await currentUser.getIdToken();
      const fnUrl = import.meta.env.DEV
        ? `http://localhost:5001/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/us-central1/metaOAuthStart`
        : `/metaOAuthStart`;

      const res = await fetch(fnUrl, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) throw new Error("Failed to start OAuth");
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setConnecting(false);
    }
  }

  const errorMessages: Record<string, string> = {
    access_denied: "You cancelled the connection. Try again when ready.",
    no_pages: "No Facebook Pages found. Make sure you have at least one Page.",
    oauth_failed: "Something went wrong connecting your account. Please try again.",
    invalid_state: "Security check failed. Please try again.",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-meta-text">Accounts</h2>
          <p className="mt-1 text-meta-text-secondary">
            Connect your Facebook Pages and Instagram accounts
          </p>
        </div>
        <Button onClick={handleConnect} disabled={connecting}>
          {connecting ? "Redirecting..." : "Connect Account"}
        </Button>
      </div>

      {successCount !== null && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          Successfully connected {successCount} account{successCount !== 1 ? "s" : ""}.
        </div>
      )}

      {errorCode && errorMessages[errorCode] && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-meta-red">
          {errorMessages[errorCode]}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-meta-text-secondary">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="rounded-lg border border-meta-border bg-meta-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-meta-hover">
            <svg className="h-8 w-8 text-meta-text-secondary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-meta-text">No accounts connected</h3>
          <p className="mt-2 text-sm text-meta-text-secondary">
            Connect your Facebook Page or Instagram Business account to start publishing content.
          </p>
          <Button className="mt-4" onClick={handleConnect} disabled={connecting}>
            {connecting ? "Redirecting..." : "Connect Account"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center gap-4 rounded-lg border border-meta-border bg-meta-surface p-4 shadow-sm"
            >
              {account.profilePictureUrl ? (
                <img
                  src={account.profilePictureUrl}
                  alt={account.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-meta-blue text-white text-sm font-bold">
                  {account.type === "facebook_page" ? "f" : "ig"}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-meta-text">{account.name}</p>
                <p className="text-xs text-meta-text-secondary capitalize">
                  {account.type === "facebook_page" ? "Facebook Page" : "Instagram Business"}
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                Connected
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
