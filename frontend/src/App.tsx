import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Map from "./pages/Map";
import Knowledge from "./pages/Knowledge";
import Viewer3D from "./pages/Viewer3D";
import Canvas from "./pages/Canvas";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Admin from "./pages/Admin";
import Veille from "./pages/Veille";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="map" element={<Map />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="3d" element={<Viewer3D />} />
        <Route path="canvas" element={<Canvas />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="admin" element={<Admin />} />
        <Route path="veille" element={<Veille />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
