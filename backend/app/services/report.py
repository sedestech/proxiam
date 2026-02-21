"""Service de generation de rapport PDF — Sprint 15.

Genere un rapport de faisabilite PDF combinant :
- Informations projet
- Donnees d'enrichissement (PVGIS, contraintes, postes)
- Analyse reglementaire
- Estimation financiere

Utilise fpdf2 (pure Python, pas de dependances systeme).
"""
from datetime import datetime
from typing import Any, Dict, Optional

from fpdf import FPDF


# ─── Helpers ────────────────────────────────────────────────────

def _sanitize(text: str) -> str:
    """Remove non-latin1 characters for Helvetica font compatibility."""
    replacements = {
        "\u2192": "->",   # →
        "\u2190": "<-",   # ←
        "\u2022": "-",    # •
        "\u2013": "-",    # –
        "\u2014": "-",    # —
        "\u2018": "'",    # '
        "\u2019": "'",    # '
        "\u201c": '"',    # "
        "\u201d": '"',    # "
        "\u2026": "...",  # …
        "\u00e9": "e",    # é
        "\u00e8": "e",    # è
        "\u00ea": "e",    # ê
        "\u00e0": "a",    # à
        "\u00e2": "a",    # â
        "\u00f4": "o",    # ô
        "\u00fb": "u",    # û
        "\u00ee": "i",    # î
        "\u00e7": "c",    # ç
        "\u00c9": "E",    # É
        "\u00c8": "E",    # È
    }
    for orig, repl in replacements.items():
        text = text.replace(orig, repl)
    # Fallback: remove any remaining non-latin1 chars
    return text.encode("latin-1", errors="replace").decode("latin-1")


FILIERE_LABELS = {
    "solaire_sol": "Solaire au sol",
    "eolien_onshore": "Eolien terrestre",
    "bess": "Stockage batterie (BESS)",
}


def _fmt_eur(value: float) -> str:
    """Format a number as EUR with thousands separator."""
    if value >= 1_000_000:
        return f"{value / 1_000_000:.1f} M EUR"
    if value >= 1_000:
        return f"{value / 1_000:.0f} k EUR"
    return f"{value:.0f} EUR"


def _fmt_pct(value: float) -> str:
    return f"{value:.1f} %"


# ─── PDF Builder ────────────────────────────────────────────────

