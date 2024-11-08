import mongoose from "mongoose";

const TweetSchema= new mongoose.Schema({
    
        title: {
          type: String,
          required: true,
          trim: true,
        },
        comments: {
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
          required:true,
        },
      
},{timestamps:true})

export const TweetModel=mongoose.model("TweetModel", TweetSchema)