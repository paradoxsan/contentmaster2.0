import { beforeUserCreated } from "firebase-functions/v2/identity";
import { db } from "../config/firebase";
import { FieldValue } from "firebase-admin/firestore";

export const onUserCreated = beforeUserCreated(async (event) => {
  const user = event.data;
  if (!user) return;

  await db
    .collection("users")
    .doc(user.uid)
    .set({
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? null,
      metaAccountIds: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
});
