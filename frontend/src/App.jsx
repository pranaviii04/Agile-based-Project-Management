import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import AppRoutes from "./routes/AppRoutes";

function AppShell() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const showShell = isAuthenticated && location.pathname !== "/login";

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const toggleSidebar = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  // Scroll-animation observer (MutationObserver + IntersectionObserver)
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("is-visible"); }),
      { threshold: 0.05 }
    );
    const observe = () =>
      document.querySelectorAll(".fade-up:not(.is-visible)").forEach((el) => io.observe(el));
    observe();
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [location.pathname]);

  if (!showShell) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-app)" }}>
        <AppRoutes />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <TopBar collapsed={collapsed} />
      <main className={`main-content${collapsed ? " collapsed" : ""}`}>
        <AppRoutes />
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      {/* react-hot-toast Toaster — placed at root so it works everywhere */}
      <Toaster
        position="bottom-right"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "'Inter', sans-serif",
            fontSize: "14px",
            fontWeight: "500",
            borderRadius: "10px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          },
          success: {
            iconTheme: { primary: "#10B981", secondary: "#fff" },
            style: { background: "#fff", color: "#065F46", border: "1px solid rgba(16,185,129,0.25)" },
          },
          error: {
            iconTheme: { primary: "#EF4444", secondary: "#fff" },
            style: { background: "#fff", color: "#991B1B", border: "1px solid rgba(239,68,68,0.25)" },
          },
        }}
      />
      <AppShell />
    </ThemeProvider>
  );
}

export default App;
