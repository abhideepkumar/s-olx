import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  getPersistenceHealth,
  getMessageStatus,
  getAllMessageStatuses,
  updateMessageStatus,
  acknowledgeMessage,
  getUnacknowledgedMessages,
  getFailedAcknowledgments,
  triggerRecoveryCheck,
  getFileStats,
  cleanupOldFiles,
  getPersistenceLogs,
  getPersistenceStats
} from "../controllers/message-persistence.controller.js";

const router = Router();

// Apply JWT verification to all persistence routes
router.use(verifyJWT);

// Health and statistics
router.get("/health", getPersistenceHealth);
router.get("/stats", getPersistenceStats);

// Message status operations
router.get("/status/:messageId", getMessageStatus);
router.get("/statuses", getAllMessageStatuses);
router.patch("/status/:messageId", updateMessageStatus);

// Acknowledgment operations
router.post("/acknowledge/:messageId", acknowledgeMessage);
router.get("/unacknowledged", getUnacknowledgedMessages);
router.get("/failed-acknowledgments", getFailedAcknowledgments);

// Recovery operations
router.post("/recovery", triggerRecoveryCheck);

// File operations
router.get("/files", getFileStats);
router.post("/cleanup", cleanupOldFiles);

// Logging operations
router.get("/logs", getPersistenceLogs);

export default router;
