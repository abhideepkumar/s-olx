import { Router } from 'express';
import { createPost, addComment, getPosts, getComments } from '../controllers/post.controller.js';

const router = Router();

router.route('/create').post(createPost);
router.route('/add-comment/:postId').post(addComment);
router.route('/post-feed').get(getPosts);
router.route('/getComments/:postId').get(getComments);

export default router;
