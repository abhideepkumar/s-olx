import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
require("dotenv").config();

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
  },
  { timestamps: true }
);

StudentSchema.pre("save", async function (next) {
  if (this.isModified(this.password)) return next();
  this.password = bcrypt.hash(this.password, 10);
  next();
});

StudentSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
StudentSchema.methods.generateAccessToken = async function () {
  jwt.sign(
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
  jwt.sign(
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
