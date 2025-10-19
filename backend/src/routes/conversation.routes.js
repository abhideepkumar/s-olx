import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  startConversation,
  getUserConversations,
  getConversationMessages,
  getConversation,
  archiveConversation,
  deleteConversation
} from "../controllers/conversation.controller.js";

const router = Router();

// Apply JWT verification to all conversation routes
router.use(verifyJWT);

// Start new conversation (Contact Seller)
router.post("/start", startConversation);

// Get user conversations
router.get("/user", getUserConversations);

// Get conversation by room ID
router.get("/:roomId", getConversation);

// Get conversation messages
router.get("/:roomId/messages", getConversationMessages);

// Archive conversation
router.patch("/:roomId/archive", archiveConversation);

// Delete conversation
router.delete("/:roomId", deleteConversation);

export default router;
