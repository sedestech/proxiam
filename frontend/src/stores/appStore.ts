import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface AppState {
  sidebarOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("proxiam-theme");
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", isDark);
  localStorage.setItem("proxiam-theme", theme);
}

// Apply on load
applyTheme(getInitialTheme());

// Listen for system theme changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    const current = localStorage.getItem("proxiam-theme");
    if (current === "system") {
      applyTheme("system");
    }
  });

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  theme: getInitialTheme(),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
}));
