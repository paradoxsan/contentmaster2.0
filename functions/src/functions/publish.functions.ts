import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { db } from "../config/firebase";
import { publishPostAndUpdateStatus } from "../services/meta-publish.service";
import { FieldValue } from "firebase-admin/firestore";

export const processScheduledPublish = onSchedule(
  { schedule: "every 1 minutes", timeoutSeconds: 300 },
  async () => {
    const now = new Date();
    const pendingJobs = await db
      .collection("scheduledJobs")
      .where("status", "==", "pending")
      .where("scheduledAt", "<=", now)
      .limit(10)
      .get();

    if (pendingJobs.empty) {
      logger.info("No pending jobs to process");
      return;
    }

    logger.info(`Processing ${pendingJobs.size} scheduled jobs`);

    for (const jobDoc of pendingJobs.docs) {
      const job = jobDoc.data();
      const jobRef = jobDoc.ref;

      // Mark job as processing
      await jobRef.update({
        status: "processing",
        lastAttemptAt: FieldValue.serverTimestamp(),
        attempts: FieldValue.increment(1),
      });

      try {
        const results = await publishPostAndUpdateStatus(
          job.postId as string
        );

        const allSucceeded = results.every((r) => r.success);

        await jobRef.update({
          status: allSucceeded ? "completed" : "failed",
          errorMessage: allSucceeded
            ? null
            : results
                .filter((r) => !r.success)
                .map((r) => `${r.platform}: ${r.error}`)
                .join("; "),
          updatedAt: FieldValue.serverTimestamp(),
        });

        logger.info(
          `Job ${jobDoc.id}: ${allSucceeded ? "completed" : "failed"}`
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";

        const attempts = ((job.attempts as number) ?? 0) + 1;
        const maxAttempts = (job.maxAttempts as number) ?? 3;

        await jobRef.update({
          status: attempts >= maxAttempts ? "failed" : "pending",
          errorMessage: message,
          updatedAt: FieldValue.serverTimestamp(),
        });

        logger.error(`Job ${jobDoc.id} error (attempt ${attempts}):`, {
          error: message,
        });
      }
    }
  }
);
