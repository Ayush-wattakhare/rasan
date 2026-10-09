# Requirements Document: Rasan Food Delivery Platform

## Introduction

Rasan is a comprehensive food delivery platform that connects customers, vendors, delivery partners, and administrators in a seamless ecosystem. The platform enables customers to browse and order meals from local vendors, subscribe to meal plans, track deliveries in real-time, and participate in group orders. Vendors can manage their menus, process orders, and access analytics. Delivery partners can accept orders, track earnings, and navigate to delivery locations. Administrators oversee the entire platform with comprehensive analytics and user management capabilities.

The system is built on Next.js 14+ with App Router and Supabase (PostgreSQL, Auth, Storage, Realtime), integrating Razorpay and Stripe for payments, and supporting real-time order tracking with location updates.

## Glossary

- **System**: The Rasan food delivery platform
- **Customer**: A user who browses meals, places orders, and manages subscriptions
- **Vendor**: A food business that lists meals and fulfills orders
- **Delivery_Partner**: A person who delivers orders from vendors to customers
- **Admin**: A platform administrator with elevated permissions
- **Order**: A transaction containing meal items, delivery details, and payment information
- **Meal**: A food item listed by a vendor with price, description, and availability
- **Subscription**: A recurring meal delivery plan with scheduled deliveries
- **Group_Order**: A collaborative order where multiple participants contribute items
- **Payment_Gateway**: External payment service (Razorpay or Stripe)
- **Realtime_Channel**: Supabase realtime subscription for live updates
- **RLS**: Row Level Security policies in PostgreSQL
- **Order_Status**: The current state of an order (pending, confirmed, preparing, ready, picked_up, out_for_delivery, delivered, cancelled)
- **Payment_Status**: The payment state (pending, paid, failed, refunded)
- **Location**: Geographic coordinates (latitude and longitude)
- **Tracking_Update**: A timestamped status change with optional location data
- **Session**: An authenticated user session with JWT token
- **Profile**: User account information extending Supabase auth.users

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a user, I want to securely register, log in, and access role-specific features, so that I can use the platform according to my role (customer, vendor, delivery partner, or admin).

#### Acceptance Criteria

1. WHEN a user registers with valid email, password, name, and role, THE System SHALL create a new user account and profile
2. WHEN a user logs in with correct credentials, THE System SHALL authenticate the user and create a session
3. WHEN a user logs in with incorrect credentials, THE System SHALL reject the authentication and return an error message
4. WHEN an authenticated user accesses a protected route, THE Middleware SHALL verify the session token and allow access
5. WHEN an unauthenticated user accesses a protected route, THE Middleware SHALL redirect to the login page
6. WHEN a user requests password reset, THE System SHALL send a password reset email with a secure token
7. WHEN a user submits a valid reset token and new password, THE System SHALL update the password
8. WHERE a user has a specific role, THE System SHALL restrict access to role-appropriate routes and features
9. WHEN a user logs out, THE System SHALL invalidate the session and clear authentication cookies

### Requirement 2: User Profile Management

**User Story:** As a user, I want to manage my profile information, addresses, and account settings, so that I can keep my information current and accurate.

#### Acceptance Criteria

1. WHEN a user views their profile, THE System SHALL display current profile information including name, email, phone, avatar, and addresses
2. WHEN a user updates their profile information, THE System SHALL validate and save the changes
3. WHEN a user uploads a profile avatar, THE System SHALL store the image in Supabase Storage and update the avatar_url
4. WHEN a user adds a new address, THE System SHALL validate the address format and coordinates
5. WHEN a user updates their password, THE System SHALL require current password verification before allowing the change
6. THE System SHALL enforce RLS policies ensuring users can only view and update their own profile data

### Requirement 3: Meal Browsing and Search

**User Story:** As a customer, I want to browse and search for meals with filters, so that I can find meals that match my preferences and dietary requirements.

#### Acceptance Criteria

