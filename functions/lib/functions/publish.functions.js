"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processScheduledPublish = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
const firebase_1 = require("../config/firebase");
const meta_publish_service_1 = require("../services/meta-publish.service");
const firestore_1 = require("firebase-admin/firestore");
exports.processScheduledPublish = (0, scheduler_1.onSchedule)({ schedule: "every 1 minutes", timeoutSeconds: 300 }, async () => {
    const now = new Date();
    const pendingJobs = await firebase_1.db
        .collection("scheduledJobs")
        .where("status", "==", "pending")
        .where("scheduledAt", "<=", now)
        .limit(10)
        .get();
    if (pendingJobs.empty) {
        v2_1.logger.info("No pending jobs to process");
        return;
    }
    v2_1.logger.info(`Processing ${pendingJobs.size} scheduled jobs`);
    for (const jobDoc of pendingJobs.docs) {
        const job = jobDoc.data();
        const jobRef = jobDoc.ref;
        // Mark job as processing
        await jobRef.update({
            status: "processing",
            lastAttemptAt: firestore_1.FieldValue.serverTimestamp(),
            attempts: firestore_1.FieldValue.increment(1),
        });
        try {
            const results = await (0, meta_publish_service_1.publishPostAndUpdateStatus)(job.postId);
            const allSucceeded = results.every((r) => r.success);
            await jobRef.update({
                status: allSucceeded ? "completed" : "failed",
                errorMessage: allSucceeded
                    ? null
                    : results
                        .filter((r) => !r.success)
                        .map((r) => `${r.platform}: ${r.error}`)
                        .join("; "),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            v2_1.logger.info(`Job ${jobDoc.id}: ${allSucceeded ? "completed" : "failed"}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            const attempts = (job.attempts ?? 0) + 1;
            const maxAttempts = job.maxAttempts ?? 3;
            await jobRef.update({
                status: attempts >= maxAttempts ? "failed" : "pending",
                errorMessage: message,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            v2_1.logger.error(`Job ${jobDoc.id} error (attempt ${attempts}):`, {
                error: message,
            });
        }
    }
});
//# sourceMappingURL=publish.functions.js.map