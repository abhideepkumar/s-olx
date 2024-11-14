import { Router } from 'express';
import { CreatePost, addComment, GetPosts } from '../controllers/post.controller.js';

const router = Router();

router.route('/create').post(CreatePost);
router.route('/add-comment').post(addComment);
router.route('/post-feed').get(GetPosts);

export default router;
