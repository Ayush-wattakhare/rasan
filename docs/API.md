# Rasan API Documentation

## Overview

The Rasan API is built using Next.js API Routes and follows RESTful principles. All endpoints require authentication unless specified otherwise.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All authenticated requests must include a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained through Supabase Auth and automatically managed by the client.

## Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": { ... }
}
```

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Endpoints

### Authentication

#### POST /api/auth/callback
Handle OAuth callback from Supabase Auth.

**Public Endpoint**

---

### Meals

#### GET /api/meals
Get list of meals with optional filters.

**Query Parameters:**
- `category` (string, optional) - Filter by category
- `meal_type` (string, optional) - breakfast, lunch, dinner, snack
- `is_veg` (boolean, optional) - Filter vegetarian meals
- `vendor_id` (string, optional) - Filter by vendor
- `search` (string, optional) - Search in name and description
- `min_price` (number, optional) - Minimum price
- `max_price` (number, optional) - Maximum price
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "vendor_id": "uuid",
      "name": "Chicken Biryani",
      "description": "Aromatic basmati rice with tender chicken",
      "category": "Main Course",
      "meal_type": "lunch",
      "price": 299,
      "discount_price": 249,
      "image_url": "https://...",
      "is_veg": false,
      "is_available": true,
      "rating": 4.5,
      "preparation_time": 30
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### GET /api/meals/[id]
Get meal details by ID.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "vendor_id": "uuid",
    "name": "Chicken Biryani",
    "description": "Aromatic basmati rice with tender chicken",
    "category": "Main Course",
    "meal_type": "lunch",
    "price": 299,
    "ingredients": ["Rice", "Chicken", "Spices"],
    "allergens": ["Dairy"],
    "nutritional_info": {
      "calories": 450,
      "protein": 25,
      "carbs": 60,
      "fat": 15
    },
    "vendor": {
      "id": "uuid",
      "business_name": "Biryani House",
      "rating": 4.5
    }
  }
}
```

#### POST /api/meals
Create a new meal (Vendor only).

**Request Body:**
```json
{
  "name": "Chicken Biryani",
  "description": "Aromatic basmati rice",
  "category": "Main Course",
  "meal_type": "lunch",
  "price": 299,
  "image_url": "https://...",
  "ingredients": ["Rice", "Chicken"],
  "allergens": ["Dairy"],
  "is_veg": false,
  "preparation_time": 30
}
```

#### PUT /api/meals/[id]
Update meal (Vendor only).

#### DELETE /api/meals/[id]
Delete meal (Vendor only).

---

### Orders

#### GET /api/orders
Get user's orders.

**Query Parameters:**
- `status` (string, optional) - Filter by status
- `page` (number, optional)
- `limit` (number, optional)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "order_number": "ORD-20240101-1234",
      "status": "confirmed",
      "payment_status": "paid",
      "total": 712.8,
      "items": [...],
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### GET /api/orders/[id]
Get order details.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "order_number": "ORD-20240101-1234",
    "customer_id": "uuid",
    "vendor_id": "uuid",
    "items": [
      {
        "meal_id": "uuid",
        "name": "Chicken Biryani",
        "quantity": 2,
        "price": 299
      }
    ],
    "subtotal": 598,
    "delivery_fee": 50,
    "tax": 64.8,
    "total": 712.8,
    "status": "confirmed",
    "payment_status": "paid",
    "delivery_address": {...},
    "tracking_updates": [...]
  }
}
```

#### POST /api/orders
Create a new order.

**Request Body:**
```json
{
  "vendor_id": "uuid",
  "items": [
    {
      "meal_id": "uuid",
      "quantity": 2,
      "customizations": []
    }
  ],
  "delivery_address": {
    "street": "123 Main St",
    "city": "Bangalore",
    "state": "Karnataka",
    "zip_code": "560001",
    "coordinates": {
      "lat": 12.9716,
      "lng": 77.5946
    }
  },
  "payment_method": "card",
  "delivery_instructions": "Ring the bell"
}
```

---

### Vendors

#### GET /api/vendors
Get list of vendors.

**Query Parameters:**
- `lat` (number, required) - User latitude
- `lng` (number, required) - User longitude
- `radius` (number, optional) - Search radius in km (default: 10)
- `cuisine` (string, optional) - Filter by cuisine type

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "business_name": "Biryani House",
      "cuisine": ["Indian", "Biryani"],
      "rating": 4.5,
      "distance": 2.3,
      "is_active": true,
      "operating_hours": {...}
    }
  ]
}
```

