from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import signals, patterns, risk, journal, psychology, strategy, auth, market, demo, news
from app.db.database import connect_db, close_db

app = FastAPI(title="TradeMind AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://trademind-ai-two.vercel.app",
        "https://trademind-ai-gsax.vercel.app",
        # Allow all Vercel preview deployments
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_event_handler("startup", connect_db)
app.add_event_handler("shutdown", close_db)

app.include_router(auth.router,       prefix="/api/auth",       tags=["Auth"])
app.include_router(signals.router,    prefix="/api/signals",    tags=["Signals"])
app.include_router(patterns.router,   prefix="/api/patterns",   tags=["Patterns"])
app.include_router(risk.router,       prefix="/api/risk",       tags=["Risk"])
app.include_router(journal.router,    prefix="/api/journal",    tags=["Journal"])
app.include_router(psychology.router, prefix="/api/psychology", tags=["Psychology"])
app.include_router(strategy.router,   prefix="/api/strategy",   tags=["Strategy"])
app.include_router(market.router,     prefix="/api/market",     tags=["Market"])
app.include_router(demo.router,       prefix="/api/demo",       tags=["Demo"])
app.include_router(news.router,       prefix="/api/news",       tags=["News"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "TradeMind AI"}
