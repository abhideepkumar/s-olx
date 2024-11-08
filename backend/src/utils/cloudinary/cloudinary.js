import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

console.log(process.env.CLOUDINARY_API_KEY);
// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UploadFile = async (localFilePath) => {
  if (!localFilePath)
    return { statue: false, message: "No or invalid file path found" };
  const uploadResult = await cloudinary.uploader
    .upload(localFilePath, {
      public_id: "all",
      resource_type: "auto",
    })
    .catch((error) => {
      console.log(error);
      fs.unlinkSync(localFilePath); //remove locally saved temporary file at upload fails
      return { statue: false, message: "Failed to upload file to cloudinary" };
    });

  console.log(uploadResult);
};