1. WHEN a customer views the meals page, THE System SHALL display available meals with pagination
2. WHEN a customer applies filters (category, meal type, vegetarian, price range), THE System SHALL return meals matching all filter criteria
3. WHEN a customer searches for meals by name or description, THE System SHALL return relevant results
4. WHEN a customer sorts meals (by price, rating, or popularity), THE System SHALL order results accordingly
5. WHEN a customer clicks on a meal, THE System SHALL display detailed information including ingredients, allergens, nutritional info, and reviews
6. THE System SHALL only display meals where is_available is true
7. WHERE a meal has stock tracking enabled, THE System SHALL only display meals with stock greater than zero

### Requirement 4: Vendor Discovery

**User Story:** As a customer, I want to discover nearby vendors and view their menus, so that I can choose where to order from.

#### Acceptance Criteria

1. WHEN a customer provides their location, THE System SHALL query nearby vendors within a specified radius using the nearby_vendors database function
2. WHEN displaying vendors, THE System SHALL show distance from customer location, cuisine types, rating, and operating hours
3. WHEN a customer filters vendors by cuisine type, THE System SHALL return only vendors offering that cuisine
4. WHEN a customer clicks on a vendor, THE System SHALL display vendor details, menu, operating hours, and reviews
5. THE System SHALL only display vendors where is_active is true
6. WHEN a customer views a vendor outside operating hours, THE System SHALL indicate the vendor is currently closed

### Requirement 5: Shopping Cart Management

**User Story:** As a customer, I want to add meals to a cart, modify quantities, and review my order before checkout, so that I can control what I purchase.

#### Acceptance Criteria

1. WHEN a customer adds a meal to the cart, THE System SHALL store the cart item with meal details, quantity, and price
2. WHEN a customer updates the quantity of a cart item, THE System SHALL recalculate the cart subtotal
3. WHEN a customer removes an item from the cart, THE System SHALL update the cart and recalculate totals
4. WHEN a customer views the cart, THE System SHALL display all items, quantities, individual prices, and total amount
5. THE System SHALL persist cart data in browser local storage to maintain state across sessions
6. WHEN a customer adds items from multiple vendors, THE System SHALL prevent checkout and display an error message
7. THE System SHALL calculate subtotal as the sum of (item price × quantity) for all cart items

### Requirement 6: Order Placement and Payment

**User Story:** As a customer, I want to place orders and pay securely using multiple payment methods, so that I can complete my purchase conveniently.

#### Acceptance Criteria

1. WHEN a customer proceeds to checkout, THE System SHALL validate that all cart items are still available
2. WHEN a customer selects a delivery address, THE System SHALL calculate delivery fee based on distance from vendor
3. WHEN a customer reviews the order, THE System SHALL display subtotal, delivery fee, tax, discount, and total
4. WHEN a customer selects a payment method (Razorpay, Stripe, or cash), THE System SHALL process the order accordingly
5. WHERE payment method is Razorpay or Stripe, THE System SHALL create a payment order and redirect to the payment gateway
6. WHEN payment is successful, THE System SHALL update order payment_status to paid and order status to confirmed
7. WHEN payment fails, THE System SHALL rollback the order transaction and return an error message
8. WHEN an order is created, THE System SHALL generate a unique order_number
9. WHEN an order is created, THE System SHALL send a real-time notification to the vendor
10. WHERE meals have stock tracking, THE System SHALL decrement stock for each ordered item
11. THE System SHALL ensure order total equals subtotal plus delivery_fee plus tax minus discount

### Requirement 7: Order Tracking and Status Updates

**User Story:** As a customer, I want to track my order status in real-time and see delivery progress, so that I know when to expect my food.

#### Acceptance Criteria

