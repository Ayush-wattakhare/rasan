# Complete Rasan Food Delivery Platform - Single Replication Prompt

Create a full-stack MERN food delivery application called "Rasan" with the following complete architecture:

## 🎯 Project Overview
A comprehensive food delivery platform connecting customers, vendors, delivery partners, and administrators with real-time order tracking, subscription management, and advanced analytics.

## 📁 Project Structure

```
Rasan/
├── lunchbox-frontend/          # React frontend
│   ├── src/
│   │   ├── api/               # API integration layer
│   │   ├── assets/            # Images, videos, static files
│   │   ├── components/        # Reusable React components
│   │   │   ├── ui/           # UI library components (shadcn-style)
│   │   │   └── vendor/       # Vendor-specific components
│   │   ├── context/          # React Context providers
│   │   ├── layouts/          # Layout components
│   │   ├── pages/            # Page components
│   │   │   ├── customer/    # Customer-specific pages
│   │   │   └── assets/      # Page-specific assets
│   │   ├── styles/           # Global styles
│   │   ├── utils/            # Utility functions
│   │   ├── __mocks__/        # Jest mocks
│   │   ├── App.js            # Main app component
│   │   ├── index.js          # Entry point
│   │   └── setupTests.js     # Test configuration
│   ├── public/               # Public assets
│   └── package.json
│
├── lunchbox-backend/          # Express backend
│   ├── config/               # Configuration files
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Express middleware
│   ├── models/               # Mongoose models
│   ├── routes/               # API routes
│   ├── services/             # Business logic services
│   ├── utils/                # Utility functions
│   ├── uploads/              # File uploads directory
│   ├── logs/                 # Application logs
│   ├── migrations/           # Database migrations
│   ├── server.js             # Server entry point
│   └── package.json
│
└── package.json              # Root package.json for scripts
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19.1.0
- **Routing**: React Router DOM 7.5.0
- **State Management**: React Context API
- **Styling**: CSS Modules + Tailwind CSS
- **UI Components**: Custom components + Material-UI 7.3.7
- **Maps**: React Leaflet 5.0.0 + Leaflet 1.9.4
- **Animations**: Framer Motion 12.24.12
- **Icons**: React Icons 5.5.0 + Lucide React
- **HTTP Client**: Axios 1.8.4
- **Notifications**: React Toastify 11.0.5
- **Real-time**: Socket.IO Client 4.8.3
- **Testing**: Jest + React Testing Library + jest-axe

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.21.2
- **Database**: MongoDB with Mongoose 8.13.2
- **Authentication**: JWT (jsonwebtoken 9.0.2) + bcrypt 5.1.1
- **File Upload**: Multer 1.4.5
- **Payment**: Razorpay 2.9.6 + Stripe 14.17.0
- **Email**: Nodemailer 6.10.1
- **Real-time**: Socket.IO 4.7.4
- **Security**: Helmet 8.1.0, express-rate-limit, xss-clean, hpp, express-mongo-sanitize
- **Logging**: Winston 3.11.0
- **Validation**: express-validator 7.0.1

## 🗄️ Database Models

### 1. User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String,
  role: Enum ['customer', 'vendor', 'delivery', 'admin'],
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: { lat: Number, lng: Number }
  },
  profilePhoto: String,
  isActive: Boolean (default: true),
  isVerified: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Vendor Model
```javascript
{
  userId: ObjectId (ref: 'User'),
  businessName: String (required),
  description: String,
  cuisine: [String],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  address: String,
  phone: String,
  email: String,
  operatingHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    // ... other days
  },
  rating: Number (default: 0),
  totalOrders: Number (default: 0),
  isActive: Boolean (default: true),
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String
  },
  documents: {
    fssaiLicense: String,
    gstNumber: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Meal Model
```javascript
{
  vendorId: ObjectId (ref: 'Vendor'),
  name: String (required),
  description: String,
  category: String,
  mealType: Enum ['breakfast', 'lunch', 'dinner', 'snack'],
  price: Number (required),
  discountPrice: Number,
  image: String,
  ingredients: [String],
  allergens: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  isVeg: Boolean,
  isAvailable: Boolean (default: true),
  stock: Number,
  preparationTime: Number (minutes),
  rating: Number (default: 0),
  reviews: [{
    userId: ObjectId,
    rating: Number,
    comment: String,
    createdAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Order Model
```javascript
{
  orderNumber: String (unique, auto-generated),
  customerId: ObjectId (ref: 'User'),
  vendorId: ObjectId (ref: 'Vendor'),
  deliveryPartnerId: ObjectId (ref: 'DeliveryPartner'),
  items: [{
    mealId: ObjectId (ref: 'Meal'),
    name: String,
    quantity: Number,
    price: Number,
    customizations: [String]
  }],
  subtotal: Number,
  deliveryFee: Number,
  tax: Number,
  discount: Number,
  total: Number,
  status: Enum ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'],
  paymentStatus: Enum ['pending', 'paid', 'failed', 'refunded'],
  paymentMethod: Enum ['cash', 'card', 'upi', 'wallet'],
  paymentId: String,
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: { lat: Number, lng: Number }
  },
  deliveryInstructions: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  trackingUpdates: [{
    status: String,
    timestamp: Date,
    location: { lat: Number, lng: Number },
    note: String
  }],
  rating: {
    food: Number,
    delivery: Number,
    comment: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 5. DeliveryPartner Model
```javascript
{
  userId: ObjectId (ref: 'User'),
  vehicleType: Enum ['bike', 'scooter', 'car'],
  vehicleNumber: String,
  licenseNumber: String,
  isOnline: Boolean (default: false),
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  rating: Number (default: 0),
  totalDeliveries: Number (default: 0),
  earnings: {
    today: Number (default: 0),
    thisWeek: Number (default: 0),
    thisMonth: Number (default: 0),
    total: Number (default: 0)
  },
  documents: {
    drivingLicense: String,
    vehicleRC: String,
    insurance: String
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String
  },
  isVerified: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Subscription Model
```javascript
{
  customerId: ObjectId (ref: 'User'),
  vendorId: ObjectId (ref: 'Vendor'),
  planType: Enum ['daily', 'weekly', 'monthly'],
  mealType: Enum ['breakfast', 'lunch', 'dinner', 'all'],
  startDate: Date,
  endDate: Date,
  deliveryDays: [String], // ['monday', 'tuesday', ...]
  deliveryTime: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: { lat: Number, lng: Number }
  },
  price: Number,
  status: Enum ['active', 'paused', 'cancelled', 'completed'],
  paymentStatus: Enum ['pending', 'paid', 'failed'],
  autoRenew: Boolean (default: false),
  deliveries: [{
    date: Date,
    status: Enum ['scheduled', 'delivered', 'skipped', 'failed'],
    orderId: ObjectId (ref: 'Order')
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 7. Admin Model
```javascript
{
  email: String (required, unique),
  password: String (required, hashed),
  name: String,
  role: String (default: 'admin'),
  permissions: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### 8. Notification Model
```javascript
{
  userId: ObjectId (ref: 'User'),
  type: Enum ['order', 'delivery', 'payment', 'promotion', 'system'],
  title: String,
  message: String,
  data: Mixed,
  isRead: Boolean (default: false),
  createdAt: Date
}
```

### 9. Category Model
```javascript
{
  name: String (required, unique),
  description: String,
  image: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 10. GroupOrder Model
```javascript
{
  groupId: String (unique),
  hostId: ObjectId (ref: 'User'),
  vendorId: ObjectId (ref: 'Vendor'),
  participants: [{
    userId: ObjectId (ref: 'User'),
    items: [{ mealId: ObjectId, quantity: Number }],
    contribution: Number
  }],
  status: Enum ['open', 'closed', 'ordered'],
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 11. PlanPricing Model
```javascript
{
  planType: Enum ['daily', 'weekly', 'monthly'],
  mealType: Enum ['breakfast', 'lunch', 'dinner', 'all'],
  daysPerWeek: Number,
  basePrice: Number,
  discountPercentage: Number,
  finalPrice: Number,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication & Authorization

### JWT Token Structure
```javascript
{
  id: userId,
  email: userEmail,
  role: userRole,
  iat: issuedAt,
  exp: expiresAt
}
```

### Role-Based Access Control
- **Customer**: Browse meals, place orders, manage subscriptions, track deliveries
- **Vendor**: Manage menu, view orders, update order status, view analytics
- **Delivery Partner**: View assigned orders, update delivery status, track earnings
- **Admin**: Manage all users, vendors, orders, view system analytics

### Protected Routes (Frontend)
- PrivateRouteCustomer
- PrivateRouteVendor
- PrivateRouteDeliveryPartner
- PrivateRouteAdmin

### Middleware (Backend)
- authMiddleware: Verify JWT token
- roleMiddleware: Check user role
- adminAuthMiddleware: Admin-specific authentication
- securityMiddleware: Rate limiting, logging, security headers

## 📡 API Endpoints

### Auth Routes (`/api/auth`)
- POST `/register` - User registration
- POST `/login` - User login
- POST `/logout` - User logout
- POST `/forgot-password` - Request password reset
- POST `/reset-password` - Reset password with token
- GET `/verify-email/:token` - Verify email address

### User Routes (`/api/user`)
- GET `/profile` - Get user profile
- PUT `/profile` - Update user profile
- PUT `/change-password` - Change password
- DELETE `/account` - Delete account

### Meal Routes (`/api/meals`)
- GET `/` - Get all meals (with filters)
- GET `/:id` - Get meal by ID
- POST `/` - Create meal (vendor only)
- PUT `/:id` - Update meal (vendor only)
- DELETE `/:id` - Delete meal (vendor only)
- GET `/vendor/:vendorId` - Get meals by vendor
- POST `/:id/review` - Add meal review

### Order Routes (`/api/orders`)
- POST `/` - Create order
- GET `/` - Get user orders
- GET `/:id` - Get order by ID
- PUT `/:id/status` - Update order status
- POST `/:id/cancel` - Cancel order
- GET `/vendor/:vendorId` - Get vendor orders
- GET `/delivery/:deliveryId` - Get delivery partner orders
- POST `/:id/rate` - Rate order

### Vendor Routes (`/api/vendor`)
- POST `/register` - Vendor registration
- GET `/profile` - Get vendor profile
- PUT `/profile` - Update vendor profile
- GET `/orders` - Get vendor orders
- GET `/analytics` - Get vendor analytics
- PUT `/operating-hours` - Update operating hours
- GET `/earnings` - Get earnings report

### Delivery Partner Routes (`/api/delivery-partners`)
- POST `/register` - Delivery partner registration
- GET `/profile` - Get delivery partner profile
- PUT `/profile` - Update delivery partner profile
- PUT `/location` - Update current location
- PUT `/online-status` - Toggle online/offline
- GET `/available-orders` - Get available orders
- POST `/accept-order/:orderId` - Accept order
- PUT `/order-status/:orderId` - Update order status
- GET `/earnings` - Get earnings report

### Admin Routes (`/api/admin`)
- GET `/users` - Get all users
- GET `/vendors` - Get all vendors
- GET `/delivery-partners` - Get all delivery partners
- GET `/orders` - Get all orders
- GET `/analytics` - Get system analytics
- PUT `/user/:id/status` - Update user status
- PUT `/vendor/:id/verify` - Verify vendor
- PUT `/delivery-partner/:id/verify` - Verify delivery partner
- DELETE `/user/:id` - Delete user

### Subscription Routes (`/api/subscriptions`)
- POST `/` - Create subscription
- GET `/` - Get user subscriptions
- GET `/:id` - Get subscription by ID
- PUT `/:id` - Update subscription
- POST `/:id/pause` - Pause subscription
- POST `/:id/resume` - Resume subscription
- POST `/:id/cancel` - Cancel subscription
- GET `/plans` - Get available plans

### Payment Routes (`/api/payment`)
- POST `/create-order` - Create Razorpay order
- POST `/verify` - Verify payment
- POST `/refund` - Process refund
- GET `/history` - Get payment history

### Notification Routes (`/api/notifications`)
- GET `/` - Get user notifications
- PUT `/:id/read` - Mark notification as read
- PUT `/read-all` - Mark all as read
- DELETE `/:id` - Delete notification

### Menu Routes (`/api/menu`)
- GET `/vendor/:vendorId` - Get vendor menu
- POST `/vendor/:vendorId` - Create menu item
- PUT `/item/:itemId` - Update menu item
- DELETE `/item/:itemId` - Delete menu item

### Analytics Routes (`/api/analytics`)
- GET `/vendor/:vendorId/overview` - Vendor analytics overview
- GET `/vendor/:vendorId/sales` - Sales analytics
- GET `/vendor/:vendorId/popular-items` - Popular items
- GET `/admin/overview` - Admin analytics overview

## 🎨 Frontend Components

### Core Components
1. **HomeHeader** - Modern responsive header with mobile menu
2. **Navbar** - Main navigation bar
3. **Sidebar** - Dashboard sidebar navigation
4. **Topbar** - Dashboard top bar
5. **BackButton** - Navigation back button
6. **MealCard** - Meal display card
7. **Cart** - Shopping cart component
8. **CartItem** - Individual cart item
9. **FilterBar** - Meal filtering component
10. **AddToCartButton** - Add to cart action button
11. **PaymentSection** - Payment processing component
12. **RazorpayButton** - Razorpay integration button
13. **OrderTracker** - Real-time order tracking
14. **LocationTracker** - Delivery location tracking
15. **PriceCalculator** - Price calculation component
16. **SubscriptionManagement** - Subscription management UI
17. **SubscriptionPlanSelector** - Plan selection component
18. **WorkingDaysSelector** - Working days selection
19. **DashboardRedirect** - Role-based dashboard redirect

### UI Components (shadcn-style)
- Badge
- Button
- Card
- Input
- Label
- Progress
- RadioGroup
- Switch
- Table

### Vendor Components
- AnalyticsDashboard
- CustomerManagement
- DeliveryPartnerManagement
- FinancialReports
- InventoryManagement
- LocationSetup
- MarketingTools
- MenuManagement
- NotificationCenter
- PreparationTimeTracker
- QuickAccess
- ReportsManagement
- SecuritySettings

### Pages
1. **Home** - Landing page with meal browsing
2. **About** - About page
3. **Contact** - Contact page
4. **Login** - User login
5. **Register** - User registration
6. **AdminLogin** - Admin login
7. **AdminDashboard** - Admin dashboard
8. **CustomerDashboard** - Customer dashboard
9. **VendorDashboard** - Vendor dashboard
10. **DeliveryPartnerDashboard** - Delivery partner dashboard
11. **Cart** - Shopping cart page
12. **OrderHistory** - Order history page
13. **Profile** - User profile page
14. **Vendors** - Vendor listing page
15. **VendorRegistration** - Vendor registration form
16. **DeliveryPartnerRegistration** - Delivery partner registration
17. **DeliveryMap** - Delivery tracking map
18. **DeliveryProfile** - Delivery partner profile
19. **SubscriptionPage** - Subscription management page
20. **CheckoutPage** - Checkout page
21. **ForgotPassword** - Password reset request
22. **ResetPassword** - Password reset form
23. **ErrorPage** - Error page
24. **Unauthorized** - Unauthorized access page

## 🔄 Real-time Features (Socket.IO)

### Events
- `connection` - Client connected
- `disconnect` - Client disconnected
- `order_update` - Order status updated
- `meal_update` - Meal availability updated
- `location_update` - Delivery partner location updated
- `notification` - New notification
- `delivery_assigned` - Delivery partner assigned to order

### Rooms
- `vendor_{vendorId}` - Vendor-specific room
- `customer_{customerId}` - Customer-specific room
- `delivery_{deliveryId}` - Delivery partner-specific room
- `order_{orderId}` - Order-specific room

## 🔒 Security Features

1. **Helmet** - Security headers
2. **Rate Limiting** - Prevent brute force attacks
3. **XSS Protection** - Cross-site scripting prevention
4. **HPP** - HTTP parameter pollution prevention
5. **Mongo Sanitize** - NoSQL injection prevention
6. **CORS** - Cross-origin resource sharing configuration
7. **JWT** - Secure token-based authentication
8. **Bcrypt** - Password hashing
9. **Input Validation** - express-validator for input sanitization
10. **File Upload Validation** - Multer with file type and size restrictions

## 📊 Analytics & Reporting

### Vendor Analytics
- Total orders
- Revenue (daily, weekly, monthly)
- Popular items
- Customer ratings
- Order completion rate
- Average preparation time
- Peak hours analysis

### Admin Analytics
- Total users (customers, vendors, delivery partners)
- Total orders
- Revenue
- Active subscriptions
- Platform commission
- User growth rate
- Order trends

### Delivery Partner Analytics
- Total deliveries
- Earnings (daily, weekly, monthly)
- Average delivery time
- Customer ratings
- Acceptance rate

## 🎯 Key Features Implementation

### 1. Smart Delivery Assignment System
- Automatic assignment based on proximity
- Real-time location tracking
- Delivery partner availability status
- Order priority queue

### 2. Subscription Management
- Flexible plans (daily, weekly, monthly)
- Meal type selection
- Delivery day customization
- Pause/resume functionality
- Auto-renewal option

### 3. Real-time Order Tracking
- Live location updates
- Status notifications
- Estimated delivery time
- Delivery partner contact

### 4. Guest Cart Flow
- Add items without login
- Cart persistence in localStorage
- Prompt to login at checkout
- Cart transfer after login

### 5. Wishlist Feature
- Save favorite meals
- Quick add to cart
- Availability notifications

### 6. Group Orders
- Create group order
- Share link with participants
- Individual item selection
- Split payment

### 7. Rating & Review System
- Rate food quality
- Rate delivery service
- Written reviews
- Photo uploads

### 8. Notification System
- In-app notifications
- Email notifications
- Push notifications (optional)
- Real-time updates via Socket.IO

## 🚀 Deployment Configuration

### Environment Variables

#### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:3000
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
STRIPE_SECRET_KEY=your_stripe_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_RAZORPAY_KEY=your_razorpay_key
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_key
```

### Scripts

#### Root package.json
```json
{
  "scripts": {
    "start:frontend": "cd lunchbox-frontend && npm start",
    "start:backend": "cd lunchbox-backend && npm start",
    "dev": "concurrently \"npm run start:backend\" \"npm run start:frontend\"",
    "install:all": "npm install && cd lunchbox-frontend && npm install && cd ../lunchbox-backend && npm install"
  }
}
```

## 🧪 Testing

### Frontend Testing
- Unit tests with Jest
- Component tests with React Testing Library
- Accessibility tests with jest-axe
- Integration tests for user flows

### Backend Testing
- API endpoint tests
- Authentication tests
- Database operation tests
- Integration tests

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 320px, 375px, 480px, 768px, 1024px, 1440px, 1920px
- Touch-friendly UI elements
- Optimized images and assets
- Progressive Web App (PWA) ready

## 🎨 Design System

### Colors
- Primary: #fc8019 (Orange)
- Secondary: #3d4152 (Dark Gray)
- Success: #60b246 (Green)
- Error: #e23744 (Red)
- Warning: #f7b731 (Yellow)
- Info: #3498db (Blue)
- Background: #ffffff (White)
- Text: #3d4152 (Dark Gray)

### Typography
- Font Family: System fonts (San Francisco, Segoe UI, Roboto)
- Headings: Bold, 24px-48px
- Body: Regular, 14px-16px
- Small: Regular, 12px-14px

### Spacing
- Base unit: 8px
- Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

## 🔧 Development Guidelines

1. **Code Style**: Use ESLint and Prettier
2. **Git Workflow**: Feature branches, pull requests, code reviews
3. **Commit Messages**: Conventional commits format
4. **Documentation**: JSDoc for functions, README for modules
5. **Error Handling**: Try-catch blocks, error middleware
6. **Logging**: Winston for backend, console for frontend (development only)
7. **Performance**: Lazy loading, code splitting, image optimization
8. **Accessibility**: WCAG 2.1 AA compliance

## 📦 Installation & Setup

1. Clone repository
2. Install dependencies: `npm run install:all`
3. Set up environment variables
4. Start MongoDB
5. Run backend: `cd lunchbox-backend && npm start`
6. Run frontend: `cd lunchbox-frontend && npm start`
7. Access application at http://localhost:3000

## 🎯 Default Admin Credentials
- Email: admin@example.com
- Password: admin123

## 📝 Additional Notes

- Use MongoDB Atlas for cloud database
- Implement proper error boundaries in React
- Use React.memo for performance optimization
- Implement proper loading states
- Add skeleton loaders for better UX
- Use debouncing for search inputs
- Implement infinite scroll for meal listings
- Add image compression before upload
- Use CDN for static assets in production
- Implement proper SEO meta tags
- Add sitemap.xml and robots.txt
- Implement proper caching strategies
- Use service workers for offline support
- Add analytics tracking (Google Analytics)
- Implement A/B testing framework
- Add feature flags for gradual rollouts
- Implement proper monitoring and alerting
- Use Docker for containerization
- Set up CI/CD pipeline
- Implement automated testing in pipeline
- Add performance monitoring
- Implement proper backup strategies
- Use environment-specific configurations
- Add health check endpoints
- Implement graceful shutdown
- Use connection pooling for database
- Implement request/response compression
- Add API versioning
- Implement proper API documentation (Swagger)
- Use TypeScript for better type safety (optional)
- Implement proper state management (Redux/Zustand if needed)
- Add internationalization (i18n) support
- Implement dark mode support
- Add print-friendly styles
- Implement proper form validation
- Use optimistic UI updates
- Add undo/redo functionality where applicable
- Implement proper data pagination
- Use virtual scrolling for large lists
- Add keyboard shortcuts for power users
- Implement proper focus management
- Add skip links for accessibility
- Use proper ARIA labels
- Implement proper color contrast
- Add text alternatives for images
- Implement proper heading hierarchy
- Use semantic HTML elements
- Add proper form labels
- Implement proper error messages
- Use proper button types
- Add loading indicators
- Implement proper empty states
- Add proper success messages
- Use proper modal dialogs
- Implement proper tooltips
- Add proper breadcrumbs
- Use proper pagination controls
- Implement proper sorting controls
- Add proper filter controls
- Use proper date pickers
- Implement proper time pickers
- Add proper file upload UI
- Use proper progress indicators
- Implement proper confirmation dialogs
- Add proper warning messages
- Use proper info messages

---

**This prompt provides a complete blueprint for building the Rasan food delivery platform. Implement each section systematically, starting with the backend models and API, then the frontend components and pages, and finally the real-time features and integrations.**
