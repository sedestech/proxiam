import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, RoundedBox, Grid } from "@react-three/drei";
import * as THREE from "three";
import { Sun, Wind, Battery, Zap, Eye, RotateCcw } from "lucide-react";
import api from "../lib/api";
import PillarNav from "../components/PillarNav";

interface Projet {
  id: string;
  nom: string;
  filiere: string | null;
  puissance_mwc: number | null;
  commune: string | null;
  departement: string | null;
  statut: string;
  score_global: number | null;
  lon: number | null;
  lat: number | null;
}

const FILIERE_COLORS: Record<string, string> = {
  solaire_sol: "#f59e0b",
  eolien_onshore: "#3b82f6",
  bess: "#10b981",
};

function ProjectBar({
  projet,
  index,
  total,
  selected,
  onSelect,
}: {
  projet: Projet;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = FILIERE_COLORS[projet.filiere || ""] || "#94a3b8";
  const height = Math.max(0.5, (projet.puissance_mwc || 10) / 20);
  const score = projet.score_global || 50;

  // Position in a grid layout
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const spacing = 2.5;
  const x = (col - (cols - 1) / 2) * spacing;
  const z = (row - (Math.ceil(total / cols) - 1) / 2) * spacing;

  // Glow intensity from score
  const emissiveIntensity = selected ? 0.6 : score / 200;

  useFrame(() => {
    if (!meshRef.current) return;
    // Gentle float for selected
    if (selected) {
      meshRef.current.position.y =
        height / 2 + Math.sin(Date.now() * 0.003) * 0.1;
    } else {
      meshRef.current.position.y = height / 2;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Bar */}
      <RoundedBox
        ref={meshRef}
        args={[1.2, height, 1.2]}
        radius={0.08}
        position={[0, height / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={selected ? 1 : 0.85}
        />
      </RoundedBox>

      {/* Label */}
      <Text
        position={[0, height + 0.4, 0]}
        fontSize={0.22}
        color={selected ? "#fff" : "#94a3b8"}
        anchorX="center"
        anchorY="bottom"
        maxWidth={2}
      >
        {projet.nom.length > 15 ? projet.nom.slice(0, 14) + "…" : projet.nom}
      </Text>

      {/* Score badge */}
      {projet.score_global !== null && (
        <Text
          position={[0, height + 0.15, 0.7]}
          fontSize={0.18}
          color="#fff"
          anchorX="center"
        >
          {projet.score_global}
        </Text>
      )}

      {/* Base platform */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[1.6, 0.1, 1.6]} />
        <meshStandardMaterial
          color={selected ? color : "#334155"}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

function Scene({
  projects,
  selected,
  onSelect,
}: {
  projects: Projet[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 8]} intensity={0.8} castShadow />
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.3}
        color="#818cf8"
      />

      {/* Grid floor */}
      <Grid
        args={[30, 30]}
        position={[0, -0.1, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Project bars */}
      {projects.map((p, i) => (
        <ProjectBar
          key={p.id}
          projet={p}
          index={i}
          total={projects.length}
          selected={selected === p.id}
          onSelect={() =>
            onSelect(selected === p.id ? null : p.id)
          }
        />
      ))}

      {/* Controls */}
      <OrbitControls
        makeDefault
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

function filiereIcon(filiere: string | null) {
  switch (filiere) {
    case "solaire_sol":
      return <Sun className="h-4 w-4 text-amber-500" />;
    case "eolien_onshore":
      return <Wind className="h-4 w-4 text-blue-500" />;
    case "bess":
      return <Battery className="h-4 w-4 text-emerald-500" />;
    default:
      return <Zap className="h-4 w-4 text-slate-400" />;
  }
}

export default function Viewer3D() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Deep link: read ?entity=projet&id=123 to auto-select a project
  const deepLinkId = searchParams.get("id");

  const { data: projects } = useQuery<Projet[]>({
    queryKey: ["projets-3d"],
    queryFn: async () => {
      const res = await api.get("/api/projets?limit=50");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Deep link: auto-select project from query param once data loads
  useEffect(() => {
    if (!deepLinkId || !projects) return;
    const match = projects.find((p) => p.id === deepLinkId);
    if (match) setSelectedId(match.id);
  }, [deepLinkId, projects]);

  const selectedProject = projects?.find((p) => p.id === selectedId);

  return (
    <div className="flex h-full flex-col animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("nav.viewer3d")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Portefeuille ENR — Hauteur = MWc, Couleur = Filiere, Intensite =
            Score
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden items-center gap-3 text-xs sm:flex">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-500 dark:text-slate-400">
                Solaire
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-500 dark:text-slate-400">Eolien</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-500 dark:text-slate-400">BESS</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        {/* 3D Canvas */}
        {projects && projects.length > 0 ? (
          <Canvas
            camera={{ position: [12, 10, 12], fov: 50 }}
            style={{ background: "#0f172a" }}
            onClick={() => setSelectedId(null)}
          >
            <Scene
              projects={projects}
              selected={selectedId}
              onSelect={setSelectedId}
            />
          </Canvas>
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-900">
            <p className="text-sm text-slate-500">
              {t("common.loading")}
            </p>
          </div>
        )}

        {/* Selected project info panel */}
        {selectedProject && (
          <div className="absolute bottom-4 left-4 right-4 max-w-sm rounded-xl border border-slate-700 bg-slate-800/90 p-4 backdrop-blur-sm sm:right-auto">
            <div className="flex items-start gap-3">
              {filiereIcon(selectedProject.filiere)}
              <div className="flex-1 min-w-0">
                <h3 className="truncate font-semibold text-white">
                  {selectedProject.nom}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedProject.commune}
                  {selectedProject.departement
                    ? ` (${selectedProject.departement})`
                    : ""}
                </p>
              </div>
              {selectedProject.score_global !== null && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
                  {selectedProject.score_global}
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-slate-400">MWc</p>
                <p className="text-sm font-bold text-white font-mono">
                  {selectedProject.puissance_mwc ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Filiere</p>
                <p className="text-sm font-medium text-white capitalize">
                  {selectedProject.filiere?.replace("_", " ") ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Statut</p>
                <p className="text-sm font-medium text-white capitalize">
                  {selectedProject.statut}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* View indicator */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-slate-800/70 px-2.5 py-1 text-[10px] text-slate-400">
          <Eye className="h-3 w-3" />
          {projects?.length ?? 0} projets
        </div>
      </div>

      {/* Cross-pillar navigation */}
      <PillarNav />
    </div>
  );
}
