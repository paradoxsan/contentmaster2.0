"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const firebase_1 = require("../config/firebase");
const meta_publish_service_1 = require("../services/meta-publish.service");
exports.api = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in");
    }
    const { action, ...payload } = request.data;
    const uid = request.auth.uid;
    switch (action) {
        case "getAccounts": {
            const snapshot = await firebase_1.db
                .collection("metaAccounts")
                .where("userId", "==", uid)
                .get();
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        }
        case "publishNow": {
            const postId = payload.postId;
            if (!postId) {
                throw new https_1.HttpsError("invalid-argument", "postId is required");
            }
            // Verify the post belongs to the caller
            const postDoc = await firebase_1.db.collection("posts").doc(postId).get();
            if (!postDoc.exists) {
                throw new https_1.HttpsError("not-found", "Post not found");
            }
            if (postDoc.data()?.userId !== uid) {
                throw new https_1.HttpsError("permission-denied", "Not your post");
            }
            const results = await (0, meta_publish_service_1.publishPostAndUpdateStatus)(postId);
            return { results };
        }
        case "getPosts": {
            const snapshot = await firebase_1.db
                .collection("posts")
                .where("userId", "==", uid)
                .orderBy("createdAt", "desc")
                .limit(50)
                .get();
            return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        }
        default:
            v2_1.logger.warn(`Unknown API action: ${action}`);
            throw new https_1.HttpsError("invalid-argument", `Unknown action: ${action}`);
    }
});
//# sourceMappingURL=api.functions.js.map