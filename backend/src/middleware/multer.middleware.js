import multer from "multer";
import fs from "fs";
import path from "path";
import { ApiError } from "../utils/ApiError.js";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// Configure dotenv
dotenv.config();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadDirectory = path.join(process.cwd(), "public", "temp");
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only image files are allowed"), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const UploadImage = async (localFilePath) => {
  try {
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    
    // Delete the local file after successful upload
    fs.unlinkSync(localFilePath);
    
    // Return the URL
    return {
      status: true,
      url: uploadResult.url
    };
  } catch (error) {
    // Delete the local file if upload fails
    fs.unlinkSync(localFilePath);
    throw new Error(`Failed to upload file to cloudinary: ${error.message}`);
  }
};
