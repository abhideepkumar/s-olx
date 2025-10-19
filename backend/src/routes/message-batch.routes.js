import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  getQueueStats,
  getMessagesByRoom,
  processBatchNow,
  clearQueue,
  healthCheck,
  getQueueFile
} from "../controllers/message-batch.controller.js";

const router = Router();

// Apply JWT verification to all batch management routes
router.use(verifyJWT);

// Queue management endpoints
router.get("/stats", getQueueStats);
router.get("/health", healthCheck);
router.get("/room/:roomId", getMessagesByRoom);

// Batch processing endpoints
router.post("/process-now", processBatchNow);
router.delete("/clear", clearQueue);

// Debug endpoints
router.get("/queue-file", getQueueFile);

export default router;
