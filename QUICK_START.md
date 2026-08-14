# Quick Start Guide

## Installation

### Option 1: Automatic Setup (Linux/Mac)
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Automatic Setup (Windows)
```cmd
setup.bat
```

### Option 3: Manual Setup

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB details
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

## First Time Usage

### 1. Create Admin Account

Open Postman or any API client and make this request:

```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

### 2. Login via Admin Panel

Visit `http://localhost:3000/admin/login` and enter:
- Email: admin@example.com
- Password: admin123

### 3. Add Categories

In Admin Dashboard → Categories → Add Category

Examples:
- 🍽️ Restaurants
- 🏨 Hotels
- 🏥 Hospitals
- 💊 Pharmacies
- 🛒 Supermarkets
- 🔧 Services

### 4. Add Businesses

In Admin Dashboard → Businesses → Add Business

Fill in:
- Name
- Category
- Description
- Phone number
- Address
- Logo (optional)
- Other details

## Access Points

- **Frontend**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## Features

✅ Browse businesses by category
✅ Search functionality
✅ Business details with menus
✅ Admin dashboard
✅ Add/Edit/Delete businesses
✅ Upload logos and images
✅ Responsive design
✅ Professional UI with Material-UI

## File Upload Guide

### Adding Business Logo

1. Go to Admin → Businesses
2. Click "Add Business"
3. Fill in details
4. Upload logo image (JPG, PNG, GIF, WEBP)
5. Max size: 5MB

### Adding Menu Photos

1. Go to Business detail on admin
2. Add menu section
3. Upload menu image
4. Set menu name and description

## Next Features to Implement

- [ ] Map integration (Google Maps)
- [ ] User ratings & reviews
- [ ] Multiple images per business
- [ ] Email notifications
- [ ] Mobile app
- [ ] Payment integration
- [ ] Arabic/English multi-language
- [ ] Analytics dashboard
- [ ] Redis caching

## Troubleshooting

### Port already in use
```bash
# Change port in .env file
PORT=5001
```

### MongoDB not connecting
```bash
# Start MongoDB
mongod

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/tyre-tourism
```

### CORS errors
- Both backend and frontend must be running
- Check that API URLs match in frontend .env

### Images not loading
- Ensure backend is running
- Check uploads folder exists
- Verify image paths in database

## Database Reset

To reset the database and start fresh:

1. Delete MongoDB database:
```bash
mongo
use tyre-tourism
db.dropDatabase()
exit
```

2. Or drop all collections:
```bash
mongo
use tyre-tourism
db.businesses.deleteMany({})
db.categories.deleteMany({})
db.users.deleteMany({})
exit
```

## Production Deployment

### Backend (Heroku)
1. Create Heroku app
2. Set environment variables
3. Deploy with MongoDB Atlas

### Frontend (Vercel)
1. Connect GitHub repo
2. Set REACT_APP_API_URL
3. Deploy

## Support

For issues or questions, check the logs:
- Backend: Terminal where `npm run dev` is running
- Frontend: Browser console (F12)
- MongoDB: Check connection string

Enjoy! 🎉
