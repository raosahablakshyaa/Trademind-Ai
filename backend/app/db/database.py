from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient = None
_db = None

async def connect_db():
    global client, _db
    client = AsyncIOMotorClient(
        settings.MONGO_URI,
        tls=True,
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=15000,
        connectTimeoutMS=15000,
        socketTimeoutMS=20000,
    )
    _db = client[settings.DB_NAME]
    try:
        await client.admin.command("ping")
        print(f"✓ Connected to MongoDB: {settings.DB_NAME}")
    except Exception as e:
        print(f"⚠️ MongoDB connection warning: {e}")
        print("→ App will start but DB features may not work")

async def close_db():
    global client
    if client:
        client.close()

def get_db():
    """Always returns the live db instance — never None."""
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _db

# Keep backward-compat alias used by journal/psychology/strategy routes
# They will be migrated to get_db() but this prevents import errors
class _DBProxy:
    def __getattr__(self, name):
        return getattr(get_db(), name)

db = _DBProxy()