1. WHEN a customer views an order, THE System SHALL display current status, tracking updates, and estimated delivery time
2. WHEN an order status changes, THE System SHALL emit a real-time event via Supabase Realtime
3. WHEN a customer subscribes to order updates, THE System SHALL push status changes to the client in real-time
4. WHEN a delivery partner updates their location, THE System SHALL broadcast location updates to customers with active orders
5. WHEN displaying order tracking, THE System SHALL show a timeline of all status transitions with timestamps
6. THE System SHALL calculate and display estimated time of arrival based on delivery partner location and delivery address
7. WHEN an order is delivered, THE System SHALL record the actual_delivery_time

### Requirement 8: Order Rating and Reviews

**User Story:** As a customer, I want to rate and review my orders, so that I can provide feedback and help other customers make informed decisions.

#### Acceptance Criteria

1. WHEN an order status is delivered, THE System SHALL allow the customer to submit a rating
2. WHEN a customer submits a rating, THE System SHALL accept separate ratings for food quality and delivery service (1-5 scale)
3. WHEN a customer submits a rating, THE System SHALL optionally accept a text comment
4. WHEN a rating is submitted, THE System SHALL update the vendor rating and delivery partner rating
5. WHEN a customer submits a meal review, THE System SHALL update the meal's average rating
6. THE System SHALL ensure rating values are integers between 1 and 5 inclusive
7. THE System SHALL prevent duplicate reviews for the same meal and order combination

### Requirement 9: Subscription Management

**User Story:** As a customer, I want to create and manage meal subscriptions with recurring deliveries, so that I can receive regular meals without placing individual orders.

#### Acceptance Criteria

1. WHEN a customer creates a subscription, THE System SHALL accept plan type (daily, weekly, monthly), meal type, delivery days, delivery time, and address
2. WHEN a subscription is created, THE System SHALL generate a delivery schedule for all dates between start_date and end_date
3. WHEN generating delivery schedule, THE System SHALL only include dates matching the selected delivery_days
4. WHEN a subscription is active, THE System SHALL automatically create orders for upcoming deliveries (next 7 days)
5. WHEN a customer pauses a subscription, THE System SHALL set status to paused and skip scheduled deliveries
6. WHEN a customer resumes a subscription, THE System SHALL set status to active and resume scheduled deliveries
7. WHEN a customer cancels a subscription, THE System SHALL set status to cancelled and process any applicable refund
8. WHERE auto_renew is true, THE System SHALL attempt to renew the subscription when end_date is reached
9. WHEN subscription payment fails, THE System SHALL set status to paused and notify the customer
10. THE System SHALL ensure subscription status is active only when start_date ≤ current_date ≤ end_date and payment_status is paid

### Requirement 10: Group Orders

**User Story:** As a customer, I want to create group orders where multiple people can add items and split the cost, so that I can order with friends or colleagues.

#### Acceptance Criteria

1. WHEN a customer creates a group order, THE System SHALL generate a unique group_id and shareable link
2. WHEN a participant joins a group order via the link, THE System SHALL add them to the participants list
3. WHEN a participant adds items to a group order, THE System SHALL record their items and contribution amount
4. WHEN the host finalizes a group order, THE System SHALL create an order with all participants' items
5. WHEN a group order expires, THE System SHALL set status to closed and prevent further modifications
6. THE System SHALL calculate each participant's contribution as the sum of their item prices
7. THE System SHALL ensure group order status is open only before expires_at timestamp

### Requirement 11: Vendor Menu Management

**User Story:** As a vendor, I want to manage my menu by adding, updating, and removing meals, so that I can control what customers can order.

#### Acceptance Criteria

1. WHEN a vendor creates a meal, THE System SHALL accept name, description, category, meal_type, price, image, ingredients, allergens, nutritional_info, is_veg, stock, and preparation_time
2. WHEN a vendor uploads a meal image, THE System SHALL store it in Supabase Storage and save the image_url
3. WHEN a vendor updates a meal, THE System SHALL validate and save the changes
4. WHEN a vendor deletes a meal, THE System SHALL remove it from the database
5. WHEN a vendor marks a meal as unavailable, THE System SHALL set is_available to false
6. WHERE a meal has stock tracking, WHEN stock reaches zero, THE System SHALL automatically set is_available to false
7. THE System SHALL enforce RLS policies ensuring vendors can only manage their own meals

