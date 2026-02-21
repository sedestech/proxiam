"""PVGIS service — Sprint 13.

Fetches solar irradiation data from the EU PVGIS API v5.2.
Includes Redis caching (30-day TTL) and latitude-based fallback.

API docs: https://re.jrc.ec.europa.eu/pvg_tools/en/
"""
import json
import logging
from typing import Optional

import httpx
import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

PVGIS_BASE_URL = "https://re.jrc.ec.europa.eu/api/v5_2"
PVGIS_TIMEOUT = 30.0
CACHE_TTL = 30 * 24 * 3600  # 30 days
CACHE_PREFIX = "pvgis:"


def _get_redis() -> aioredis.Redis:
    return aioredis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        password=settings.redis_password or None,
        decode_responses=True,
    )


def _cache_key(lat: float, lon: float) -> str:
    return f"{CACHE_PREFIX}{lat:.4f}:{lon:.4f}"


async def _get_cached(lat: float, lon: float) -> Optional[dict]:
    try:
        r = _get_redis()
        raw = await r.get(_cache_key(lat, lon))
        await r.aclose()
        if raw:
            return json.loads(raw)
    except Exception as exc:
        logger.debug("Redis cache miss: %s", exc)
    return None


async def _set_cached(lat: float, lon: float, data: dict) -> None:
    try:
        r = _get_redis()
        await r.setex(_cache_key(lat, lon), CACHE_TTL, json.dumps(data))
        await r.aclose()
    except Exception as exc:
        logger.debug("Redis cache write failed: %s", exc)


def _fallback_by_latitude(lat: float) -> dict:
    """Estimate solar data from latitude when PVGIS is unavailable.

    Based on average French metropolitan values:
      - South (42-44): GHI ~1600-1800, productible ~1350-1500
      - Center (44-47): GHI ~1300-1500, productible ~1100-1300
      - North (47-51): GHI ~1000-1300, productible ~900-1100
    """
    if lat <= 43:
        ghi = 1700
        productible = 1400
        temp = 15.0
    elif lat <= 45:
        ghi = 1500
        productible = 1250
        temp = 13.0
    elif lat <= 47:
        ghi = 1350
        productible = 1150
        temp = 11.5
    else:
        ghi = 1150
        productible = 1000
        temp = 10.0

    return {
        "ghi_kwh_m2_an": ghi,
        "dni_kwh_m2_an": None,
        "dhi_kwh_m2_an": None,
        "productible_kwh_kwc_an": productible,
        "temperature_moyenne": temp,
        "source": "fallback_latitude",
    }


async def get_pvgis_data(lat: float, lon: float) -> dict:
    """Fetch PVGIS solar data for given coordinates.

    Returns:
        dict with keys:
            ghi_kwh_m2_an: Global Horizontal Irradiation (kWh/m2/year)
            dni_kwh_m2_an: Direct Normal Irradiation
            dhi_kwh_m2_an: Diffuse Horizontal Irradiation
            productible_kwh_kwc_an: Estimated yield (kWh/kWc/year)
            temperature_moyenne: Average temperature (C)
            source: "pvgis_api" or "fallback_latitude"
    """
    # Check cache first
    cached = await _get_cached(lat, lon)
    if cached:
        logger.debug("PVGIS cache hit for (%.4f, %.4f)", lat, lon)
        return cached

    # Call PVGIS API
    try:
        async with httpx.AsyncClient(timeout=PVGIS_TIMEOUT) as client:
            resp = await client.get(
                f"{PVGIS_BASE_URL}/PVcalc",
                params={
                    "lat": lat,
                    "lon": lon,
                    "peakpower": 1,
                    "loss": 14,
                    "outputformat": "json",
                },
            )
            resp.raise_for_status()
            raw = resp.json()

        outputs = raw.get("outputs", {})
        totals = outputs.get("totals", {}).get("fixed", {})

        # E_y = annual energy production (kWh/kWc/year)
        productible = totals.get("E_y")
        # H(i)_y = irradiation on inclined plane (kWh/m2/year)
        ghi_inclined = totals.get("H(i)_y")
        # SD_y = standard deviation (not used directly)

        # Monthly data for GHI/DNI/DHI
        monthly = outputs.get("monthly", {}).get("fixed", [])
        ghi_total = None
        temp_avg = None
        if monthly:
            # Sum H(i)_m for annual irradiation
            ghi_total = round(sum(m.get("H(i)_m", 0) for m in monthly), 1)
            temp_avg = round(sum(m.get("T2m", 0) for m in monthly) / len(monthly), 1)

        result = {
            "ghi_kwh_m2_an": ghi_total or (round(ghi_inclined, 1) if ghi_inclined else None),
            "dni_kwh_m2_an": None,
            "dhi_kwh_m2_an": None,
            "productible_kwh_kwc_an": round(productible, 1) if productible else None,
            "temperature_moyenne": temp_avg,
            "source": "pvgis_api",
        }

        # Cache the result
        await _set_cached(lat, lon, result)

        logger.info(
            "PVGIS data fetched for (%.4f, %.4f): GHI=%s, prod=%s",
            lat, lon, result["ghi_kwh_m2_an"], result["productible_kwh_kwc_an"],
        )
        return result

    except Exception as exc:
        logger.warning("PVGIS API failed for (%.4f, %.4f): %s — using fallback", lat, lon, exc)
        fallback = _fallback_by_latitude(lat)
        return fallback
