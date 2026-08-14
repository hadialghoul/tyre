# Tyre Tourism Website - Development Instructions

## Project Overview

This is a comprehensive full-stack tourism website for Tyre, Lebanon featuring:
- Directory of restaurants, cafes, hotels, services (AC repair, laundry, painting, etc.)
- Pharmacy and hospital listings
- Supermarkets with delivery services
- Restaurant menus with photos and phone numbers
- Professional admin panel for managing businesses
- Responsive Material-UI design

## Tech Stack

- **Frontend**: React 18, Material-UI, Axios
- **Backend**: Node.js (v16+), Express.js, MongoDB
- **Authentication**: JWT
- **File Uploads**: Multer

## Project Structure

```
tyre-tourism/
├── backend/                 # Express.js REST API
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth & uploads
│   ├── uploads/            # Uploaded images
│   ├── server.js           # Main server file
│   └── package.json
├── frontend/               # React application
│   ├── public/            # Static files
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── admin/         # Admin dashboard
│   │   ├── utils/         # API calls
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Node.js 16+ installed
- MongoDB running locally or connection string ready
- A code editor (VS Code recommended)

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in backend folder:
```
MONGODB_URI=mongodb://localhost:27017/tyre-tourism
JWT_SECRET=your_super_secret_key_change_in_production
PORT=5000
NODE_ENV=development
```

Start the backend:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file in frontend folder:
```
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm start
```

Frontend runs on `http://localhost:3000`

## Features Implemented

### Public Features
- 🏠 Home page with featured businesses
- 📂 Browse businesses by category
- 🔍 Search and filter businesses
- 📱 Business detail pages with:
  - Photos and logos
  - Phone numbers
  - Address and opening hours
  - Delivery information
  - Restaurant menus

### Admin Features
- 🔐 Admin login with JWT authentication
- 📊 Dashboard with statistics
- 🏢 Manage businesses (Create, Read, Update, Delete)
- 📂 Manage categories
- 📤 Upload logos and menu images
- 💼 Add restaurant menus

### Business Categories
- 🍽️ Restaurants & Cafes
- 🏨 Hotels & Accommodations
- 🏥 Hospitals
- 💊 Pharmacies
- 🛒 Supermarkets (with delivery)
- 🔧 Services (AC repair, laundry, painting, plumbing, etc.)

## Database Schema

### Business Model
- name, category, description
- phone, alternatePhone, email
- address, website
- logo, images, menus
- opening hours
- hasDelivery, deliveryPhone
- rating, featured flag
- latitude, longitude (for future map integration)

### Category Model
- name, description, icon

### User Model
- username, email, password (hashed)
- role (admin, moderator)
- isActive status

## API Endpoints

### Businesses
- `GET /api/businesses` - Get all with filters
- `GET /api/businesses/:id` - Get single
- `POST /api/businesses` - Create (admin)
- `PUT /api/businesses/:id` - Update (admin)
- `DELETE /api/businesses/:id` - Delete (admin)
- `POST /api/businesses/:id/menus` - Add menu (admin)

### Categories
- `GET /api/categories` - Get all
- `POST /api/categories` - Create (admin)
- `PUT /api/categories/:id` - Update (admin)
- `DELETE /api/categories/:id` - Delete (admin)

### Auth
- `POST /api/auth/register` - Register (admin only)
- `POST /api/auth/login` - Login

## How to Add Data

### 1. Create Admin Account

Use API client (Postman, Insomnia, or REST Client) to register:
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "securepassword",
  "role": "admin"
}
```

### 2. Login and Get Token

```
POST http://localhost:5000/api/auth/login
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

Copy the token from response.

### 3. Create Categories

```
POST http://localhost:5000/api/categories
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Restaurants",
  "description": "Local restaurants in Tyre",
  "icon": "🍽️"
}
```

### 4. Create Businesses

```
POST http://localhost:5000/api/businesses
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

- name: Restaurant Name
- category: [category_id]
- description: Description
- phone: +961 XX XXX XXXX
- address: Address in Tyre
- [logo file for upload]
```

### 5. Use Admin Panel

Once authenticated, access `/admin` to manage everything via UI.

## Next Steps / Enhancements

1. **Map Integration** - Add Google Maps/Leaflet for location display
2. **Ratings & Reviews** - User reviews and ratings system
3. **Image Gallery** - Multi-image upload per business
4. **Mobile App** - React Native version
5. **Email Notifications** - Send confirmations and updates
6. **Payment Integration** - Online reservations/bookings
7. **Multi-language** - Arabic/English support
8. **SEO Optimization** - Meta tags and structured data
9. **Analytics** - Track popular businesses
10. **API Caching** - Redis for performance

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env

### CORS Issues
- Backend already has CORS enabled
- Check that urls match in frontend .env

### Port Already in Use
- Backend: Change PORT in .env
- Frontend: `PORT=3001 npm start`

## Production Deployment

Ready for deployment to:
- Heroku (Backend)
- Vercel (Frontend)
- DigitalOcean
- AWS Elastic Beanstalk

Requires environment variables setup and MongoDB Atlas for production database.
