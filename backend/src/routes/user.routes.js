import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

router.route("/register").post((req, res, next) => {
  upload.fields([{ name: "profile_url", maxCount: 1 }])(req, res, (err) => {
    if (err) {
      throw new ApiError(400, "Error in handling image upload");
    }
    next();
  });
}, registerUser);

export default router;
