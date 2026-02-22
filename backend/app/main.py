from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.database import engine
from app.middleware import SecurityHeadersMiddleware
from app.routes import knowledge, projects, geo, scoring, search, health, graph, ai, notifications, documents, enrichment, admin, veille
from app.routes.data_health import router as data_health_router
from app.routes.geo_layers import router as geo_layers_router
from app.routes.billing import router as billing_router
from app.routes.agents import router as agents_router
from app.routes.monitoring import router as monitoring_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema managed by Alembic — run: alembic upgrade head

    # Start scheduler (Sprint 18 — veille active)
    from app.scheduler import start_scheduler, stop_scheduler
    start_scheduler()

    yield

    stop_scheduler()
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
app.include_router(graph.router, prefix="/api", tags=["graph"])
app.include_router(ai.router, prefix="/api", tags=["ai"])
app.include_router(notifications.router, prefix="/api", tags=["notifications"])
app.include_router(documents.router, prefix="/api", tags=["documents"])
app.include_router(enrichment.router, prefix="/api", tags=["enrichment"])
app.include_router(admin.router, prefix="/api", tags=["admin"])
app.include_router(veille.router, prefix="/api", tags=["veille"])
app.include_router(data_health_router, prefix="/api", tags=["data-health"])
app.include_router(geo_layers_router, prefix="/api", tags=["geo-layers"])
app.include_router(billing_router, prefix="/api", tags=["billing"])
app.include_router(agents_router, tags=["agents"])
app.include_router(monitoring_router, tags=["monitoring"])
