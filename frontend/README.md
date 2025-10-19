# S-OLX Frontend

A modern Next.js frontend for S-OLX, a student marketplace platform built with React, TypeScript, and Tailwind CSS.

## 🏗️ Architecture Overview

The frontend is built using Next.js 14 with App Router, featuring:

- **Modern React**: Functional components with hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **SWR**: Data fetching and caching
- **Responsive Design**: Mobile-first approach

## 📁 Project Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Homepage
│   ├── globals.css          # Global styles
│   ├── favicon.ico          # Site favicon
│   ├── fonts/               # Custom fonts
│   ├── login/               # Authentication pages
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── logout/
│   │   └── page.tsx
│   ├── profile/             # User profile
│   │   └── page.tsx
│   ├── product/             # Product pages
│   │   └── [id]/
│   │       └── page.tsx
│   ├── community/           # Community features
│   │   └── page.tsx
│   ├── wishlist/            # User wishlist
│   │   └── page.tsx
│   └── create-listing/      # Product creation
│       └── page.tsx
├── components/              # Reusable components
│   ├── ui/                  # Base UI components
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── carousel.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── slider.tsx
│   │   ├── spinner.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   ├── header.tsx           # Main header component
│   ├── footer.tsx           # Footer component
│   ├── side-nav.tsx         # Sidebar navigation
│   ├── mobile-nav.tsx       # Mobile navigation
│   ├── search-bar.tsx       # Search functionality
│   ├── filter-bar.tsx       # Product filtering
│   ├── image-carousel.tsx   # Product image carousel
│   ├── add-product-dialog.tsx
│   ├── edit-post-dialog.tsx
│   ├── edit-product-dialog.tsx
│   └── edit-profile-dialog.tsx
├── chat/                    # Real-time chat (PeerJS)
│   └── PeerChat.js
├── hooks/                   # Custom React hooks
│   └── use-toast.ts
├── lib/                     # Utility functions
│   └── utils.ts
├── public/                  # Static assets
│   ├── placeholder.svg
│   └── placeholder1.svg
├── components.json          # UI component configuration
├── next.config.mjs          # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## 🚀 Features

### User Interface
- **Responsive Design**: Mobile-first, works on all devices
- **Modern UI**: Clean, intuitive interface with Tailwind CSS
- **Accessibility**: Built with Radix UI primitives
- **Dark/Light Mode**: Theme support (planned)
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages

### Authentication
- **Login/Register**: Secure authentication forms
- **Form Validation**: Client-side validation
- **Token Management**: JWT token handling
- **Protected Routes**: Authentication-based routing
- **Session Persistence**: LocalStorage integration

### Product Management
- **Product Listing**: Grid-based product display
- **Product Details**: Comprehensive product pages
- **Image Gallery**: Multi-image carousel
- **Search & Filter**: Advanced filtering options
- **Wishlist**: Save favorite products
- **Create Listing**: Product creation forms
- **Edit/Delete**: Product management

### Community Features
- **Social Feed**: Community posts and interactions
- **Post Creation**: Rich text posting
- **Comments**: Interactive commenting system
- **Voting**: Like/unlike functionality
- **User Profiles**: Detailed user information

### Real-time Features
- **Peer-to-Peer Chat**: Direct messaging between users
- **Live Updates**: Real-time data synchronization
- **Notifications**: Toast notifications for actions

## 🛠️ Technology Stack

### Core Framework
- **Next.js 14**: React framework with App Router
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variants
- **Tailwind Merge**: Utility merging

### Data Management
- **SWR**: Data fetching and caching
- **Axios**: HTTP client
- **React Hot Toast**: Notifications

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **TypeScript**: Type checking

## 📱 Pages & Routes

### Public Routes
- `/` - Homepage with product listings
- `/login` - User authentication
- `/register` - User registration
- `/product/[id]` - Product details page
- `/community` - Community feed

### Protected Routes
- `/profile` - User profile management
- `/wishlist` - User's saved products
- `/create-listing` - Create new product
- `/logout` - User logout

## 🎨 UI Components

### Base Components (`/components/ui/`)
- **Button**: Various button styles and sizes
- **Card**: Content containers
- **Input**: Form input fields
- **Dialog**: Modal dialogs
- **Dropdown**: Dropdown menus
- **Avatar**: User profile images
- **Badge**: Status indicators
- **Toast**: Notification system

### Layout Components
- **Header**: Top navigation bar
- **SideNav**: Desktop sidebar navigation
- **MobileNav**: Mobile bottom navigation
- **Footer**: Site footer

