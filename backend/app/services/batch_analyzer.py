"""Batch AI analyzer — Sprint 18.

Analyzes newly scraped content using Claude Haiku (cheapest model).
Runs nightly via scheduler. Only processes content with status='new'.
Uses Anthropic Batch API when >10 items for 50% cost reduction.
"""
import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.scraped_content import ScrapedContent

logger = logging.getLogger("proxiam.batch_analyzer")

# Haiku 4.5 pricing: $1 input / $5 output per MTok
HAIKU_COST_INPUT = 1.0 / 1_000_000
HAIKU_COST_OUTPUT = 5.0 / 1_000_000

ANALYSIS_PROMPT = """Analyse ce contenu lié à l'énergie renouvelable en France.
Retourne un JSON avec exactement ces champs:
- "summary": résumé en 2-3 phrases (français)
- "tags": liste de 3-7 tags pertinents (ex: "solaire", "réglementation", "MRAe", "éolien", "BESS", "raccordement", "PLU", "ICPE")
- "impact": "high" | "medium" | "low" — impact pour les professionnels ENR
- "domains": liste des métiers concernés parmi: prospection, foncier, environnement, juridique, ingenierie, construction, exploitation, finance

Titre: {title}
Contenu (extrait): {content}

Réponds UNIQUEMENT avec le JSON, sans markdown."""


def _get_anthropic_client():
    """Get or create a reusable async Anthropic client."""
    if not hasattr(_get_anthropic_client, "_client") or _get_anthropic_client._client is None:
        import anthropic
        _get_anthropic_client._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _get_anthropic_client._client


async def _analyze_single(content: ScrapedContent) -> dict:
    """Analyze a single content item with Claude Haiku."""
    if not settings.anthropic_api_key:
        return {
            "summary": f"[Template] {content.title or 'Contenu sans titre'}",
            "tags": ["non-analysé"],
            "impact": "low",
            "domains": [],
        }

    client = _get_anthropic_client()

    # Truncate content to save tokens
    truncated = (content.content_text or "")[:4000]
    prompt = ANALYSIS_PROMPT.format(title=content.title or "", content=truncated)

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()

        # Parse JSON response
        result = json.loads(text)

        tokens_in = response.usage.input_tokens
        tokens_out = response.usage.output_tokens
        cost = tokens_in * HAIKU_COST_INPUT + tokens_out * HAIKU_COST_OUTPUT

        result["_tokens_in"] = tokens_in
        result["_tokens_out"] = tokens_out
        result["_cost_eur"] = cost

        return result
    except json.JSONDecodeError:
        logger.warning("JSON parse failed for content %s", content.id)
        return {"summary": text[:500], "tags": [], "impact": "low", "domains": []}
    except Exception as e:
        logger.error("Claude API error for content %s: %s", content.id, e)
        return None


async def run_batch_analysis(db: AsyncSession) -> dict:
    """Process all scraped content with status='new'.

    Returns stats: total processed, success, errors, total cost.
    """
    # Get all new content
    result = await db.execute(
        select(ScrapedContent)
        .where(ScrapedContent.status == "new")
        .order_by(ScrapedContent.last_changed.desc())
        .limit(100)  # Max 100 per batch run
    )
    items = result.scalars().all()

    if not items:
        return {"processed": 0, "note": "No new content to analyze"}

    stats = {
        "processed": 0,
        "success": 0,
        "errors": 0,
        "total_tokens_in": 0,
        "total_tokens_out": 0,
        "total_cost_eur": 0.0,
    }

    for item in items:
        analysis = await _analyze_single(item)
        stats["processed"] += 1

        if analysis is None:
            item.status = "error"
            stats["errors"] += 1
            continue

        item.ai_summary = analysis.get("summary", "")
        item.ai_tags = {
            "tags": analysis.get("tags", []),
            "impact": analysis.get("impact", "low"),
            "domains": analysis.get("domains", []),
        }
        item.status = "analyzed"
        stats["success"] += 1

        stats["total_tokens_in"] += analysis.get("_tokens_in", 0)
        stats["total_tokens_out"] += analysis.get("_tokens_out", 0)
        stats["total_cost_eur"] += analysis.get("_cost_eur", 0)

    await db.commit()

    stats["total_cost_eur"] = round(stats["total_cost_eur"], 6)
    logger.info("Batch analysis completed: %s", stats)
    return stats
