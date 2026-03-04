"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaOAuthCallback = exports.metaOAuthStart = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const firebase_1 = require("../config/firebase");
const meta_auth_service_1 = require("../services/meta-auth.service");
// Returns the Meta OAuth URL for the frontend to redirect to
exports.metaOAuthStart = (0, https_1.onRequest)(async (req, res) => {
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
    let uid;
    try {
        const decoded = await firebase_1.auth.verifyIdToken(idToken);
        uid = decoded.uid;
    }
    catch {
        res.status(401).json({ error: "Invalid token" });
        return;
    }
    const redirectUri = `${req.headers.origin ?? "http://localhost:5175"}/auth/meta/callback`;
    const state = Buffer.from(JSON.stringify({ uid, ts: Date.now() })).toString("base64url");
    // Save state to Firestore so we can verify it on callback
    await firebase_1.db.collection("oauthStates").doc(state).set({ uid, createdAt: new Date() });
    const oauthUrl = (0, meta_auth_service_1.buildOAuthUrl)(redirectUri, state);
    res.json({ url: oauthUrl });
});
// Handles the redirect back from Meta after user approves
exports.metaOAuthCallback = (0, https_1.onRequest)(async (req, res) => {
    const { code, state, error } = req.query;
    const appUrl = "http://localhost:5175";
    if (error) {
        v2_1.logger.warn("Meta OAuth denied by user", { error });
        res.redirect(`${appUrl}/accounts?error=access_denied`);
        return;
    }
    if (!code || !state) {
        res.redirect(`${appUrl}/accounts?error=missing_params`);
        return;
    }
    // Verify state
    const stateDoc = await firebase_1.db.collection("oauthStates").doc(state).get();
    if (!stateDoc.exists) {
        res.redirect(`${appUrl}/accounts?error=invalid_state`);
        return;
    }
    const { uid } = stateDoc.data();
    await stateDoc.ref.delete();
    try {
        const redirectUri = `${req.headers.origin ?? appUrl}/auth/meta/callback`;
        const accessToken = await (0, meta_auth_service_1.exchangeCodeForToken)(code, redirectUri);
        const pages = await (0, meta_auth_service_1.getUserPages)(accessToken);
        if (pages.length === 0) {
            res.redirect(`${appUrl}/accounts?error=no_pages`);
            return;
        }
        const savedIds = await (0, meta_auth_service_1.saveMetaAccounts)(uid, pages, accessToken);
        v2_1.logger.info(`Saved ${savedIds.length} Meta accounts for user ${uid}`);
        res.redirect(`${appUrl}/accounts?connected=true&count=${pages.length}`);
    }
    catch (err) {
        v2_1.logger.error("Meta OAuth error", err);
        res.redirect(`${appUrl}/accounts?error=oauth_failed`);
    }
});
//# sourceMappingURL=meta-oauth.functions.js.map