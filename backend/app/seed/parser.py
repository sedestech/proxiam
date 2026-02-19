"""Parse the 54 brainstorm .md files into structured data for database seeding.

Each file follows patterns:
- Bullet items: * **CODE** : **Title** – Description
- Numbered items: N. **CODE** : Description
- Codes: S-NNN (normes), R-NNN (risques), L-NNN (livrables),
         V-NNN (sources), SK-NNN (competences), T-NNN (outils)
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Optional


BRAINSTORM_DIR = Path(__file__).resolve().parents[4] / "docs" / "Produit Brainstorm"
OUTPUT_DIR = Path(__file__).resolve().parents[2] / ".." / "data" / "seed"

# Phase code → phase prefix mapping
PHASE_PREFIXES = ["P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7"]

# Code patterns by entity type
CODE_PATTERNS = {
    "norme": re.compile(r"\*?\*?\s*\*?\*?(S-\d{3}[a-z]?)\*?\*?\s*:"),
    "risque": re.compile(r"\*?\*?\s*\*?\*?(R-\d{3}[a-z]?)\*?\*?\s*:"),
    "livrable": re.compile(r"\*?\*?\s*\*?\*?(L-\d{3}[a-z]?)\*?\*?\s*:"),
    "source": re.compile(r"\*?\*?\s*\*?\*?(V-\d{3}[a-z]?)\*?\*?\s*:"),
    "competence": re.compile(r"\*?\*?\s*\*?\*?(SK-\d{3}[a-z]?)\*?\*?\s*:"),
}


def clean_text(text: str) -> str:
    """Remove markdown bold markers and clean whitespace."""
    text = text.replace("**", "")
    text = text.strip().strip("–").strip("-").strip()
    return text


def extract_items(content: str, code_pattern: re.Pattern) -> list[dict]:
    """Extract coded items from markdown content."""
    items = []
    lines = content.split("\n")

    for line in lines:
        match = code_pattern.search(line)
        if match:
            code = match.group(1)
            # Get everything after the code and colon
            after_code = line[match.end():]
            after_code = clean_text(after_code)

            # Try to split title and description on " – " or " - "
            parts = re.split(r"\s*[–—-]\s*", after_code, maxsplit=1)
            if len(parts) == 2:
                titre = clean_text(parts[0])
                description = clean_text(parts[1])
            else:
                titre = clean_text(after_code)
                description = ""

            # Limit title length, put rest in description
            if len(titre) > 200:
                description = titre
                titre = titre[:197] + "..."

            items.append({
                "code": code,
                "titre": titre,
                "description": description if description else None,
            })

    return items


def extract_phases_from_bloc(content: str, bloc_code: str) -> list[dict]:
    """Extract phases from Bloc files (numbered items)."""
    phases = []
    # Match numbered items: N. **Title** : Description
    pattern = re.compile(r"^(\d+)\.\s+\*?\*?(.+?)(?:\*?\*?)?\s*$", re.MULTILINE)

    for match in pattern.finditer(content):
        num = int(match.group(1))
        text = clean_text(match.group(2))

        # Split on colon
        parts = text.split(":", 1)
        if len(parts) == 2:
            titre = clean_text(parts[0])
            description = clean_text(parts[1])
        else:
            titre = text
            description = None

        # Generate phase code from bloc and order
        bloc_num = bloc_code.replace("B", "")
        phase_code = f"P{bloc_num}.{num}"

        phases.append({
            "code": phase_code,
            "bloc_code": bloc_code,
            "titre": titre,
            "description": description,
            "ordre": num,
        })

    return phases


def parse_normes() -> list[dict]:
    """Parse all P*-Normes.md files."""
    all_normes = []
    for phase in PHASE_PREFIXES:
        filepath = BRAINSTORM_DIR / f"{phase}-Normes.md"
        if filepath.exists():
            content = filepath.read_text(encoding="utf-8")
            items = extract_items(content, CODE_PATTERNS["norme"])
            for item in items:
                item["phase_code"] = phase
            all_normes.extend(items)
    return all_normes


def parse_risques() -> list[dict]:
    """Parse all P*-Risques.md files."""
    all_risques = []
    for phase in PHASE_PREFIXES:
        filepath = BRAINSTORM_DIR / f"{phase}-Risques.md"
        if filepath.exists():
            content = filepath.read_text(encoding="utf-8")
            items = extract_items(content, CODE_PATTERNS["risque"])
            for item in items:
                item["phase_code"] = phase
            all_risques.extend(items)
    return all_risques


def parse_livrables() -> list[dict]:
    """Parse all P*-Livrables.md files."""
    all_livrables = []
    for phase in PHASE_PREFIXES:
        filepath = BRAINSTORM_DIR / f"{phase}-Livrables.md"
        if filepath.exists():
            content = filepath.read_text(encoding="utf-8")
            items = extract_items(content, CODE_PATTERNS["livrable"])
            for item in items:
                item["phase_code"] = phase
            all_livrables.extend(items)
    return all_livrables


def parse_sources() -> list[dict]:
    """Parse all P*-Sources.md files."""
    all_sources = []
    for phase in PHASE_PREFIXES:
        filepath = BRAINSTORM_DIR / f"{phase}-Sources.md"
        if filepath.exists():
            content = filepath.read_text(encoding="utf-8")
            items = extract_items(content, CODE_PATTERNS["source"])
            for item in items:
                item["phase_code"] = phase
            all_sources.extend(items)
    return all_sources


def parse_outils() -> list[dict]:
    """Parse 1000.md (outils T-001 to T-500)."""
    outils = []
    # The tools are in 1000.md, using bullet format: * **T-NNN** : **Name** – Description
    filepath = BRAINSTORM_DIR / "1000.md"
    if not filepath.exists():
        return outils
    content = filepath.read_text(encoding="utf-8")
    pattern = re.compile(r"\*\s+\*\*\s*(T-\d{3})\s*\*\*\s*:\s*(.+)$", re.MULTILINE)
    for match in pattern.finditer(content):
        code = match.group(1)
        text = clean_text(match.group(2))
        # Split name and description on " – "
        parts = re.split(r"\s*[–—]\s*", text, maxsplit=1)
        if len(parts) == 2:
            titre = clean_text(parts[0])
            description = clean_text(parts[1])
        else:
            titre = text
            description = None
        outils.append({"code": code, "titre": titre, "description": description})
    return outils


def parse_competences() -> list[dict]:
    """Parse competences from Outils500.md or Pole300Connaissances."""
    competences = []

    # Try Outils500.md for SK- codes
    filepath = BRAINSTORM_DIR / "Outils500.md"
    if filepath.exists():
        content = filepath.read_text(encoding="utf-8")
        items = extract_items(content, CODE_PATTERNS["competence"])
        competences.extend(items)

    # Try Pole300COnnaissances
    filepath = BRAINSTORM_DIR / "Pole300COnnaissances"
    if filepath.exists():
        content = filepath.read_text(encoding="utf-8")
        items = extract_items(content, CODE_PATTERNS["competence"])
        competences.extend(items)

    return competences


def parse_blocs() -> tuple[list[dict], list[dict]]:
    """Parse Bloc1-8.md files → blocs + phases."""
    blocs = []
    phases = []

    for i in range(1, 9):
        filepath = BRAINSTORM_DIR / f"Bloc{i}.md"
        if not filepath.exists():
            continue
        content = filepath.read_text(encoding="utf-8")

        # Extract bloc title from first heading
        title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        bloc_titre = clean_text(title_match.group(1)) if title_match else f"Bloc {i}"

        blocs.append({
            "code": f"B{i}",
            "titre": bloc_titre,
            "description": None,
        })

        bloc_phases = extract_phases_from_bloc(content, f"B{i}")
        phases.extend(bloc_phases)

    return blocs, phases


def parse_all() -> dict:
    """Parse all brainstorm files and return structured data."""
    blocs, phases = parse_blocs()

    data = {
        "blocs": blocs,
        "phases": phases,
        "normes": parse_normes(),
        "risques": parse_risques(),
        "livrables": parse_livrables(),
        "sources": parse_sources(),
        "outils": parse_outils(),
        "competences": parse_competences(),
    }

    return data


def save_json(data: dict, output_dir: Optional[Path] = None) -> None:
    """Save parsed data as JSON files for review/import."""
    out = output_dir or OUTPUT_DIR
    out = Path(out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    for key, items in data.items():
        filepath = out / f"{key}.json"
        filepath.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  {key}: {len(items)} items → {filepath}")


if __name__ == "__main__":
    print("Parsing brainstorm files...")
    print(f"  Source: {BRAINSTORM_DIR}")
    print(f"  Output: {OUTPUT_DIR}")
    print()

    data = parse_all()

    print("Results:")
    for key, items in data.items():
        print(f"  {key}: {len(items)} items")
    print()

    save_json(data)
    print("\nDone! JSON files saved to data/seed/")