### Requirement 12: Vendor Order Management

**User Story:** As a vendor, I want to receive and manage incoming orders, so that I can prepare and fulfill customer orders efficiently.

#### Acceptance Criteria

1. WHEN a new order is placed, THE System SHALL send a real-time notification to the vendor
2. WHEN a vendor views orders, THE System SHALL display orders filtered by status with order details
3. WHEN a vendor updates order status to preparing, THE System SHALL update the order and notify the customer
4. WHEN a vendor updates order status to ready, THE System SHALL trigger delivery partner assignment
5. WHEN a vendor updates order status, THE System SHALL add a tracking update with timestamp
6. THE System SHALL enforce RLS policies ensuring vendors can only view and update their own orders
7. THE System SHALL validate status transitions to prevent invalid state changes

### Requirement 13: Vendor Analytics

**User Story:** As a vendor, I want to view analytics about my sales, popular meals, and performance, so that I can make informed business decisions.

#### Acceptance Criteria

1. WHEN a vendor views analytics, THE System SHALL display total orders, total revenue, and average order value for the selected date range
2. WHEN displaying analytics, THE System SHALL show popular meals ranked by order count
3. WHEN displaying analytics, THE System SHALL show revenue by day as a time series chart
4. WHEN displaying analytics, THE System SHALL show order distribution by status
5. THE System SHALL calculate metrics based only on the vendor's orders
6. THE System SHALL enforce RLS policies ensuring vendors can only view their own analytics

### Requirement 14: Delivery Partner Assignment

**User Story:** As the system, I want to automatically assign delivery partners to orders, so that orders are delivered efficiently.

#### Acceptance Criteria

1. WHEN an order status changes to ready, THE System SHALL invoke the assign_delivery_partner database function
2. WHEN assigning a delivery partner, THE System SHALL find online, verified partners with no active deliveries
3. WHEN multiple partners are available, THE System SHALL select the nearest partner based on distance from vendor location
4. WHEN a delivery partner is assigned, THE System SHALL update the order delivery_partner_id
5. WHEN a delivery partner is assigned, THE System SHALL send a real-time notification to the partner
6. WHEN no delivery partners are available, THE System SHALL return null and keep the order in ready status
7. WHEN no partners are available, THE System SHALL retry assignment every 2 minutes
8. IF no partner is assigned after 15 minutes, THE System SHALL escalate to admin and notify the customer

### Requirement 15: Delivery Partner Availability

**User Story:** As a delivery partner, I want to control my online status and receive order assignments, so that I can manage my work schedule.

#### Acceptance Criteria

1. WHEN a delivery partner sets is_online to true, THE System SHALL make them available for order assignments
2. WHEN a delivery partner sets is_online to false, THE System SHALL exclude them from order assignments
3. WHEN a delivery partner views available orders, THE System SHALL display unassigned orders near their current location
4. WHEN a delivery partner accepts an order, THE System SHALL assign the order and update status
5. THE System SHALL enforce RLS policies ensuring delivery partners can only update their own status
6. THE System SHALL ensure only verified delivery partners (is_verified = true) can receive assignments

### Requirement 16: Delivery Tracking and Location Updates

**User Story:** As a delivery partner, I want to update my location during delivery, so that customers can track my progress in real-time.

#### Acceptance Criteria