#### GET /api/vendors/[id]
Get vendor details.

---

### Subscriptions

#### GET /api/subscriptions
Get user's subscriptions.

#### POST /api/subscriptions
Create a new subscription.

**Request Body:**
```json
{
  "vendor_id": "uuid",
  "plan_type": "weekly",
  "meal_type": "lunch",
  "start_date": "2024-01-01",
  "end_date": "2024-03-31",
  "delivery_days": ["monday", "wednesday", "friday"],
  "delivery_time": "13:00",
  "address": {...}
}
```

#### POST /api/subscriptions/[id]/pause
Pause a subscription.

#### POST /api/subscriptions/[id]/resume
Resume a paused subscription.

#### POST /api/subscriptions/[id]/cancel
Cancel a subscription.

---

### Payments

#### POST /api/payments/create-order
Create a payment order.

**Request Body:**
```json
{
  "order_id": "uuid",
  "amount": 712.8,
  "currency": "INR",
  "payment_method": "razorpay"
}
```

**Response:**
```json
{
  "data": {
    "payment_order_id": "order_xyz",
    "amount": 71280,
    "currency": "INR",
    "key": "rzp_test_..."
  }
}
```

#### POST /api/payments/verify
Verify payment after completion.

**Request Body:**
```json
{
  "order_id": "uuid",
  "payment_id": "pay_xyz",
  "signature": "signature_string"
}
```

---

### Delivery Partners

#### GET /api/delivery-partners
Get available delivery partners (Admin only).

#### PUT /api/delivery-partners/[id]/location
Update delivery partner location.

**Request Body:**
```json
{
  "lat": 12.9716,
  "lng": 77.5946
}
```

#### PUT /api/delivery-partners/[id]/status
Update delivery partner online status.

**Request Body:**
```json
{
  "is_online": true
}
```

#### POST /api/delivery-partners/orders/[id]/accept
Accept an order for delivery.

---

### Notifications

#### GET /api/notifications
Get user's notifications.

**Query Parameters:**
- `is_read` (boolean, optional) - Filter by read status
- `limit` (number, optional)

#### PUT /api/notifications/[id]/read
Mark notification as read.

#### PUT /api/notifications/read-all
Mark all notifications as read.

---

### Admin

#### GET /api/admin/users
Get all users (Admin only).

**Query Parameters:**
- `role` (string, optional) - Filter by role
- `is_active` (boolean, optional)
- `page` (number, optional)

#### PUT /api/admin/users/[id]/status
Update user status (Admin only).

**Request Body:**
```json
{
  "is_active": false
}
```

#### GET /api/admin/analytics
Get platform analytics (Admin only).

**Query Parameters:**
- `start_date` (string, optional)
- `end_date` (string, optional)

---

## Webhooks

### POST /api/webhooks/razorpay
Handle Razorpay payment webhooks.

### POST /api/webhooks/stripe
Handle Stripe payment webhooks.

---

## Rate Limiting

- Authenticated users: 100 requests per minute
- Unauthenticated users: 20 requests per minute

## Pagination

All list endpoints support pagination:
- Default page size: 20 items
- Maximum page size: 100 items
- Use `page` and `limit` query parameters

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `INVALID_TOKEN` | Invalid or expired token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request data |
| `PAYMENT_FAILED` | Payment processing failed |
| `ORDER_NOT_AVAILABLE` | Order cannot be processed |

## Best Practices

1. Always include proper error handling
2. Use pagination for list endpoints
3. Cache responses when appropriate
4. Implement retry logic for failed requests
5. Validate all input data
6. Use HTTPS in production
7. Keep tokens secure and never expose them

## Support

For API support, contact: api-support@Rasan.com
