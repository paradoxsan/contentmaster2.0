import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { db } from "../config/firebase";
import { publishPostAndUpdateStatus } from "../services/meta-publish.service";

export const api = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { action, ...payload } = request.data as {
    action: string;
    [key: string]: unknown;
  };
  const uid = request.auth.uid;

  switch (action) {
    case "getAccounts": {
      const snapshot = await db
        .collection("metaAccounts")
        .where("userId", "==", uid)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    case "publishNow": {
      const postId = payload.postId as string | undefined;
      if (!postId) {
        throw new HttpsError("invalid-argument", "postId is required");
      }

      // Verify the post belongs to the caller
      const postDoc = await db.collection("posts").doc(postId).get();
      if (!postDoc.exists) {
        throw new HttpsError("not-found", "Post not found");
      }
      if (postDoc.data()?.userId !== uid) {
        throw new HttpsError("permission-denied", "Not your post");
      }

      const results = await publishPostAndUpdateStatus(postId);
      return { results };
    }

    case "getPosts": {
      const snapshot = await db
        .collection("posts")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    default:
      logger.warn(`Unknown API action: ${action}`);
      throw new HttpsError("invalid-argument", `Unknown action: ${action}`);
  }
});
