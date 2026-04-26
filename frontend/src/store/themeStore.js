import { create } from "zustand";

// Always light theme for main content area
// Sidebar is always black (hardcoded in Layout)
const useThemeStore = create(() => ({
  dark: false,
  toggle: () => {}, // no-op — theme is fixed black/white
}));

export default useThemeStore;
