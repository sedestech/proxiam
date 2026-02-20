import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import LoadingFallback from "./components/LoadingFallback";

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

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<Map />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="3d" element={<Viewer3D />} />
          <Route path="canvas" element={<Canvas />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="scoring" element={<Scoring />} />
          <Route path="admin" element={<Admin />} />
          <Route path="veille" element={<Veille />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
