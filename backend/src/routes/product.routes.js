import { Router } from 'express';
import { CreateProduct,FindProductById } from '../controllers/product.controller.js';
import multer from 'multer';
import { upload } from '../middleware/multer.middleware.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

//* create products
router.route('/create').post((req, res, next) => {
  upload.fields([{ name: 'images', maxCount: 5 }])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File is too large. Max size is 5MB'));
      }
      return next(new ApiError(400, err.message));
    } else if (err instanceof ApiError) {
      return next(err);
    } else if (err) {
      return next(new ApiError(500, 'Something went wrong while uploading file'));
    }
    next();
  });
}, CreateProduct);

//* fetch product using ID
router.route("/:id").get(FindProductById)
export default router;