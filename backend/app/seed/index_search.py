"""Populate Meilisearch indexes from PostgreSQL.

Usage:
    PYTHONPATH=. python3 -m app.seed.index_search
"""

import asyncio

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.config import settings
from app.services.search import index_all_entities


async def run_indexing():
    """Connect to PostgreSQL and index all entities into Meilisearch."""
    print("=" * 60)
    print("Proxiam -- Meilisearch Index Builder")
    print("=" * 60)
    print()
    print(f"Meilisearch: {settings.meili_host}")
    print(f"PostgreSQL:  {settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}")
    print()

    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        print("Indexing entities into Meilisearch...")
        counts = await index_all_entities(session)
        print()
        print("Indexed:")
        total = 0
        for entity_type, count in counts.items():
            print(f"  {entity_type}: {count} documents")
            total += count
        print(f"\n  Total: {total} documents")

    await engine.dispose()
    print()
    print("Indexing complete!")


if __name__ == "__main__":
    asyncio.run(run_indexing())
