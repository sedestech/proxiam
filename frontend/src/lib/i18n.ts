import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  fr: {
    translation: {
      nav: {
        dashboard: "Tableau de bord",
        map: "Cartographie",
        knowledge: "Connaissances",
        viewer3d: "Vue 3D",
        canvas: "Workflow",
        projects: "Projets",
        settings: "Paramètres",
        admin: "Administration",
        veille: "Veille",
      },
      dashboard: {
        title: "Tableau de bord",
        totalProjects: "Projets total",
        activePhases: "Phases actives",
        criticalRisks: "Risques critiques",
        knowledgeItems: "Éléments 6D",
        recentActivity: "Activité récente",
        portfolio: "Portefeuille",
      },
      common: {
        search: "Rechercher...",
        filter: "Filtrer",
        export: "Exporter",
        import: "Importer",
        save: "Enregistrer",
        cancel: "Annuler",
        delete: "Supprimer",
        edit: "Modifier",
        create: "Créer",
        loading: "Chargement...",
        noData: "Aucune donnée",
        score: "Score",
        phase: "Phase",
        risk: "Risque",
        status: "Statut",
      },
      phases: {
        p0: "P0 — Prospection",
        p1: "P1 — Ingénierie",
        p2: "P2 — Autorisations",
        p3: "P3 — Finance",
        p4: "P4 — Construction",
        p5: "P5 — Commissioning",
        p6: "P6 — Exploitation",
        p7: "P7 — Démantèlement",
      },
    },
  },
  en: {
    translation: {
      nav: {
        dashboard: "Dashboard",
        map: "Map",
        knowledge: "Knowledge",
        viewer3d: "3D View",
        canvas: "Workflow",
        projects: "Projects",
        settings: "Settings",
        admin: "Administration",
        veille: "Watch",
      },
      dashboard: {
        title: "Dashboard",
        totalProjects: "Total Projects",
        activePhases: "Active Phases",
        criticalRisks: "Critical Risks",
        knowledgeItems: "6D Items",
        recentActivity: "Recent Activity",
        portfolio: "Portfolio",
      },
      common: {
        search: "Search...",
        filter: "Filter",
        export: "Export",
        import: "Import",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        create: "Create",
        loading: "Loading...",
        noData: "No data",
        score: "Score",
        phase: "Phase",
        risk: "Risk",
        status: "Status",
      },
      phases: {
        p0: "P0 — Prospecting",
        p1: "P1 — Engineering",
        p2: "P2 — Permits",
        p3: "P3 — Finance",
        p4: "P4 — Construction",
        p5: "P5 — Commissioning",
        p6: "P6 — Operation",
        p7: "P7 — Decommissioning",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
