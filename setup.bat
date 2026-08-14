@echo off
REM Tyre Tourism Website - Quick Setup Script (Windows)
REM Run this to set up the project quickly

echo 🇱🇧 Setting up Tyre Tourism Website...

REM Backend setup
echo.
echo 📦 Setting up Backend...
cd backend
copy .env.example .env
call npm install

REM Frontend setup  
echo.
echo 📦 Setting up Frontend...
cd ..\frontend
copy .env.example .env
call npm install

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Ensure MongoDB is running (mongod)
echo 2. Start backend: cd backend ^&^& npm run dev
echo 3. Start frontend: cd frontend ^&^& npm start
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo Admin: http://localhost:3000/admin/login