class ProxiamPDF(FPDF):
    """Custom PDF with Proxiam header/footer."""

    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(99, 102, 241)  # Indigo
        self.cell(0, 8, "PROXIAM", align="L")
        self.set_font("Helvetica", "", 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, "Rapport de Faisabilite ENR", align="R")
        self.ln(10)
        self.set_draw_color(99, 102, 241)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(
            0, 10,
            f"Proxiam - Estimation indicative (+/- 20%) - {datetime.now().strftime('%d/%m/%Y')} - Page {self.page_no()}/{{nb}}",
            align="C",
        )

    def section_title(self, title: str):
        self.ln(4)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(30, 30, 30)
        self.cell(0, 8, _sanitize(title), new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def key_value(self, key: str, value: str, bold_value: bool = False):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(80, 80, 80)
        self.cell(65, 6, _sanitize(key), new_x="END")
        self.set_font("Helvetica", "B" if bold_value else "", 10)
        self.set_text_color(30, 30, 30)
        self.cell(0, 6, _sanitize(value), new_x="LMARGIN", new_y="NEXT")

    def bullet(self, text: str, indent: int = 15):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(60, 60, 60)
        x = self.get_x()
        self.cell(indent, 5, "-")
        self.multi_cell(0, 5, _sanitize(text), new_x="LMARGIN", new_y="NEXT")


# ─── Report Generation ─────────────────────────────────────────

def generate_pdf_report(
    project_info: Dict[str, Any],
    enrichment_data: Optional[Dict[str, Any]],
    regulatory_data: Dict[str, Any],
    financial_data: Dict[str, Any],
) -> bytes:
    """Generate a PDF feasibility report.

    Returns: PDF content as bytes.
    """
    pdf = ProxiamPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    filiere_label = FILIERE_LABELS.get(
        project_info.get("filiere", ""), project_info.get("filiere", "")
    )

    # ── Title ──
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 12, f"Rapport de Faisabilite", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 13)
    pdf.set_text_color(99, 102, 241)
    pdf.cell(0, 8, _sanitize(project_info.get("nom", "Projet")), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)

    # ── 1. Projet Info ──
    pdf.section_title("1. Informations Projet")
    pdf.key_value("Nom :", project_info.get("nom", "-"))
    pdf.key_value("Filiere :", filiere_label)
    pdf.key_value("Puissance :", f"{project_info.get('puissance_mwc', 0)} MWc")
    if project_info.get("surface_ha"):
        pdf.key_value("Surface :", f"{project_info['surface_ha']} ha")
    if project_info.get("commune"):
        loc = project_info["commune"]
        if project_info.get("departement"):
            loc += f" ({project_info['departement']})"
        pdf.key_value("Localisation :", loc)
    if project_info.get("lat") and project_info.get("lon"):
        pdf.key_value("Coordonnees :", f"{project_info['lat']:.4f} N, {project_info['lon']:.4f} E")

    # ── 2. Enrichment ──
    if enrichment_data:
        pdf.section_title("2. Donnees Site (PVGIS + Contraintes)")

        pvgis = enrichment_data.get("pvgis", {})
        if pvgis:
            pdf.key_value("GHI annuel :", f"{pvgis.get('ghi_kwh_m2_an', '-')} kWh/m2/an")
            pdf.key_value("Productible estime :", f"{pvgis.get('productible_kwh_kwc_an', '-')} kWh/kWc/an", bold_value=True)
            if pvgis.get("temperature_avg_c"):
                pdf.key_value("Temperature moyenne :", f"{pvgis['temperature_avg_c']} C")

        constraints = enrichment_data.get("constraints", {})
        summary = constraints.get("summary", {})
        total_c = summary.get("total_constraints", 0)
        if total_c > 0:
            pdf.key_value("Contraintes environnementales :", f"{total_c} identifiee(s)")
            for zone in constraints.get("zones", []):
                pdf.bullet(f"{zone.get('type', '')} : {zone.get('nom', '')} ({zone.get('distance', 'intersecte')})")
        else:
            pdf.key_value("Contraintes environnementales :", "Aucune identifiee")

        postes = enrichment_data.get("nearest_postes", [])
        if postes:
            pdf.key_value("Postes sources proches :", "")
            for p in postes[:3]:
                pdf.bullet(f"{p.get('nom', '-')} - {p.get('distance_km', '?')} km (capacite: {p.get('capacite_mw', '?')} MW)")
    else:
        pdf.section_title("2. Donnees Site")
        pdf.set_font("Helvetica", "I", 10)
        pdf.set_text_color(150, 150, 150)
        pdf.cell(0, 6, "Projet non enrichi - utilisez l'enrichissement PVGIS pour des donnees reelles.", new_x="LMARGIN", new_y="NEXT")

    # ── 3. Financial ──
    pdf.section_title("3. Estimation Financiere")

    capex = financial_data.get("capex", {})
    opex = financial_data.get("opex", {})
    revenus = financial_data.get("revenus", {})
    tri = financial_data.get("tri", {})

    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 7, "CAPEX (investissement initial)", new_x="LMARGIN", new_y="NEXT")

    install = capex.get("installation_eur", {})
    pdf.key_value("  Installation :", f"{_fmt_eur(install.get('median', 0))} (min: {_fmt_eur(install.get('min', 0))}, max: {_fmt_eur(install.get('max', 0))})")
    pdf.key_value("  Raccordement :", _fmt_eur(capex.get("raccordement_eur", 0)))
    pdf.key_value("  CAPEX total :", _fmt_eur(capex.get("total_eur", 0)), bold_value=True)
    pdf.key_value("  Cout unitaire :", f"{capex.get('eur_par_kwc', 0)} EUR/kWc")
    pdf.key_value("  Tendance :", capex.get("tendance", "-"))

    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 7, "OPEX (exploitation annuelle)", new_x="LMARGIN", new_y="NEXT")
    pdf.key_value("  OPEX annuel :", _fmt_eur(opex.get("annuel_eur", 0)))
    pdf.key_value("  % du CAPEX :", _fmt_pct(opex.get("pct_capex", 0)))
    pdf.key_value("  OPEX lifetime :", _fmt_eur(opex.get("lifetime_total_eur", 0)))

    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 7, "Revenus estimes", new_x="LMARGIN", new_y="NEXT")
    pdf.key_value("  Revenu annuel :", _fmt_eur(revenus.get("annuel_eur", 0)), bold_value=True)
    if revenus.get("production_mwh_an"):
        pdf.key_value("  Production :", f"{revenus['production_mwh_an']} MWh/an")
    if revenus.get("prix_moyen_mwh"):
        pdf.key_value("  Prix moyen :", f"{revenus['prix_moyen_mwh']} EUR/MWh")
    pdf.key_value("  Mecanisme :", revenus.get("mecanisme", "-"))
    detail = revenus.get("detail", {})
    if detail:
        for k, v in detail.items():
            pdf.bullet(f"{k.upper()} : {_fmt_eur(v)}")

    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 7, "Rentabilite", new_x="LMARGIN", new_y="NEXT")
    lcoe = financial_data.get("lcoe_eur_mwh", 0)
    if lcoe:
        pdf.key_value("  LCOE :", f"{lcoe} EUR/MWh", bold_value=True)
    pdf.key_value("  TRI (IRR) :", _fmt_pct(tri.get("tri_pct", 0)), bold_value=True)
    if tri.get("payback_years"):
        pdf.key_value("  Payback :", f"{tri['payback_years']} ans")
    pdf.key_value("  Cashflow annuel :", _fmt_eur(tri.get("cashflow_annuel_eur", 0)))
    rentable = tri.get("rentable", False)
    pdf.key_value("  Verdict :", "RENTABLE" if rentable else "NON RENTABLE (TRI < WACC 6%)", bold_value=True)

    # ── 4. Regulatory ──
    pdf.add_page()
    pdf.section_title("4. Analyse Reglementaire")

    risk = regulatory_data.get("risk_level", "medium")
    risk_label = {"low": "Faible", "medium": "Moyen", "high": "Eleve"}.get(risk, risk)
    pdf.key_value("Risque reglementaire :", risk_label, bold_value=True)
    pdf.key_value("Nombre d'obligations :", str(regulatory_data.get("nb_obligations", 0)))
    pdf.key_value("Delai estime max :", f"{regulatory_data.get('estimated_delai_max_mois', 0)} mois")

    obligations = regulatory_data.get("obligations", [])
    if obligations:
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 7, "Obligations applicables :", new_x="LMARGIN", new_y="NEXT")
        for obl in obligations:
            label = obl.get("label", obl.get("obligation", "-"))
            regime = obl.get("regime", "")
            delai = obl.get("delai_mois", 0)
            regime_str = f" [{regime}]" if regime else ""
            pdf.bullet(f"{label}{regime_str} - delai: {delai} mois")

    timeline = regulatory_data.get("timeline", [])
    if timeline:
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 7, "Timeline projet :", new_x="LMARGIN", new_y="NEXT")
        for phase in sorted(timeline, key=lambda x: x.get("ordre", 0)):
            pdf.bullet(f"{phase.get('ordre', '')}. {phase.get('phase', '')} ({phase.get('duree_mois', '')} mois)")

    tips = regulatory_data.get("expert_tips", [])
    if tips:
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 7, "Conseils experts :", new_x="LMARGIN", new_y="NEXT")
        for tip in tips:
            pdf.bullet(tip)

    # ── 5. Disclaimer ──
    pdf.ln(8)
    pdf.set_draw_color(200, 200, 200)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(3)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(130, 130, 130)
    pdf.multi_cell(
        0, 4,
        "AVERTISSEMENT : Ce rapport est une estimation indicative (precision +/- 20%) "
        "destinee au screening de sites. Il ne remplace pas un business plan detaille, "
        "une etude de faisabilite complete, ni les avis d'experts qualifies. "
        "Les benchmarks utilises sont issus de sources publiques (CRE, ADEME, Bloomberg NEF, IRENA) "
        "et representent des moyennes marche France 2024-2026. "
        f"Genere par Proxiam le {datetime.now().strftime('%d/%m/%Y a %H:%M')}.",
    )

    return bytes(pdf.output())