1. WHEN a delivery partner updates their location, THE System SHALL validate coordinates are within valid ranges (lat: -90 to 90, lng: -180 to 180)
2. WHEN a delivery partner updates their location, THE System SHALL save current_location in the database
3. WHEN a delivery partner updates their location, THE System SHALL broadcast location updates via Realtime to customers with active orders
4. WHEN broadcasting location updates, THE System SHALL calculate and include estimated time of arrival
5. WHEN a delivery partner updates order status to picked_up, THE System SHALL notify the customer
6. WHEN a delivery partner updates order status to out_for_delivery, THE System SHALL enable real-time location tracking
7. WHEN a delivery partner updates order status to delivered, THE System SHALL record actual_delivery_time and update earnings

### Requirement 17: Delivery Partner Earnings

**User Story:** As a delivery partner, I want to track my earnings and delivery history, so that I can monitor my income.

#### Acceptance Criteria

1. WHEN an order is delivered, THE System SHALL add the delivery_fee to the delivery partner's earnings
2. WHEN updating earnings, THE System SHALL increment today, this_week, this_month, and total earnings
3. WHEN a delivery partner views earnings, THE System SHALL display earnings breakdown by time period
4. WHEN a delivery partner views earnings, THE System SHALL display list of completed deliveries with amounts
5. THE System SHALL update delivery partner total_deliveries count when an order is delivered
6. THE System SHALL update delivery partner rating based on delivery ratings from orders

### Requirement 18: Admin User Management

**User Story:** As an admin, I want to manage users, vendors, and delivery partners, so that I can maintain platform quality and handle issues.

#### Acceptance Criteria

1. WHEN an admin views users, THE System SHALL display all users with filters by role, active status, and verification status
2. WHEN an admin updates a user's is_active status, THE System SHALL enable or disable the user account
3. WHEN an admin updates a user's is_verified status, THE System SHALL verify or unverify the user
4. WHEN an admin deletes a user, THE System SHALL remove the user and cascade delete related data
5. THE System SHALL enforce role-based access control ensuring only admins can access user management features
6. WHEN an admin views vendors, THE System SHALL display vendor verification status and documents

### Requirement 19: Admin Analytics Dashboard

**User Story:** As an admin, I want to view platform-wide analytics, so that I can monitor business performance and identify trends.

#### Acceptance Criteria

1. WHEN an admin views the dashboard, THE System SHALL display total users, total orders, total revenue, and active subscriptions
2. WHEN displaying analytics, THE System SHALL show user distribution by role
3. WHEN displaying analytics, THE System SHALL show order distribution by status
4. WHEN displaying analytics, THE System SHALL show revenue by day as a time series
5. WHEN displaying analytics, THE System SHALL show top vendors ranked by revenue
6. WHEN displaying analytics, THE System SHALL show top meals ranked by order count
7. THE System SHALL calculate all metrics for the selected date range
8. THE System SHALL enforce role-based access control ensuring only admins can view platform analytics

### Requirement 20: Real-time Notifications

**User Story:** As a user, I want to receive real-time notifications about important events, so that I stay informed about my orders, deliveries, and account activity.

#### Acceptance Criteria

1. WHEN an order is created, THE System SHALL send a notification to the vendor
2. WHEN an order status changes, THE System SHALL send a notification to the customer
3. WHEN a delivery partner is assigned, THE System SHALL send a notification to the delivery partner
4. WHEN a payment fails, THE System SHALL send a notification to the customer
5. WHEN a subscription is about to expire, THE System SHALL send a notification to the customer
6. WHEN a notification is created, THE System SHALL store it in the notifications table
7. WHEN a user views notifications, THE System SHALL display unread notifications prominently
8. WHEN a user marks a notification as read, THE System SHALL update is_read to true
9. THE System SHALL enforce RLS policies ensuring users can only view their own notifications

### Requirement 21: Payment Processing

**User Story:** As the system, I want to process payments securely through Razorpay and Stripe, so that customers can pay for orders and subscriptions.

#### Acceptance Criteria

