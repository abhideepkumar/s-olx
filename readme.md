# S-OLX

## Project Overview
The **S-OLX** is a web-based application tailored specifically for college students to buy, sell, and exchange stuff with the college communities. Inspired by platforms like OLX but designed to cater to student needs, it ensures a secure and convenient experience by verifying users through their college email addresses. Students can list items for sale such as stationery, furniture, bikes, and more. Additionally, the platform features a community page for discussions and product reviews.

## Key Features
- **Marketplace for Products**: Create and browse listings for items like textbooks, furniture, electronics, vehicles etc.
- **College Email Verification**: All users are verified through their academic email to ensure security and genuineness of the user.
- **Community Page**: Engage with peers through a text-based feed for posts, reviews, referrrals, alumni-talks and more.
- **Wishlist Functionality**: Save products to view or discuss later.
- **Product Review System**: Leave comments and feedback on items.

## Target Audience
Come on man, we are not targetting you, we are just helping you.

## Market Analysis
The market is dominated by general platforms like OLX and Facebook Marketplace. However, these do not cater specifically to the needs of college students. The **S-OLX** is positioned uniquely to fill this gap, leveraging community and trust as core strengths.

## Unique Selling Proposition (USP)
Verification through college emails ensures a safe and exclusive environment for college students so that you know who they are before even buying it. The community feature adds a social dimension for user interaction, enhancing trust.

## Technological Requirements
- **Front-end**: Next.js for the user interface.
- **Back-end**: Node.js with Express.js for server-side logic.
- **Database**: MongoDB for data management.
- **Authentication**: Google OAuth.
- **Hosting**: AWS / Azure.
- **Media Storage**: Cloudinary / Amazon S3.

## Docker Setup

### Backend
The backend service is containerized using Docker for easy deployment and consistency across environments.

#### Building the Backend Image
```bash
cd backend
docker build -t solx-backend:1.0 .
```

#### Running the Backend Container
```bash
# Run with environment variables from .env file
docker run -it --name solx-backend --env-file .env -p8000:8000 solx-backend:1.0
```

#### Environment Variables
Make sure to create a `.env` file in the backend directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d
PORT=8000
CORS_ORIGIN=*
CLOUDINARY_API_NAME=api_name
CLOUDINARY_API_KEY=api_key
CLOUDINARY_API_SECRET=api_secret
CLOUDINARY_DEFAULT_IMAGE=default_url
```

### Frontend
Instructions for containerizing the frontend will be added soon.

## Development Setup
1. Clone the repository
2. Set up backend:
   ```bash
   cd backend
   npm install
   npm start
   ```
3. Set up frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Future Opportunities
- **Expansion**: Include trade schools and other educational institutions.
- **Mobile App**: Develop iOS and Android applications.
- **Integrated Payments**: Secure in-platform payment solutions.
- **Rentals and Services**: Expand to item rentals and other student services.