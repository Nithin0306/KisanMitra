"""
SQLAlchemy async engine + session factory for PostgreSQL.
Firestore can be substituted by replacing the engine here; engines/ files are unaffected.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
import structlog

log = structlog.get_logger()

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def init_db():
    """Called at startup to verify DB connectivity."""
    async with engine.begin() as conn:
        await conn.run_sync(lambda c: None)  # Lightweight ping
    log.info("postgres.connected")


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        yield session
