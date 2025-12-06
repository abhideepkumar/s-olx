import { Router } from "express";
import { chatWithAI, queryOnce, endSession, aiHealthCheck } from "../controllers/ai.controller.js";

const router = Router();

// AI Chat endpoints
router.route("/chat").post(chatWithAI);        // Session-based chat
router.route("/query").post(queryOnce);        // One-off stateless query
router.route("/session/:sessionId").delete(endSession);  // End session
router.route("/health").get(aiHealthCheck);    // Health check

export default router;
