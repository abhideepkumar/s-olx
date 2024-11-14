import { asyncHandler } from '../utils/asyncHandler.js';
import { PostModel } from '../models/post.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

//* create post
export const CreatePost = asyncHandler(async (req, res) => {
  const { author, content } = req.body;

  if (!author || !content) {
    new ApiError(400, 'Author detail or Content is missing');
  }
  const post = await PostModel.create({ author, content });
  res.status(201).json(new ApiResponse(201, 'Post created successfully', post));
});

//* add comment to a post
export const addComment = asyncHandler(async (req, res) => {
  //* received body and postId
  const { authorId, body, postId } = req.body;
  console.log('req', body, postId);
  const checkPost = await PostModel.findById(postId);
  console.log('Post is ', checkPost);
  //* find the post and if it exist add comment in it
  const post = await PostModel.findByIdAndUpdate(
    postId,
    { $push: { comments: { author: authorId, body: body, date: Date() } } },
    { new: true }
  );
  //* if no post found then handle the error
  if (!post) {
    throw new ApiError(400, 'Post is not available');
  }

  res.status(201).json(new ApiResponse(201, 'New Comment added to the post', post));
});

//* fetch posts
export const GetPosts = asyncHandler(async (req, res) => {
  try {
    const Feed = PostModel.find().sort({ updatedAt: -1 }).limit(10);
    if (!Feed) {
      throw new ApiError(400, 'No posts found');
    }
    res.status(200).json(200, 'Feed posts fetched successfully', Feed);
  } catch (error) {
    res.status(404).json(new ApiError(404, 'Error in fetching posts for feed', error));
  }
});
