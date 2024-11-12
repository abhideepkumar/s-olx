import { asyncHandler } from "../utils/asyncHandler.js";
import { UploadImage } from "../utils/cloudinary/cloudinary.js";
import { validateFields } from "../utils/validator.js";
import { UserModel } from "../models/student.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, usn, email, password, branch, clg_name, profile_url } =
    req.body;
  // validate all field
  validateFields({
    name,
    usn,
    email,
    password,
    branch,
    clg_name,
  });
  console.log("All fields are valid in registerUser");
  // check if user exist or not
  const isExists = await UserModel.findOne({ $or: [{ email }, { usn }] });
  if (isExists) {
    throw new ApiError(409, "User already exist with either same USN or email");
  }
  let cloudinaryUrl = "";
    // check for user image
    console.log("Req File path: ", req?.files?.profile_url);
    let profilePath =
      req?.files?.profile_url == undefined
        ? process.env.CLOUDINARY_DEFAULT_IMAGE
        : req?.files?.profile_url[0]?.path;
    try {
      if (profilePath != process.env.CLOUDINARY_DEFAULT_IMAGE) {
        const uploadResult = await UploadImage(profilePath);
        console.log("Upload Result :", uploadResult);
        if (!uploadResult || !uploadResult.url) {
          throw new ApiError(400, "Failed to upload image to cloudinary");
        }
        cloudinaryUrl = uploadResult.url;
      } else {
        cloudinaryUrl = profilePath;
      }
    } catch (error) {
      throw new ApiError(
        400,
        "Error uploading image to cloudinary: " + error.message
      );
    }
  // create user object
  const userData = {
    name,
    usn,
    email,
    password,
    branch,
    clg_name,
    profile_url: cloudinaryUrl,
  };

  // Create user in database
  try {
    const newUser = await UserModel.create(userData);
    console.log("User created:", newUser);

    return res
      .status(201)
      .json(new ApiResponse(201, "New User Created", newUser));
  } catch (error) {
    throw new ApiError(500, "Error creating user: " + error.message);
  }
});

export { registerUser };
