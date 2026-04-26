# TradeMind AI 🧠📈

> AI-Powered Trading Decision Assistant — Startup-grade, production-ready

## Features

| Feature | Technology |
|---|---|
| Price Movement Prediction | LSTM / GRU (TensorFlow) |
| Buy/Sell/Hold Signals | Hybrid DL + RSI/MACD/EMA/BB |
| Candlestick Pattern Recognition | CNN (TensorFlow) |
| Risk Analyzer | Quantitative risk engine |
| Trading Psychology Analyzer | Behavioral pattern detection |
| Personal Trade Journal | MongoDB + REST API |
| Strategy Performance Analyzer | Statistical comparison |

## Quick Start

### Option 1 — Docker (Recommended)
```bash
docker-compose up --build
```
App runs at `http://localhost:3000`

### Option 2 — Manual

```bash
# 1. Generate sample data & train models
bash scripts/setup.sh

# 2. Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# 3. Start frontend (new terminal)
cd frontend
npm start
```

## Training Your Own Models

```bash
cd backend
source venv/bin/activate

# Train LSTM on your CSV (must have: Date, Open, High, Low, Close, Volume)
python app/ml/training/train_prediction.py --csv ../data/raw/your_stock.csv --symbol AAPL --model lstm

# Train GRU
python app/ml/training/train_prediction.py --csv ../data/raw/your_stock.csv --symbol AAPL --model gru

# Train CNN pattern model
python app/ml/training/train_patterns.py --csv ../data/raw/your_stock.csv
```

## Project Structure

```
trademind-ai/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI route handlers
│   │   ├── core/                # Config, security, JWT
│   │   ├── db/                  # MongoDB connection
│   │   ├── ml/
│   │   │   ├── models/          # LSTM, GRU, CNN architectures
│   │   │   ├── training/        # Training scripts
│   │   │   └── utils/           # Feature engineering
│   │   └── services/            # Business logic layer
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/               # All 8 feature pages
│       ├── components/          # Layout, shared UI
│       ├── store/               # Zustand auth store
│       └── utils/               # Axios API client
├── data/
│   ├── raw/                     # Your CSV datasets
│   ├── processed/
│   └── models/                  # Trained .keras + scaler files
├── scripts/
│   ├── setup.sh
│   └── generate_sample_data.py
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/prediction/predict` | LSTM/GRU prediction |
| POST | `/api/signals/generate` | Buy/Sell/Hold signal |
| POST | `/api/patterns/detect` | Candlestick patterns |
| POST | `/api/risk/analyze` | Risk analysis |
| GET/POST | `/api/journal/` | Trade journal CRUD |
| GET | `/api/psychology/analyze` | Psychology analysis |
| GET | `/api/strategy/analyze` | Strategy comparison |

## Dataset

Download free OHLCV datasets from:
- [Kaggle — Stock Market Dataset](https://www.kaggle.com/datasets/jacksoncrow/stock-market-dataset)
- [Kaggle — NSE India](https://www.kaggle.com/datasets/rohanrao/nifty50-stock-market-data)

CSV must have columns: `Date, Open, High, Low, Close, Volume`

## Tech Stack

- **Frontend**: React 18, Tailwind CSS, Recharts, Zustand
- **Backend**: FastAPI, Python 3.11
- **ML/DL**: TensorFlow 2.14, Scikit-learn, Pandas, TA-Lib (ta)
- **Database**: MongoDB (Motor async driver)
- **Auth**: JWT (python-jose)
- **Deploy**: Docker + Docker Compose

## Scaling Roadmap

- [ ] WebSocket real-time price streaming
- [ ] Multi-user portfolio tracking
- [ ] Backtesting engine
- [ ] Mobile app (React Native)
- [ ] Kubernetes deployment
- [ ] Redis caching for model predictions
- [ ] Celery async model training jobs
# Trademind-Ai
