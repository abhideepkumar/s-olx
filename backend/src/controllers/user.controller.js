import { asyncHandler } from '../utils/asyncHandler.js';
import { UploadImage } from '../utils/cloudinary/cloudinary.js';
import { validateFields } from '../utils/validator.js';
import { user } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { posts } from '../models/post.model.js';
import { product } from '../models/product.model.js';
import { productSold } from '../models/product.sold.model.js';
import { wishlist } from '../models/wishlist.model.js';

//register user
const registerUser = asyncHandler(async (req, res) => {
  const { name, usn, email, password, branch, clg_name, profile_url } = req.body;

  // Validate all fields
  validateFields({ name, usn, email, password, branch, clg_name });
  console.log('All fields are valid in registerUser');

  // Check if user already exists
  const isExists = await user.findOne({ $or: [{ email }, { usn }] });
  if (isExists) {
    throw new ApiError(409, 'User already exists with either same USN or email');
  }

  let cloudinaryUrl = '';

  // Handle user profile image upload
  const profilePath =
    req?.files?.profile_url === undefined ? process.env.CLOUDINARY_DEFAULT_IMAGE : req?.files?.profile_url[0]?.path;

  try {
    if (profilePath !== process.env.CLOUDINARY_DEFAULT_IMAGE) {
      const uploadResult = await UploadImage(profilePath);
      if (!uploadResult || !uploadResult.url) {
        throw new ApiError(400, 'Failed to upload image to Cloudinary');
      }
      cloudinaryUrl = uploadResult.url;
    } else {
      cloudinaryUrl = profilePath;
    }
  } catch (error) {
    throw new ApiError(400, `Error uploading image to Cloudinary: ${error.message}`);
  }

  // Create user object
  const userData = {
    name,
    usn,
    email,
    password,
    branch,
    clg_name,
    profile_url: cloudinaryUrl,
  };

  try {
    // Create user in the database
    const newUser = await user.create(userData);
    console.log('User created:', newUser);

    return res.status(201).json(new ApiResponse(201, 'New User Created', newUser));
  } catch (error) {
    throw new ApiError(500, `Error creating user: ${error.message}`);
  }
});

export { registerUser };

//login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log('Details:', email, password);

  validateFields({ email, password });
  console.log('All fields are valid in loginUser');

  // 3. Find user by email
  const userdata = await user.findOne({ email });
  if (!userdata) {
    throw new ApiError(401, 'User email not found');
  }
  console.log('User found:', userdata);

  // 4. Compare passwords
  const isPasswordValid = await bcrypt.compare(password, userdata.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  return res.status(200).json(new ApiResponse(200, 'Login successful'));
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user ID format');
  }

  const userProfile = await user
    .findById(userId)
    .select('-password')
    .populate('products')
    .populate('posts');

  if (!userProfile) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(
    new ApiResponse(200, 'User profile fetched successfully', userProfile)
  );
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name, branch, clg_name } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user ID format');
  }

  let updateData = {
    name,
    branch,
    clg_name
  };

  // Handle profile image update if provided
  if (req.files?.profile_url) {
    const uploadResult = await UploadImage(req.files.profile_url[0].path);
    if (!uploadResult?.url) {
      throw new ApiError(400, 'Failed to upload image');
    }
    updateData.profile_url = uploadResult.url;
  }

  const updatedUser = await user.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(
    new ApiResponse(200, 'Profile updated successfully', updatedUser)
  );
});

export { loginUser };

export const getUserStats = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user ID format');
  }

  const postCount = await posts.countDocuments({ user: userId });
  const productCount = await product.countDocuments({ seller: userId });
  const soldProductCount = await productSold.countDocuments({ 
    product: { $in: await product.find({ seller: userId }).select('_id') }
  });
  const wishlistCount = await wishlist.findOne({ user: userId }).then(w => w?.products?.length || 0);

  return res.status(200).json(
    new ApiResponse(200, 'User statistics fetched successfully', {
      posts: postCount,
      products: productCount,
      soldProducts: soldProductCount,
      wishlistItems: wishlistCount
    })
  );
});
