import { Router } from 'express';
import { CreateProduct, FindProductById, ProductForHomepage, ProductBySearch, markProductAsSold, addToWishlist, removeFromWishlist, getSimilarProducts, addProductReview, filterProducts,deleteProduct,updateProduct,getProductsByCategory,getProductsBySeller, getAllWishlistProducts, semanticSearch, getRecommendations, batchGenerateEmbeddings } from '../controllers/product.controller.js';
import multer from 'multer';
import { upload } from '../middleware/multer.middleware.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

//* create products
router.route('/create').post((req, res, next) => {
  console.log("Product route")
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
router.route('/id/:id').get(FindProductById);

//* fetch products for homepage
router.route('/homepage').get(ProductForHomepage);

//* fetch products by search  
router.route('/product-search').get(ProductBySearch);
router.route("/delete/:productId").delete(deleteProduct);
router.route("/update/:productId").patch(updateProduct);
router.route("/seller/:sellerId").get(getProductsBySeller);
router.route("/category/:category").get(getProductsByCategory);
router.route("/mark-sold/:productId").post(markProductAsSold);
router.route("/wishlist/add/:productId").post(addToWishlist);
router.route("/wishlist/remove/:productId").delete(removeFromWishlist);
router.route("/similar/:productId").get(getSimilarProducts);
router.route("/review/:productId").post(addProductReview);
router.route("/filter").get(filterProducts);
router.route('/wishlist/:userId').get(getAllWishlistProducts);

//* AI-powered semantic search routes
router.route('/search/semantic').get(semanticSearch);
router.route('/recommendations/:productId').get(getRecommendations);
router.route('/admin/batch-embeddings').post(batchGenerateEmbeddings);

export default router;