1. WHEN creating a payment order, THE System SHALL call the payment gateway API with order amount and currency
2. WHEN a payment is successful, THE System SHALL verify the payment signature to ensure authenticity
3. WHEN a payment is verified, THE System SHALL update order payment_status to paid and store payment_id
4. WHEN a payment fails, THE System SHALL update payment_status to failed and log the error
5. WHEN processing a refund, THE System SHALL call the payment gateway refund API
6. WHEN a refund is successful, THE System SHALL update payment_status to refunded
7. THE System SHALL handle payment webhooks from Razorpay and Stripe to process asynchronous payment updates
8. THE System SHALL validate webhook signatures to prevent fraudulent requests
9. THE System SHALL implement idempotency for payment operations to prevent duplicate charges

### Requirement 22: File Upload and Storage

**User Story:** As a user, I want to upload images for meals, profiles, and documents, so that I can provide visual information.

#### Acceptance Criteria

1. WHEN a user uploads an image, THE System SHALL validate file type (JPEG, PNG, WebP)
2. WHEN a user uploads an image, THE System SHALL validate file size is within limits
3. WHEN an image upload is successful, THE System SHALL store the file in Supabase Storage
4. WHEN an image is stored, THE System SHALL return the public URL
5. IF an image upload fails, THE System SHALL return an error message and not save the record
6. WHEN a user deletes a record with an image, THE System SHALL clean up the associated storage file
7. THE System SHALL enforce storage bucket policies based on user roles

### Requirement 23: Search and Filtering

**User Story:** As a customer, I want to search and filter meals and vendors efficiently, so that I can quickly find what I'm looking for.

#### Acceptance Criteria

1. WHEN a customer searches for meals, THE System SHALL perform case-insensitive text search on name and description
2. WHEN a customer applies multiple filters, THE System SHALL combine filters with AND logic
3. WHEN displaying search results, THE System SHALL implement pagination with configurable page size
4. WHEN a customer sorts results, THE System SHALL order by the selected field (price, rating, name)
5. THE System SHALL use database indexes to optimize search and filter queries
6. THE System SHALL return results within 200ms for typical queries

### Requirement 24: Data Validation and Integrity

**User Story:** As the system, I want to validate all data inputs and maintain referential integrity, so that the database remains consistent and reliable.

#### Acceptance Criteria

1. WHEN creating or updating records, THE System SHALL validate all required fields are present
2. WHEN validating email addresses, THE System SHALL ensure proper email format
3. WHEN validating phone numbers, THE System SHALL ensure proper format for the region
4. WHEN validating coordinates, THE System SHALL ensure latitude is between -90 and 90 and longitude is between -180 and 180
5. WHEN validating prices, THE System SHALL ensure values are positive numbers
6. WHEN validating ratings, THE System SHALL ensure values are integers between 1 and 5
7. THE System SHALL enforce foreign key constraints to maintain referential integrity
8. THE System SHALL use database transactions for operations that modify multiple tables
9. IF a validation fails, THE System SHALL return a descriptive error message

### Requirement 25: Performance and Scalability

**User Story:** As the system, I want to maintain fast response times and handle increasing load, so that users have a smooth experience.

#### Acceptance Criteria

1. THE System SHALL respond to API requests within 200ms for simple queries
2. THE System SHALL respond to database queries within 100ms for indexed queries
3. THE System SHALL implement pagination for all list endpoints with default limit of 20 items
4. THE System SHALL use database indexes on frequently queried columns
5. THE System SHALL use Supabase connection pooling to manage database connections efficiently
6. THE System SHALL cache frequently accessed data with appropriate revalidation periods
7. THE System SHALL use Next.js Server Components for optimal data fetching performance
8. THE System SHALL implement rate limiting (100 requests per minute for authenticated users)

### Requirement 26: Security and Access Control

**User Story:** As the system, I want to enforce security policies and access controls, so that user data is protected and unauthorized access is prevented.

#### Acceptance Criteria

