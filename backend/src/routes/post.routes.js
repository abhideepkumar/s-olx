import { Router } from 'express';
import { createPost, addComment, getPosts, getComments, likePost, unlikePost, reportPost, getTrendingPosts,deletePost,updatePost } from '../controllers/post.controller.js';

const router = Router();

router.route('/create').post(createPost);
router.route('/add-comment/:postId').post(addComment);
router.route('/post-feed').get(getPosts);
router.route('/getComments/:postId').get(getComments);
router.route("/delete/:postId").delete(deletePost);
router.route("/update/:postId").patch(updatePost);
router.route("/like/:postId").post(likePost);
router.route("/unlike/:postId").post(unlikePost);
router.route("/report").post(reportPost);
router.route("/trending").get(getTrendingPosts);

export default router;
