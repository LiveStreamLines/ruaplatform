#!/bin/bash

# AHC Watch Platform - Deployment Script
# Run this script on your remote server after pulling updates

echo "========================================="
echo "AHC Watch Platform - Deployment Script"
echo "========================================="
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root directory."
    exit 1
fi

echo "1. Installing frontend dependencies..."
npm install

echo
echo "2. Building Angular application..."
ng build --configuration production

echo
echo "3. Installing backend dependencies..."
cd backend
npm install

echo
echo "4. Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found in backend directory."
    echo "Please copy env.template to .env and configure your environment variables."
    echo "Required variables:"
    echo "  - TWILIO_ACCOUNT_SID"
    echo "  - TWILIO_AUTH_TOKEN" 
    echo "  - TWILIO_SERVICE_SID"
    echo "  - MEDIA_PATH"
    echo
fi

echo
echo "5. Deployment completed!"
echo
echo "Next steps:"
echo "  - Configure backend/.env file if not already done"
echo "  - Start backend server: cd backend && npm start"
echo "  - Configure web server to serve dist/lslplatform/browser/ files"
echo "  - Set up Azure AD for Microsoft login (see MICROSOFT_LOGIN_SETUP.md)"
echo
echo "========================================="
