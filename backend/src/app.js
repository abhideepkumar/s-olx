import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from 'express-rate-limit'

// General rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, //time set to 15 minutes
    limit: 100, // Limit each IP to 100 requests per window
    standardHeaders: 'draft-8', // draft-8 headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    trustProxy: true, // Trust the X-Forwarded-For header
    skipSuccessfulRequests: false, // Count successful requests against the rate limit
    skipFailedRequests: false, // Count failed requests against the rate limit
    handler: (req, res) => {
        res.status(429).json(new ApiError(429, 'Too many requests, please try again later.'));
    },
    keyGenerator: (req) => {
        return `${req.ip}-${req.originalUrl}`;
    },
})

// auth route limiter
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5, // 5 attempts per hour
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    trustProxy: true,
    handler: (req, res) => {
        res.status(429).json(new ApiError(429, 'Too many login requests, please try after 1 hour.'));
    },
})

// Express
const app = express();

// Middleware setup
app.use(cors());
app.use(limiter)
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import productRoute from "./routes/product.routes.js"
import postRoute from "./routes/post.routes.js"
import { ApiError } from "./utils/ApiError.js";

// routes decclaration
app.get('/api/health', (req, res) => {res.status(200).send('OK')});

// auth rate limiting to auth routes
app.use("/api/v1/users/login", authLimiter);
app.use("/api/v1/users/register", authLimiter);

// general rate limiting to other routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/post", postRoute);

export { app };
