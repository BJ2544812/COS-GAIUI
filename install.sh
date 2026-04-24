#!/bin/bash

echo "------------------------------------------"
echo "CHURCH OS - CORE DEPLOYMENT SCRPIT"
echo "------------------------------------------"

echo "Checking environment..."
if ! command -v node &> /dev/null
then
    echo "ERROR: Node.js is not installed."
    exit
fi

echo "Installing operational dependencies..."
npm install

echo "Compiling system layers..."
npm run build

echo "Initializing operational database..."
# The database initializes automatically on first run

echo "------------------------------------------"
echo "DEPLOYMENT COMPLETE"
echo "RUN 'npm run start' TO IGNITE SYSTEM"
echo "------------------------------------------"
