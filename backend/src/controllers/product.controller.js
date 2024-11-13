import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { validateFields } from '../utils/validator.js';
import { UploadImage } from '../middleware/multer.middleware.js';
import { ProductModel } from '../models/product.model.js';

// create product
export const CreateProduct = asyncHandler(async (req, res) => {
  const { title, description, more_info, price, condition, tags, category, seller, buyer } = req.body;
  console.log('Received data:', { title, description, more_info, price, condition, tags, category, seller, buyer });
  //* validate fields
  validateFields({ title, description, price, condition, tags, category, seller, buyer });
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
      buyer,
    };

    console.log('Payload:', payload);
    //* upload the new product to mongodb
    const newProduct = await ProductModel.create(payload);
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
    const product = await ProductModel.findById(id);
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
