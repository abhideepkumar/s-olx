import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Debug log
console.log("Cloudinary Config:", {
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET?.substring(0,5) + "..."
});

export const UploadImage = async (localFilePath) => {
  try {
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    // Delete local file after successful upload
    fs.unlinkSync(localFilePath);
    
    return {
      status: true,
      url: uploadResult.url
    };
    
  } catch (error) {
    // Delete local file if upload fails
    fs.unlinkSync(localFilePath);
    return {
      status: false,
      message: "Failed to upload file to cloudinary"
    };
  }
};
