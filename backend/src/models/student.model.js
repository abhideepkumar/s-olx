import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const StudentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    usn: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
      required: true,
    },
    clg_name: {
      type: String,
      // required: true,
      trim: true,
    },
    profile_url: {
      type: String, //cloudinary url
      required: true,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: ProductModel,
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: PostModel,
      },
    ],
  },
  { timestamps: true }
);

StudentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

StudentSchema.methods.generateAccessToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
      name: this.name,
      usn: this.usn,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

StudentSchema.methods.generateRefreshToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const StudentModel = mongoose.model("StudentModel", StudentSchema);

//? simple way to define models
// const StudentSchema = new mongoose.Schema(
//   {
//     name: String,
//     usn: Number,
//     email: String,
//     clg: String,
//     profile_url: String,
//     branch: String,
//   },
//   { timestamps: true },
// );

// export const StudentModel = mongoose.model("StudentModel", StudentSchema)
