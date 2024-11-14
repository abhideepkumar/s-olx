import { asyncHandler } from '../utils/asyncHandler.js';
import { posts } from '../models/post.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from 'mongoose';

/**
 * Create a new post
 * @route POST /api/posts
 * @access Private
 */
export const createPost = asyncHandler(async (req, res) => {
  const { author, content } = req.body;

  // Input validation
  if (!author || !content?.trim()) {
    throw new ApiError(400, 'Author and content are required fields');
  }

  // Validate author ID format if it's a MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(author)) {
    throw new ApiError(400, 'Invalid author ID format');
  }

  const post = await posts.create({
    author,
    content: content.trim(),
  });

  return res.status(201).json(new ApiResponse(201, 'Post created successfully', post));
});

/**
 * Add a comment to a post
 * @route POST /api/posts/:postId/comments
 * @access Private
 */
export const addComment = asyncHandler(async (req, res) => {
  const { authorId, body } = req.body;
  const { postId } = req.params;

  // Input validation
  if (!authorId || !body?.trim() || !postId) {
    throw new ApiError(400, 'Author ID, comment body, and post ID are required');
  }

  // Validate MongoDB ObjectId formats
  if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(authorId)) {
    throw new ApiError(400, 'Invalid post ID or author ID format');
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
          author: authorId,
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

/**
 * Get paginated posts feed
 * @route GET /api/posts
 * @access Public
 */
export const getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  // Validate pagination parameters
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
    throw new ApiError(400, 'Invalid pagination parameters');
  }

  // Calculate skip value for pagination
  const skip = (pageNumber - 1) * limitNumber;

  // Get total count for pagination metadata
  const totalPosts = await posts.countDocuments();

  // Fetch paginated posts
  const posts = await posts.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber)
    .populate('author', 'name usn profile_url')
    .lean();

  // If no posts found, return empty array instead of throwing error
  return res.status(200).json(
    new ApiResponse(200, 'Posts fetched successfully', {
      posts,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalPosts / limitNumber),
        totalPosts,
        hasMore: skip + posts.length < totalPosts,
      },
    })
  );
});
