from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
from backend.config import settings

database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    # Filter out schema query parameter since asyncpg doesn't support it
    parsed = urlparse(database_url)
    qsl = parse_qsl(parsed.query)
    filtered_qsl = [(k, v) for k, v in qsl if k != 'schema']
    new_query = urlencode(filtered_qsl)
    database_url = urlunparse(parsed._replace(query=new_query))
elif database_url.startswith("sqlite://"):
    database_url = database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

engine = create_async_engine(database_url, future=True, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