### Feature Components
- **ImageCarousel**: Product image gallery
- **SearchBar**: Product search functionality
- **FilterBar**: Product filtering options
- **AddProductDialog**: Product creation modal
- **EditPostDialog**: Post editing modal

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Tailwind Configuration
- Custom color palette
- Responsive breakpoints
- Component variants
- Animation utilities

### TypeScript Configuration
- Strict type checking
- Path mapping for imports
- Next.js type definitions

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 📊 State Management

### Local State
- **React Hooks**: useState, useEffect, useContext
- **Form State**: Controlled components
- **UI State**: Modal, loading, error states

### Server State
- **SWR**: Data fetching and caching
- **Automatic Revalidation**: Background updates
- **Optimistic Updates**: Immediate UI feedback

### Persistent State
- **LocalStorage**: User authentication data
- **Session Storage**: Temporary data
- **Cookies**: Authentication tokens

## 🎯 Key Features Implementation

### Authentication Flow
1. **Login Form**: Email/password validation
2. **Token Storage**: Secure token management
3. **Route Protection**: Authentication guards
4. **Session Persistence**: Auto-login on refresh

### Product Management
1. **Product Grid**: Responsive product display
2. **Image Handling**: Multi-image support
3. **Search Integration**: Real-time search
4. **Filter System**: Advanced filtering

### Community Features
1. **Post Creation**: Rich text editor
2. **Feed Display**: Infinite scroll
3. **Interaction**: Like, comment, share
4. **User Profiles**: Detailed user info

## 🔒 Security Features

- **Input Validation**: Client-side validation
- **XSS Protection**: Sanitized inputs
- **CSRF Protection**: Token-based requests
- **Secure Storage**: Encrypted local storage
- **Route Protection**: Authentication guards

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- **Bottom Navigation**: Easy thumb access
- **Touch Gestures**: Swipe and tap interactions
- **Optimized Forms**: Mobile-friendly inputs
- **Responsive Images**: Adaptive image sizing

## 🎨 Styling Approach

### Design System
- **Color Palette**: Consistent brand colors
- **Typography**: Poppins font family
- **Spacing**: 4px base unit system
- **Shadows**: Layered shadow system

### Component Styling
- **Utility Classes**: Tailwind CSS utilities
- **Component Variants**: CVA for variants
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Theme support (planned)

## 🔄 Data Flow

### API Integration
1. **SWR Hooks**: Data fetching
2. **Error Handling**: Graceful error states
3. **Loading States**: User feedback
4. **Caching**: Optimized performance

### State Updates
1. **Optimistic Updates**: Immediate UI feedback
2. **Revalidation**: Background data sync
3. **Error Recovery**: Retry mechanisms
4. **Cache Management**: Smart invalidation

## 🧪 Error Handling

### Error Boundaries
- **Component Errors**: Graceful fallbacks
- **Network Errors**: Retry mechanisms
- **Validation Errors**: Form feedback
- **User Feedback**: Toast notifications

### Loading States
- **Skeleton Loading**: Content placeholders
- **Spinner Components**: Loading indicators
- **Progressive Loading**: Staged content loading
- **Error States**: User-friendly messages

## 📈 Performance Optimizations

### Next.js Features
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic code splitting
- **Static Generation**: Pre-rendered pages
- **API Routes**: Serverless functions

### React Optimizations
- **Memoization**: React.memo for components
- **Lazy Loading**: Dynamic imports
- **Virtual Scrolling**: Large list optimization
- **Bundle Optimization**: Tree shaking

## 🔧 Development Tools

### Code Quality
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks

### Development Experience
- **Hot Reload**: Instant updates
- **TypeScript**: IntelliSense support
- **Debugging**: React DevTools
- **Testing**: Jest integration (planned)

## 📝 Component Guidelines

### Component Structure
```tsx
interface ComponentProps {
  // Props interface
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    // JSX
  )
}
```

### Styling Patterns
- Use Tailwind utilities
- Create reusable variants
- Follow mobile-first approach
- Maintain consistency

### State Management
- Use appropriate hooks
- Minimize prop drilling
- Implement proper error handling
- Optimize re-renders

## 🚀 Deployment

### Build Process
```bash
npm run build
npm start
```

### Environment Configuration
- Development: `npm run dev`
- Production: `npm run build && npm start`
- Docker: Containerized deployment

### Performance Monitoring
- Bundle analysis
- Core Web Vitals
- User experience metrics
- Error tracking

## 📚 Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/
- **SWR**: https://swr.vercel.app/
- **TypeScript**: https://www.typescriptlang.org/docs/