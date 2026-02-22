import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingFallback from "./components/LoadingFallback";
import PageErrorBoundary from "./components/PageErrorBoundary";

// Eager load: Dashboard (landing page)
import Dashboard from "./pages/Dashboard";

// Lazy load: heavy pages with large dependencies
const Map = lazy(() => import("./pages/Map"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const Viewer3D = lazy(() => import("./pages/Viewer3D"));
const Canvas = lazy(() => import("./pages/Canvas"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Scoring = lazy(() => import("./pages/Scoring"));
const Admin = lazy(() => import("./pages/Admin"));
const Veille = lazy(() => import("./pages/Veille"));
const Settings = lazy(() => import("./pages/Settings"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Compare = lazy(() => import("./pages/Compare"));
const SignIn = lazy(() => import("./pages/SignIn"));
const Billing = lazy(() => import("./pages/Billing"));
const Predictions = lazy(() => import("./pages/Predictions"));

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PageErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
    </PageErrorBoundary>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Auth pages (no layout) */}
      <Route path="sign-in/*" element={<PageWrapper><SignIn /></PageWrapper>} />

      {/* Main app — requires authentication */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="map" element={<PageWrapper><Map /></PageWrapper>} />
        <Route path="knowledge" element={<PageWrapper><Knowledge /></PageWrapper>} />
        <Route path="3d" element={<PageWrapper><Viewer3D /></PageWrapper>} />
        <Route path="canvas" element={<PageWrapper><Canvas /></PageWrapper>} />
        <Route path="projects" element={<PageWrapper><Projects /></PageWrapper>} />
        <Route path="projects/:id" element={<PageWrapper><ProjectDetail /></PageWrapper>} />
        <Route path="scoring" element={<PageWrapper><Scoring /></PageWrapper>} />
        <Route path="admin" element={<PageWrapper><Admin /></PageWrapper>} />
        <Route path="veille" element={<PageWrapper><Veille /></PageWrapper>} />
        <Route path="compare" element={<PageWrapper><Compare /></PageWrapper>} />
        <Route path="search" element={<PageWrapper><SearchResults /></PageWrapper>} />
        <Route path="settings" element={<PageWrapper><Settings /></PageWrapper>} />
        <Route path="billing" element={<PageWrapper><Billing /></PageWrapper>} />
        <Route path="predictions" element={<PageWrapper><Predictions /></PageWrapper>} />
      </Route>
    </Routes>
  );
}
