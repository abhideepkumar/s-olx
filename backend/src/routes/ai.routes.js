import { Router } from 'express';
import { chatWithAI } from '../controllers/ai.controller.js';

const router = Router();

// Chat with AI
router.route('/').post(chatWithAI);

export default router;
