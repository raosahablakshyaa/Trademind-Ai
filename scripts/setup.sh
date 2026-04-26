#!/bin/bash
# TradeMind AI — Full Setup Script

set -e
echo "🚀 Setting up TradeMind AI..."

# Backend
echo "\n📦 Installing backend dependencies..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Generate sample data
echo "\n📊 Generating sample stock data..."
cd ..
python scripts/generate_sample_data.py

# Train models
echo "\n🧠 Training LSTM prediction model..."
cd backend
source venv/bin/activate
python app/ml/training/train_prediction.py --csv ../data/raw/sample_stock.csv --symbol SAMPLE --model lstm

echo "\n🕯️ Training CNN pattern model..."
python app/ml/training/train_patterns.py --csv ../data/raw/sample_stock.csv

# Frontend
echo "\n🎨 Installing frontend dependencies..."
cd ../frontend
npm install

echo "\n✅ Setup complete!"
echo "Start backend: cd backend && uvicorn app.main:app --reload"
echo "Start frontend: cd frontend && npm start"
