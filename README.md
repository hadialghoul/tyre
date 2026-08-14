# Tyre Tourism Website

A comprehensive tourism platform for Tyre, Lebanon featuring restaurants, cafes, hotels, services, and more.

## Features

- 🏨 Directory of restaurants, cafes, and hotels
- 🏥 Healthcare services (hospitals, pharmacies)
- 🔧 Local services (AC/refrigerator repair, laundry, painting, etc.)
- 🛒 Supermarkets with delivery information
- 📱 Phone numbers and contact information
- 🍽️ Restaurant menus with photos
- 👨‍💼 Admin panel to manage businesses and content
- 📱 Responsive design

## Tech Stack

- **Frontend**: React, Material-UI, Axios
- **Backend**: Node.js, Express.js, MongoDB
- **Authentication**: JWT
- **File Upload**: Multer

## Project Structure

```
tyre-tourism/
├── backend/          # Express.js server
├── frontend/         # React application
└── README.md
```

## Installation & Setup

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

## Environment Variables

Create `.env` files in both backend and frontend folders. See `.env.example` files for details.

## Admin Panel

Access the admin dashboard at `/admin` to:
- Add/edit businesses
- Upload logos and menus
- Manage photos
- Update phone numbers

## Database

MongoDB is used for data storage. Ensure MongoDB is running before starting the backend.

## License

MIT
