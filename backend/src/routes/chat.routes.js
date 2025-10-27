import { Router } from "express";
import { addMessage, getMessages, updateMessageStatus, updateEscrowStatus, triggerBatchProcessing, getPendingMessagesCount, getPendingMessages } from "../controllers/chat.controller.js";

const router = Router();

// Add a new message
router.route("/message").post(addMessage);

// Get messages between two users
router.route("/messages/:senderId/:receiverId").get(getMessages);

// Update message status (mark as read)
router.route("/message/:messageId/status").patch(updateMessageStatus);

// Update escrow status
router.route("/message/:messageId/escrow").patch(updateEscrowStatus);

// Persistence service endpoints
router.route("/batch/trigger").post(triggerBatchProcessing);
router.route("/pending/count").get(getPendingMessagesCount);
router.route("/pending/messages").get(getPendingMessages);

export default router;
