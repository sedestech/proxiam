"""initial_schema — All 25 tables for Proxiam OS ENR.

Creates the complete schema from scratch:
- 8 knowledge-matrix entity tables (blocs, phases, normes, risques, livrables, outils, sources_veille, competences)
- 9 knowledge-matrix relation tables (phase_livrables, phase_normes, phase_risques, phase_outils, phase_competences, risque_normes, risque_outils, norme_livrables, outil_competences)
- 4 project tables (projets, projet_phases, projet_risques, projet_documents)
- 1 geospatial table (postes_sources)
- 2 environmental constraint tables (natura2000, znieff)
- 5 SaaS/veille tables (users, usage_logs, scraped_contents, user_watches, alerts)

Revision ID: c1620ced36e0
Revises:
Create Date: 2026-02-21
"""
from typing import Sequence, Union

import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c1620ced36e0"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Users (Sprint 17 — multi-tenant SaaS)
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("clerk_id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("nom", sa.String(), nullable=True),
        sa.Column("tier", sa.String(length=20), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_clerk_id"), "users", ["clerk_id"], unique=True)

    # ------------------------------------------------------------------
    # 2. Knowledge-matrix entity tables (Sprint 0)
    # ------------------------------------------------------------------
    op.create_table(
        "blocs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=5), nullable=False),
        sa.Column("titre", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("phase_debut", sa.Integer(), nullable=True),
        sa.Column("phase_fin", sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "phases",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("bloc_id", sa.Integer(), nullable=True),
        sa.Column("titre", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("ordre", sa.Integer(), nullable=True),
        sa.Column("duree_jours_min", sa.Integer(), nullable=True),
        sa.Column("duree_jours_max", sa.Integer(), nullable=True),
        sa.Column("filiere", sa.ARRAY(sa.String()), nullable=True),
        sa.Column("predecesseurs", sa.ARRAY(sa.Integer()), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["bloc_id"], ["blocs.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "normes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("titre", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("reference_legale", sa.Text(), nullable=True),
        sa.Column("organisme", sa.String(length=100), nullable=True),
        sa.Column("perimetre", sa.String(length=50), nullable=True),
        sa.Column("date_revision", sa.Date(), nullable=True),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "risques",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("titre", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("categorie", sa.String(length=50), nullable=True),
        sa.Column("severite", sa.Integer(), nullable=True),
        sa.Column("probabilite", sa.Integer(), nullable=True),
        sa.Column("impact_financier_eur", sa.Numeric(), nullable=True),
        sa.Column("impact_delai_jours", sa.Integer(), nullable=True),
        sa.Column("mitigation", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "livrables",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("phase_id", sa.Integer(), nullable=True),
        sa.Column("titre", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("type", sa.String(length=50), nullable=True),
        sa.Column("template_url", sa.Text(), nullable=True),
        sa.Column("obligatoire", sa.Boolean(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["phase_id"], ["phases.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "outils",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("nom", sa.Text(), nullable=False),
        sa.Column("editeur", sa.String(length=100), nullable=True),
        sa.Column("licence", sa.String(length=50), nullable=True),
        sa.Column("cout_annuel_eur", sa.Numeric(), nullable=True),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "sources_veille",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("nom", sa.Text(), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=True),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("frequence", sa.String(length=20), nullable=True),
        sa.Column("gratuit", sa.Boolean(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "competences",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("nom", sa.Text(), nullable=False),
        sa.Column("pole", sa.String(length=50), nullable=True),
        sa.Column("niveau_requis", sa.Integer(), nullable=True),
        sa.Column("certifications", sa.ARRAY(sa.String()), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    # ------------------------------------------------------------------
    # 3. Knowledge-matrix relation tables (Sprint 1)
    # ------------------------------------------------------------------
    op.create_table(
        "phase_livrables",
        sa.Column("phase_id", sa.Integer(), nullable=False),
        sa.Column("livrable_id", sa.Integer(), nullable=False),
        sa.Column("obligatoire", sa.String(length=10), nullable=True),
        sa.ForeignKeyConstraint(["phase_id"], ["phases.id"]),
        sa.ForeignKeyConstraint(["livrable_id"], ["livrables.id"]),
        sa.PrimaryKeyConstraint("phase_id", "livrable_id"),
    )

    op.create_table(
        "phase_normes",
        sa.Column("phase_id", sa.Integer(), nullable=False),
        sa.Column("norme_id", sa.Integer(), nullable=False),
        sa.Column("criticite", sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(["phase_id"], ["phases.id"]),
        sa.ForeignKeyConstraint(["norme_id"], ["normes.id"]),
        sa.PrimaryKeyConstraint("phase_id", "norme_id"),
    )

    op.create_table(
        "phase_risques",
        sa.Column("phase_id", sa.Integer(), nullable=False),
        sa.Column("risque_id", sa.Integer(), nullable=False),
        sa.Column("phase_impact", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(["phase_id"], ["phases.id"]),
        sa.ForeignKeyConstraint(["risque_id"], ["risques.id"]),
        sa.PrimaryKeyConstraint("phase_id", "risque_id"),
    )

    op.create_table(
        "phase_outils",
        sa.Column("phase_id", sa.Integer(), nullable=False),
        sa.Column("outil_id", sa.Integer(), nullable=False),
        sa.Column("usage", sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(["phase_id"], ["phases.id"]),
        sa.ForeignKeyConstraint(["outil_id"], ["outils.id"]),
        sa.PrimaryKeyConstraint("phase_id", "outil_id"),
    )

    op.create_table(
        "phase_competences",
        sa.Column("phase_id", sa.Integer(), nullable=False),
        sa.Column("competence_id", sa.Integer(), nullable=False),
        sa.Column("niveau_requis", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["phase_id"], ["phases.id"]),
        sa.ForeignKeyConstraint(["competence_id"], ["competences.id"]),
        sa.PrimaryKeyConstraint("phase_id", "competence_id"),
    )

    op.create_table(
        "risque_normes",
        sa.Column("risque_id", sa.Integer(), nullable=False),
        sa.Column("norme_id", sa.Integer(), nullable=False),
        sa.Column("relation", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(["risque_id"], ["risques.id"]),
        sa.ForeignKeyConstraint(["norme_id"], ["normes.id"]),
        sa.PrimaryKeyConstraint("risque_id", "norme_id"),
    )

    op.create_table(
        "risque_outils",
        sa.Column("risque_id", sa.Integer(), nullable=False),
        sa.Column("outil_id", sa.Integer(), nullable=False),
        sa.Column("relation", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(["risque_id"], ["risques.id"]),
        sa.ForeignKeyConstraint(["outil_id"], ["outils.id"]),
        sa.PrimaryKeyConstraint("risque_id", "outil_id"),
    )

    op.create_table(
        "norme_livrables",
        sa.Column("norme_id", sa.Integer(), nullable=False),
        sa.Column("livrable_id", sa.Integer(), nullable=False),
        sa.Column("relation", sa.String(length=50), nullable=True),
        sa.ForeignKeyConstraint(["norme_id"], ["normes.id"]),
        sa.ForeignKeyConstraint(["livrable_id"], ["livrables.id"]),
        sa.PrimaryKeyConstraint("norme_id", "livrable_id"),
    )

    op.create_table(
        "outil_competences",
        sa.Column("outil_id", sa.Integer(), nullable=False),
        sa.Column("competence_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["outil_id"], ["outils.id"]),
        sa.ForeignKeyConstraint(["competence_id"], ["competences.id"]),
        sa.PrimaryKeyConstraint("outil_id", "competence_id"),
    )

    # ------------------------------------------------------------------
    # 4. Project tables (Sprint 4)
    # ------------------------------------------------------------------
    op.create_table(
        "projets",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("nom", sa.Text(), nullable=False),
        sa.Column("filiere", sa.String(length=50), nullable=True),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("puissance_mwc", sa.Numeric(), nullable=True),
        sa.Column("surface_ha", sa.Numeric(), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(
                geometry_type="POINT",
                srid=4326,
                from_text="ST_GeomFromEWKT",
                name="geometry",
            ),
            nullable=True,
        ),
        sa.Column(
            "emprise",
            geoalchemy2.types.Geometry(
                geometry_type="POLYGON",
                srid=4326,
                from_text="ST_GeomFromEWKT",
                name="geometry",
            ),
            nullable=True,
        ),
        sa.Column("commune", sa.String(length=100), nullable=True),
        sa.Column("departement", sa.String(length=3), nullable=True),
        sa.Column("region", sa.String(length=50), nullable=True),
        sa.Column("statut", sa.String(length=50), nullable=True),
        sa.Column("phase_courante_id", sa.Integer(), nullable=True),
        sa.Column("score_global", sa.Integer(), nullable=True),
        sa.Column(
            "date_creation",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["phase_courante_id"], ["phases.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_projets_user_id"), "projets", ["user_id"], unique=False)

    op.create_table(
        "projet_phases",
        sa.Column("projet_id", sa.UUID(), nullable=False),
        sa.Column("phase_id", sa.Integer(), nullable=False),
        sa.Column("statut", sa.String(length=20), nullable=True),
        sa.Column("date_debut", sa.DateTime(), nullable=True),
        sa.Column("date_fin", sa.DateTime(), nullable=True),
        sa.Column("completion_pct", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["projet_id"], ["projets.id"]),
        sa.ForeignKeyConstraint(["phase_id"], ["phases.id"]),
        sa.PrimaryKeyConstraint("projet_id", "phase_id"),
    )

    op.create_table(
        "projet_risques",
        sa.Column("projet_id", sa.UUID(), nullable=False),
        sa.Column("risque_id", sa.Integer(), nullable=False),
        sa.Column("statut", sa.String(length=20), nullable=True),
        sa.Column("severite_reelle", sa.Integer(), nullable=True),
        sa.Column("probabilite_reelle", sa.Integer(), nullable=True),
        sa.Column("actions", sa.Text(), nullable=True),
        sa.Column("responsable", sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(["projet_id"], ["projets.id"]),
        sa.ForeignKeyConstraint(["risque_id"], ["risques.id"]),
        sa.PrimaryKeyConstraint("projet_id", "risque_id"),
    )

    op.create_table(
        "projet_documents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("projet_id", sa.UUID(), nullable=False),
        sa.Column("livrable_id", sa.Integer(), nullable=True),
        sa.Column("nom_fichier", sa.Text(), nullable=False),
        sa.Column("chemin_minio", sa.Text(), nullable=True),
        sa.Column("type_mime", sa.String(length=100), nullable=True),
        sa.Column("taille_octets", sa.BigInteger(), nullable=True),
        sa.Column("hash_sha256", sa.String(length=64), nullable=True),
        sa.Column(
            "analyse_ia",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column(
            "date_upload",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["projet_id"], ["projets.id"]),
        sa.ForeignKeyConstraint(["livrable_id"], ["livrables.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # ------------------------------------------------------------------
    # 5. Geospatial tables (Sprint 2)
    # ------------------------------------------------------------------
    op.create_table(
        "postes_sources",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nom", sa.Text(), nullable=False),
        sa.Column("gestionnaire", sa.String(length=50), nullable=True),
        sa.Column("tension_kv", sa.Numeric(), nullable=True),
        sa.Column("puissance_mw", sa.Numeric(), nullable=True),
        sa.Column("capacite_disponible_mw", sa.Numeric(), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(
                geometry_type="POINT",
                srid=4326,
                from_text="ST_GeomFromEWKT",
                name="geometry",
            ),
            nullable=True,
        ),
        sa.Column("source_donnees", sa.String(length=50), nullable=True),
        sa.Column("date_maj", sa.Date(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # ------------------------------------------------------------------
    # 6. Environmental constraint tables (Sprint 13)
    # ------------------------------------------------------------------
    op.create_table(
        "natura2000",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("site_code", sa.String(length=20), nullable=False),
        sa.Column("nom", sa.Text(), nullable=False),
        sa.Column("type_zone", sa.String(length=10), nullable=True),
        sa.Column("surface_ha", sa.Numeric(), nullable=True),
        sa.Column("region", sa.String(length=100), nullable=True),
        sa.Column("departement", sa.String(length=10), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(
                geometry_type="MULTIPOLYGON",
                srid=4326,
                from_text="ST_GeomFromEWKT",
                name="geometry",
            ),
            nullable=True,
        ),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("site_code"),
    )

    op.create_table(
        "znieff",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("code_mnhn", sa.String(length=30), nullable=False),
        sa.Column("nom", sa.Text(), nullable=False),
        sa.Column("type_zone", sa.String(length=10), nullable=True),
        sa.Column("surface_ha", sa.Numeric(), nullable=True),
        sa.Column("region", sa.String(length=100), nullable=True),
        sa.Column("departement", sa.String(length=10), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(
                geometry_type="MULTIPOLYGON",
                srid=4326,
                from_text="ST_GeomFromEWKT",
                name="geometry",
            ),
            nullable=True,
        ),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code_mnhn"),
    )

    # ------------------------------------------------------------------
    # 7. SaaS & veille tables (Sprint 17-18)
    # ------------------------------------------------------------------
    op.create_table(
        "usage_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("tokens_in", sa.Integer(), nullable=True),
        sa.Column("tokens_out", sa.Integer(), nullable=True),
        sa.Column("cost_eur", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_usage_logs_user_id"), "usage_logs", ["user_id"], unique=False
    )

    op.create_table(
        "scraped_contents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("content_text", sa.Text(), nullable=True),
        sa.Column("content_hash", sa.String(length=64), nullable=True),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column(
            "ai_tags",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column(
            "first_seen",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("last_checked", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_changed", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(["source_id"], ["sources_veille.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_scraped_contents_source_id"),
        "scraped_contents",
        ["source_id"],
        unique=False,
    )

    op.create_table(
        "user_watches",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("watch_type", sa.String(length=30), nullable=False),
        sa.Column("watch_value", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_user_watches_user_id"), "user_watches", ["user_id"], unique=False
    )

    op.create_table(
        "alerts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("watch_id", sa.UUID(), nullable=True),
        sa.Column("scraped_content_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("read", sa.Boolean(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["scraped_content_id"], ["scraped_contents.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["watch_id"], ["user_watches.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_alerts_user_id"), "alerts", ["user_id"], unique=False)


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_index(op.f("ix_alerts_user_id"), table_name="alerts")
    op.drop_table("alerts")
    op.drop_index(op.f("ix_user_watches_user_id"), table_name="user_watches")
    op.drop_table("user_watches")
    op.drop_index(op.f("ix_scraped_contents_source_id"), table_name="scraped_contents")
    op.drop_table("scraped_contents")
    op.drop_index(op.f("ix_usage_logs_user_id"), table_name="usage_logs")
    op.drop_table("usage_logs")

    op.drop_table("znieff")
    op.drop_table("natura2000")

    op.drop_table("postes_sources")

    op.drop_table("projet_documents")
    op.drop_table("projet_risques")
    op.drop_table("projet_phases")
    op.drop_index(op.f("ix_projets_user_id"), table_name="projets")
    op.drop_table("projets")

    op.drop_table("outil_competences")
    op.drop_table("norme_livrables")
    op.drop_table("risque_outils")
    op.drop_table("risque_normes")
    op.drop_table("phase_competences")
    op.drop_table("phase_outils")
    op.drop_table("phase_risques")
    op.drop_table("phase_normes")
    op.drop_table("phase_livrables")

    op.drop_table("competences")
    op.drop_table("sources_veille")
    op.drop_table("outils")
    op.drop_table("livrables")
    op.drop_table("risques")
    op.drop_table("normes")
    op.drop_table("phases")
    op.drop_table("blocs")

    op.drop_index(op.f("ix_users_clerk_id"), table_name="users")
    op.drop_table("users")