1. THE System SHALL enable Row Level Security on all database tables
2. THE System SHALL enforce RLS policies ensuring users can only access their own data
3. THE System SHALL verify authentication tokens on all protected API routes
4. THE System SHALL validate user permissions before allowing operations
5. THE System SHALL hash passwords using bcrypt (handled by Supabase Auth)
6. THE System SHALL use HTTPS for all API requests
7. THE System SHALL set secure HTTP headers (CSP, HSTS, X-Frame-Options)
8. THE System SHALL sanitize all user inputs to prevent XSS attacks
9. THE System SHALL use parameterized queries to prevent SQL injection
10. THE System SHALL never log sensitive information (passwords, payment details)
11. THE System SHALL encrypt sensitive data at rest
12. THE System SHALL rotate JWT tokens with 1-hour expiration

### Requirement 27: Error Handling and Recovery

**User Story:** As the system, I want to handle errors gracefully and provide recovery mechanisms, so that users can recover from failures.

#### Acceptance Criteria

1. WHEN a database transaction fails, THE System SHALL rollback all changes
2. WHEN a payment fails, THE System SHALL allow the user to retry with the same order
3. WHEN a meal becomes unavailable during checkout, THE System SHALL notify the user and suggest alternatives
4. WHEN no delivery partners are available, THE System SHALL queue the order and retry assignment
5. WHEN a real-time connection is lost, THE System SHALL attempt automatic reconnection with exponential backoff
6. WHEN an image upload fails, THE System SHALL allow the user to retry
7. WHEN an API request fails, THE System SHALL return appropriate HTTP status codes and error messages
8. THE System SHALL log all errors with stack traces for debugging
9. IF repeated failures occur, THE System SHALL alert the development team

### Requirement 28: Geospatial Queries

**User Story:** As the system, I want to perform efficient geospatial queries for vendor discovery and delivery assignment, so that location-based features work accurately.

#### Acceptance Criteria

1. THE System SHALL use PostGIS extension for geospatial data types and functions
2. WHEN finding nearby vendors, THE System SHALL use ST_DWithin to filter vendors within radius
3. WHEN calculating distance, THE System SHALL use ST_Distance with geography type for accurate results
4. WHEN sorting by distance, THE System SHALL order results by calculated distance
5. THE System SHALL use spatial indexes (GIST) on location columns for query performance
6. THE System SHALL store coordinates in EPSG:4326 (WGS 84) coordinate system
7. WHEN calculating delivery fee, THE System SHALL use the calculate_delivery_fee database function

### Requirement 29: Automated Database Triggers

**User Story:** As the system, I want to automatically update aggregate data and maintain consistency, so that derived values are always accurate.

#### Acceptance Criteria

1. WHEN a review is created or updated, THE System SHALL automatically update the meal's average rating
2. WHEN an order is delivered, THE System SHALL automatically update vendor total_orders and rating
3. WHEN an order is delivered, THE System SHALL automatically update delivery partner total_deliveries, earnings, and rating
4. WHEN a record is updated, THE System SHALL automatically update the updated_at timestamp
5. WHEN an order is created, THE System SHALL automatically generate a unique order_number
6. THE System SHALL use database triggers to maintain data consistency without application logic

### Requirement 30: Subscription Scheduling

**User Story:** As the system, I want to automatically schedule and create subscription deliveries, so that customers receive their meals on time without manual intervention.

#### Acceptance Criteria

1. WHEN a subscription is created, THE System SHALL generate delivery schedule for all dates in the subscription period
2. WHEN generating schedule, THE System SHALL only include dates matching delivery_days
3. THE System SHALL automatically create orders for deliveries scheduled in the next 7 days
4. WHEN a subscription delivery date arrives, THE System SHALL create an order and link it to the delivery record
5. WHEN a subscription is paused, THE System SHALL skip scheduled deliveries
6. WHEN a subscription payment fails, THE System SHALL pause the subscription and notify the customer
7. WHERE auto_renew is true, THE System SHALL attempt renewal 1 day before end_date
8. THE System SHALL update subscription status to completed when end_date is passed and auto_renew is false
