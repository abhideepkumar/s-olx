import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  sendMessage,
  getRoomMessages,
  getUserConversations,
  updateMessageStatus,
  updateEscrowStatus,
  searchMessages,
  getEscrowMessages,
  getMessageStats,
  archiveConversation,
  unarchiveConversation
} from "../controllers/message.controller.js";

const router = Router();

// Apply JWT verification to all message routes
router.use(verifyJWT);

// Message operations
router.post("/send", sendMessage);
router.get("/room/:roomId", getRoomMessages);
router.get("/conversations", getUserConversations);
router.get("/search", searchMessages);
router.get("/escrow", getEscrowMessages);
router.get("/stats", getMessageStats);

// Message status operations
router.patch("/:messageId/status", updateMessageStatus);
router.patch("/:messageId/escrow", updateEscrowStatus);

// Conversation operations
router.patch("/conversation/:roomId/archive", archiveConversation);
router.patch("/conversation/:roomId/unarchive", unarchiveConversation);

export default router;
