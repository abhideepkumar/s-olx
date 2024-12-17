import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { validateFields } from '../utils/validator.js';
import { UploadImage } from '../middleware/multer.middleware.js';
import { product } from '../models/product.model.js';
import { productSold } from '../models/product.sold.model.js';
import { wishlist } from '../models/wishlist.model.js';
import { productReview } from '../models/product.review.model.js';
import mongoose from 'mongoose';

// create product
export const CreateProduct = asyncHandler(async (req, res) => {
  const { title, description, more_info, price, condition, tags, category, seller } = req.body;
  console.log('Received data:', { title, description, more_info, price, condition, tags, category, seller });
  //* validate fields
  validateFields({ title, description, price, condition, tags, category, seller });
  //* check for images being empty or not
  const images = req?.files?.images;
  if (!images) {
    throw new ApiError(400, 'At least one image is required');
  }
  //* upload images to cloudinary
  try {
    const cloudinaryUrls = await Promise.all(
      images.map(async (image) => {
        const uploadResult = await UploadImage(image.path);
        if (!uploadResult?.url) throw new ApiError(400, 'Failed to upload image to Cloudinary');
        return uploadResult.url;
      })
    );
    //* create the payload
    const payload = {
      title,
      description,
      more_info,
      price,
      condition,
      tags,
      category,
      images: cloudinaryUrls,
      seller,
    };

    console.log('Payload:', payload);
    //* upload the new product to mongodb
    const newProduct = await product.create(payload);
    res.status(201).json(new ApiResponse(201, 'New Product listed successfully', newProduct));
  } catch (error) {
    console.error('Error uploading product:', error);
    res.status(400).json(new ApiError(400, 'Error in uploading product details', error));
  }
});

// get product by id
export const FindProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('Product id searching for:', id);

  try {
    const product = await product.findById(id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }
    res.status(200).json(new ApiResponse(200, 'Product found using ID', product));
  } catch (error) {
    console.error('Error finding product:', error);
    res
      .status(error.statusCode || 500)
      .json(new ApiError(error.statusCode || 500, error.message || 'An error occurred', error));
  }
});

// get products for homepage
export const ProductForHomepage = asyncHandler(async (req, res) => {
  try {
    //* values allowed are asc, desc, ascending, descending, 1, and -1 for sort operator
    const products = await product.find().sort({ createdAt: -1 }).limit(10);
    console.log('homepage products: ', products);
    if (!products) {
      throw new ApiError(400, 'No products found to show');
    }
    res.status(200).json(new ApiResponse(200, 'Products for homepage fetched successfully', products));
  } catch (error) {
    throw new ApiError(500, 'Failed to fetch products for homepage', error);
  }
});

//* get product by search query
export const ProductBySearch = asyncHandler(async (req, res) => {
  const { searchText } = req.query;
  const products = await product.find({ $text: { $search: searchText } }).select('title description more_info condition category tags').limit(20);
  if(!products){
    return res.status(404).json(new ApiError(404, 'No Product found',products))
  }
  res.status(200).json(new ApiResponse(200, 'Product fetched successfully',products))
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, 'Invalid product ID format');
  }

  const deletedProduct = await product.findByIdAndDelete(productId);

  if (!deletedProduct) {
    throw new ApiError(404, 'Product not found');
  }

  return res.status(200).json(
    new ApiResponse(200, 'Product deleted successfully', {})
  );
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { title, description, more_info, price, condition, tags, category } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, 'Invalid product ID format');
  }

  let updateData = {
    title,
    description,
    more_info,
    price,
    condition,
    tags,
    category
  };

  // Handle image updates if provided
  if (req.files?.images) {
    const cloudinaryUrls = await Promise.all(
      req.files.images.map(async (image) => {
        const uploadResult = await UploadImage(image.path);
        if (!uploadResult?.url) throw new ApiError(400, 'Failed to upload image');
        return uploadResult.url;
      })
    );
    updateData.images = cloudinaryUrls;
  }

  const updatedProduct = await product.findByIdAndUpdate(
    productId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedProduct) {
    throw new ApiError(404, 'Product not found');
  }

  return res.status(200).json(
    new ApiResponse(200, 'Product updated successfully', updatedProduct)
  );
});

export const getProductsBySeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    throw new ApiError(400, 'Invalid seller ID format');
  }

  const products = await product
    .find({ seller: sellerId })
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, 'Products fetched successfully', products)
  );
});

export const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const products = await product
    .find({ category })
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, 'Products fetched successfully', products)
  );
});

export const markProductAsSold = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { buyerId, price_locked, remark } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, 'Invalid product ID format');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const productToSell = await product.findById(productId).session(session);
    if (!productToSell) {
      throw new ApiError(404, 'Product not found');
    }

    // Create entry in productSold collection
    const soldProduct = await productSold.create([{
      product: productId,
      buyer: buyerId,
      price_locked,
      remark
    }], { session });

    // Delete from products collection
    await product.findByIdAndDelete(productId).session(session);

    await session.commitTransaction();
    return res.status(200).json(
      new ApiResponse(200, 'Product marked as sold successfully', soldProduct[0])
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { userId } = req.body;

  const userWishlist = await wishlist.findOneAndUpdate(
    { user: userId },
    { $addToSet: { products: productId } },
    { upsert: true, new: true }
  );

  return res.status(200).json(
    new ApiResponse(200, 'Product added to wishlist', userWishlist)
  );
});

export const getSimilarProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const currentProduct = await product.findById(productId);
  if (!currentProduct) {
    throw new ApiError(404, 'Product not found');
  }

  const similarProducts = await product.find({
    $and: [
      { _id: { $ne: productId } },
      {
        $or: [
          { category: currentProduct.category },
          { tags: { $in: currentProduct.tags } }
        ]
      }
    ]
  }).limit(5);

  return res.status(200).json(
    new ApiResponse(200, 'Similar products fetched successfully', similarProducts)
  );
});

export const addProductReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { userId, rating, review } = req.body;

  if (!rating || !review?.trim()) {
    throw new ApiError(400, 'Rating and review are required');
  }

  const newReview = await productReview.create({
    product: productId,
    user: userId,
    rating,
    review: review.trim()
  });

  return res.status(201).json(
    new ApiResponse(201, 'Review added successfully', newReview)
  );
});

export const filterProducts = asyncHandler(async (req, res) => {
  const { minPrice, maxPrice, category, condition } = req.query;

  let query = {};

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (category) query.category = category;
  if (condition) query.condition = condition;

  const filteredProducts = await product.find(query).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, 'Products filtered successfully', filteredProducts)
  );
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid product ID or user ID format');
  }

  const updatedWishlist = await wishlist.findOneAndUpdate(
    { user: userId },
    { $pull: { products: productId } },
    { new: true }
  );

  if (!updatedWishlist) {
    throw new ApiError(404, 'Wishlist not found for this user');
  }

  return res.status(200).json(
    new ApiResponse(200, 'Product removed from wishlist successfully', updatedWishlist)
  );
});