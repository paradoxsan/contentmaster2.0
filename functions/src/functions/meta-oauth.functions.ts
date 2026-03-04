import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { auth, db } from "../config/firebase";
import {
  buildOAuthUrl,
  exchangeCodeForToken,
  getUserPages,
  saveMetaAccounts,
} from "../services/meta-auth.service";

// Returns the Meta OAuth URL for the frontend to redirect to
export const metaOAuthStart = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Verify Firebase ID token
  const authHeader = req.headers.authorization ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const appUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const redirectUri = `${req.headers.origin ?? appUrl}/auth/meta/callback`;
  const state = Buffer.from(JSON.stringify({ uid, ts: Date.now() })).toString("base64url");

  // Save state to Firestore so we can verify it on callback
  await db.collection("oauthStates").doc(state).set({ uid, createdAt: new Date() });

  const oauthUrl = buildOAuthUrl(redirectUri, state);
  res.json({ url: oauthUrl });
});

// Handles the redirect back from Meta after user approves
export const metaOAuthCallback = onRequest(async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>;

  const appUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

  if (error) {
    logger.warn("Meta OAuth denied by user", { error });
    res.redirect(`${appUrl}/accounts?error=access_denied`);
    return;
  }

  if (!code || !state) {
    res.redirect(`${appUrl}/accounts?error=missing_params`);
    return;
  }

  // Verify state
  const stateDoc = await db.collection("oauthStates").doc(state).get();
  if (!stateDoc.exists) {
    res.redirect(`${appUrl}/accounts?error=invalid_state`);
    return;
  }

  const { uid } = stateDoc.data() as { uid: string };
  await stateDoc.ref.delete();

  try {
    const redirectUri = `${req.headers.origin ?? appUrl}/auth/meta/callback`;
    const accessToken = await exchangeCodeForToken(code, redirectUri);
    const pages = await getUserPages(accessToken);

    if (pages.length === 0) {
      res.redirect(`${appUrl}/accounts?error=no_pages`);
      return;
    }

    const savedIds = await saveMetaAccounts(uid, pages, accessToken);
    logger.info(`Saved ${savedIds.length} Meta accounts for user ${uid}`);

    res.redirect(`${appUrl}/accounts?connected=true&count=${pages.length}`);
  } catch (err) {
    logger.error("Meta OAuth error", err);
    res.redirect(`${appUrl}/accounts?error=oauth_failed`);
  }
});
