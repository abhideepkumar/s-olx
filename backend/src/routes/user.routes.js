import { Router } from "express";
import multer from "multer";
import { registerUser,loginUser } from "../controllers/user.controller.js";
import { ApiError } from "../utils/ApiError.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();
// user register 
router.route("/register").post((req, res, next) => {
  upload.fields([{ name: "profile_url", maxCount: 1 }])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new ApiError(400, "File is too large. Max size is 5MB"));
      }
      return next(new ApiError(400, err.message));
    } else if (err instanceof ApiError) {
      return next(err);
    } else if (err) {
      return next(
        new ApiError(500, "Something went wrong while uploading file")
      );
    }
    next();
  });
}, registerUser);

// user login
router.route("/login").post(loginUser)

export default router;
