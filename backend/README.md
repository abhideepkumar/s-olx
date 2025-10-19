# S-OLX Backend

A Node.js/Express backend for S-OLX, a student marketplace platform for buying, selling, and exchanging items within college communities.

## 🏗️ Architecture Overview

The backend follows a modular MVC architecture with clear separation of concerns:

- **Models**: MongoDB schemas for data persistence
- **Controllers**: Business logic and request handling
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, file upload, validation
- **Utils**: Helper functions and utilities

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app configuration & middleware
│   ├── index.js              # Server entry point
│   ├── db.js                 # MongoDB connection setup
│   ├── constants.js          # Application constants
│   ├── controllers/          # Business logic handlers
│   │   ├── user.controller.js
│   │   ├── product.controller.js
│   │   └── post.controller.js
│   ├── models/               # MongoDB schemas
│   │   ├── user.model.js
│   │   ├── product.model.js
│   │   ├── post.model.js
│   │   ├── wishlist.model.js
│   │   ├── product.sold.model.js
│   │   ├── product.review.model.js
│   │   ├── chat.model.js
│   │   ├── notification.model.js
│   │   └── otp.model.js
│   ├── routes/               # API route definitions
│   │   ├── user.routes.js
│   │   ├── product.routes.js
│   │   └── post.routes.js
│   ├── middleware/           # Custom middleware
│   │   └── multer.middleware.js
│   └── utils/                # Utility functions
│       ├── ApiError.js
│       ├── ApiResponse.js
│       ├── asyncHandler.js
│       ├── validator.js
│       └── cloudinary/
│           └── cloudinary.js
├── public/
│   └── alllowedDomains.js    # Allowed email domains
├── package.json
├── Dockerfile
└── mongodb.yaml
```

## 🚀 Features

### User Management
- **Registration**: College email validation, profile image upload
- **Authentication**: JWT-based auth with access/refresh tokens
- **Profile Management**: Update user information and profile pictures
- **User Statistics**: Track posts, products, sold items, wishlist count

### Product Management
- **Product Listing**: Create, read, update, delete products
- **Image Upload**: Multiple image support via Cloudinary
- **Search & Filter**: Text search and category/price filtering
- **Product Categories**: Organized product classification
- **Wishlist**: Add/remove products from wishlist
- **Product Reviews**: Rating and review system
- **Mark as Sold**: Transaction completion tracking

### Community Features
- **Posts**: Create and manage community posts
- **Comments**: Interactive commenting system
- **Voting**: Like/unlike posts functionality
- **Trending**: Algorithm-based trending posts
- **Reporting**: Post reporting system

### Security & Performance
- **Rate Limiting**: API rate limiting (100 req/15min general, 5 req/hour auth)
- **Input Validation**: Comprehensive field validation
- **File Upload Security**: Image-only uploads with size limits
- **CORS**: Cross-origin resource sharing configuration
- **Error Handling**: Centralized error management

## 🛠️ Technology Stack

- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer + Cloudinary
- **Security**: bcryptjs for password hashing
- **Rate Limiting**: express-rate-limit
- **Validation**: Custom validation utilities

## 📋 API Endpoints

### User Routes (`/api/v1/users`)
- `POST /register` - User registration
- `POST /login` - User authentication
- `GET /profile/:userId` - Get user profile
- `PATCH /profile/update/:userId` - Update user profile
- `GET /stats/:userId` - Get user statistics

### Product Routes (`/api/v1/products`)
- `POST /create` - Create new product
- `GET /id/:id` - Get product by ID
- `GET /homepage` - Get products for homepage
- `GET /product-search` - Search products
- `GET /seller/:sellerId` - Get products by seller
- `GET /category/:category` - Get products by category
- `GET /filter` - Filter products
- `PATCH /update/:productId` - Update product
- `DELETE /delete/:productId` - Delete product
- `POST /mark-sold/:productId` - Mark product as sold
- `POST /wishlist/add/:productId` - Add to wishlist
- `DELETE /wishlist/remove/:productId` - Remove from wishlist
- `GET /wishlist/:userId` - Get user wishlist
- `GET /similar/:productId` - Get similar products
- `POST /review/:productId` - Add product review

### Post Routes (`/api/v1/post`)
- `POST /create` - Create new post
- `GET /post-feed` - Get posts feed
- `GET /comments/:postId` - Get post comments
- `POST /comment/:postId` - Add comment
- `PATCH /update/:postId` - Update post
- `DELETE /delete/:postId` - Delete post
- `POST /like/:postId` - Like post
- `POST /unlike/:postId` - Unlike post
- `GET /trending` - Get trending posts
- `POST /report` - Report post

## 🔧 Configuration

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/solx
PORT=8000
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CLOUDINARY_API_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
CLOUDINARY_DEFAULT_IMAGE=default_profile_url
```

### Dependencies
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **multer**: File upload handling
- **cloudinary**: Image storage and processing
- **cors**: Cross-origin requests
- **express-rate-limit**: API rate limiting
- **cookie-parser**: Cookie parsing
- **dotenv**: Environment variables

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## 🐳 Docker Support

The backend includes Docker configuration for containerized deployment:

```bash
docker build -t solx-backend .
docker run -p 8000:8000 solx-backend
```

## 📊 Database Models

### User Model
- Personal information (name, USN, email, branch, college)
- Authentication (password with bcrypt hashing)
- Profile management (profile image URL)
- References to products and posts

### Product Model
- Product details (title, description, price, condition)
- Categorization (category, tags)
- Media (multiple images via Cloudinary)
- Seller relationship
- Text search indexing

### Post Model
- Content and metadata
- User relationship
- Comments system
- Voting system (upvotes/downvotes)
- Timestamps

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive field validation
- **File Upload Security**: Image-only, size-limited uploads
- **CORS Protection**: Configurable cross-origin policies
- **Domain Validation**: College email domain restrictions

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: Efficient data loading
- **Image Optimization**: Cloudinary integration
- **Rate Limiting**: API protection
- **Error Handling**: Graceful error management
- **Async Operations**: Non-blocking I/O operations

## 🧪 Error Handling

The backend implements a comprehensive error handling system:

- **ApiError Class**: Standardized error responses
- **ApiResponse Class**: Consistent success responses
- **AsyncHandler**: Automatic error catching
- **Validation**: Input validation with detailed error messages
- **HTTP Status Codes**: Proper status code usage

## 🔄 API Response Format

All API responses follow a consistent format:

```json
{
  "statusCode": 200,
  "data": {...},
  "message": "Success message",
  "success": true,
  "errors": false
}
```

Error responses:
```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error message",
  "success": false,
  "errors": [...]
}
```

## 📝 Development Notes

- Uses ES6 modules (import/export)
- Implements async/await pattern
- Follows RESTful API conventions
- Includes comprehensive logging
- Supports both development and production environments
- Implements proper error boundaries
- Uses middleware for cross-cutting concerns