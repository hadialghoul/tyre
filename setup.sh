#!/bin/bash

# Tyre Tourism Website - Quick Setup Script
# Run this to set up the project quickly

echo "🇱🇧 Setting up Tyre Tourism Website..."

# Backend setup
echo ""
echo "📦 Setting up Backend..."
cd backend
cp .env.example .env
npm install

# Frontend setup  
echo ""
echo "📦 Setting up Frontend..."
cd ../frontend
cp .env.example .env
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Ensure MongoDB is running (mongod)"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Start frontend: cd frontend && npm start"
echo ""
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "Admin: http://localhost:3000/admin/login"
