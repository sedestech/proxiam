from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.database import engine, Base
from app.middleware import SecurityHeadersMiddleware
from app.routes import knowledge, projects, geo, scoring, search, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

app = FastAPI(
    title="Proxiam API",
    description="OS Énergie Renouvelable — Matrice 6D, Cartographie SIG, Knowledge Graph",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security headers (OWASP)
app.add_middleware(SecurityHeadersMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Accept-Language"],
)

# Routes
app.include_router(health.router)
app.include_router(knowledge.router, prefix="/api", tags=["knowledge"])
app.include_router(projects.router, prefix="/api", tags=["projects"])
app.include_router(geo.router, prefix="/api", tags=["geo"])
app.include_router(scoring.router, prefix="/api", tags=["scoring"])
app.include_router(search.router, prefix="/api", tags=["search"])
