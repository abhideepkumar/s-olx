import { asyncHandler } from "../utils/asyncHandler.js";
import { UploadImage } from "../utils/cloudinary/cloudinary.js";
import { validateFields } from "../utils/validator.js";
import { UserModel } from "../models/student.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, usn, email, password, branch, clg_name, profile_url } =
    req.body;

  validateFields({
    name,
    usn,
    email,
    password,
    branch,
    clg_name,
    profile_url,
  });

  console.log("All fields are valid in registerUser");

  // check if user exist or not
  const isExists = await UserModel.findOne({ $or: [{ email }, { usn }] });
  if (isExists) {
    throw new ApiError(409, "User already exist with either same USN or email");
  }
  // check for user image
  console.log("Req Files: ", req.files);
  const profileLocalPath =
    req.files?.profile_url[0]?.path || process.env.CLOUDINARY_DEFAULT_IMAGE;
  console.log("Local Path: ", profileLocalPath);
  if (!profileLocalPath) {
    throw new ApiError(400, "Profile image required");
  }
  // check upload of cloudinary
  const UploadToCloudinary = await UploadImage(profileLocalPath);
  if (UploadToCloudinary) {
    throw new ApiError(400, "Profile image upload failed");
  }
  // create user object
  const payload = {
    name,
    usn,
    email,
    password,
    branch,
    clg_name,
    profile_url: UploadToCloudinary?.url || "",
  };
  // send the data
  const CreateUser = UserModel.create(payload);
  // response the api with user id
  console.log("User created:", CreateUser);

  return res
    .status(201)
    .json(new ApiResponse(200, "New User Created", CreateUser));
});

export { registerUser };
