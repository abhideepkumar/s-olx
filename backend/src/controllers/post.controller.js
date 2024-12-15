import { asyncHandler } from '../utils/asyncHandler.js';
import { posts } from '../models/post.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from 'mongoose';

//* Create a new post
export const createPost = asyncHandler(async (req, res) => {
  const { user, content } = req.body;

  // Input validation
  if (!user || !content?.trim()) {
    throw new ApiError(400, 'User and content are required fields');
  }

  // Validate user ID format if it's a MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(user)) {
    throw new ApiError(400, 'Invalid user ID format');
  }

  const post = await posts.create({
    user,
    content: content.trim(),
  });

  return res.status(201).json(new ApiResponse(201, 'Post created successfully', post));
});

//* Add a comment to a post
export const addComment = asyncHandler(async (req, res) => {
  const { userId, body } = req.body;
  const { postId } = req.params;

  // Input validation
  if (!userId || !body?.trim() || !postId) {
    throw new ApiError(400, 'User ID, comment body, and post ID are required');
  }

  // Validate MongoDB ObjectId formats
  if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid post ID or user ID format');
  }

  // First check if post exists
  const postExists = await posts.exists({ _id: postId });
  if (!postExists) {
    throw new ApiError(404, 'Post not found');
  }

  // Add comment using findByIdAndUpdate
  const updatedPost = await posts.findByIdAndUpdate(
    postId,
    {
      $push: {
        comments: {
          user: userId,
          body: body.trim(),
          createdAt: new Date(),
        },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return res.status(201).json(new ApiResponse(201, 'Comment added successfully', updatedPost));
});

//* Get paginated posts feed
export const getPosts = asyncHandler(async (req, res) => {
  // Fetch paginated posts
  const allPosts = await posts
    .find()
    .select('-comments')
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name usn profile_url')
    //? no need to fetch comments here
    // .populate('comments.user', 'name usn profile_url')
    .lean();
  if (!allPosts) {
    throw new ApiError(400, 'No posts found');
  }
  // If no posts found, return empty array instead of throwing error
  return res.status(200).json(new ApiResponse(200, 'Posts fetched successfully', allPosts));
});

//* getComments
export const getComments = asyncHandler(async (req,res) => {
  const { postId } = req.params;
  console.log('Comments for :', postId);
  // check post valid
  const postComments =await posts.findById(postId).select('comments').lean();
  console.log("PostCommnets:",postComments)
  if (!postComments) {
    res.status(404).json(new ApiError(404, 'No comments found'));
  }
  return res.status(200).json(new ApiResponse(200,'Comments fetched successfully',postComments))
});
