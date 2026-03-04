"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = void 0;
const identity_1 = require("firebase-functions/v2/identity");
const firebase_1 = require("../config/firebase");
const firestore_1 = require("firebase-admin/firestore");
exports.onUserCreated = (0, identity_1.beforeUserCreated)(async (event) => {
    const user = event.data;
    if (!user)
        return;
    await firebase_1.db
        .collection("users")
        .doc(user.uid)
        .set({
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        photoURL: user.photoURL ?? null,
        metaAccountIds: [],
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
});
//# sourceMappingURL=auth.functions.js.map