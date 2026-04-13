import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";
import { Zap, Sun, Moon } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      const res = await API.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      login(res.data.access_token);
      navigate("/");
    } catch (err) {
      if (err.response) {
        const d = err.response.data?.detail;
        setError(typeof d === "string" ? d : "Invalid email or password.");
      } else {
        setError("Unable to reach the server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37,99,235,0.14) 0%, transparent 70%), var(--bg-app)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", position: "relative",
    }}>
      {/* Dark mode toggle */}
      <button
        onClick={toggleTheme}
        className="icon-btn"
        style={{ position: "absolute", top: "20px", right: "20px" }}
        title="Toggle theme"
      >
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </button>

      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--gradient-cta)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px", boxShadow: "0 4px 16px rgba(37,99,235,0.30)" }}>
            <Zap size={24} strokeWidth={2.5} color="#fff" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-primary)", margin: 0, letterSpacing: "-0.025em" }}>
            Agile<span style={{ color: "var(--accent)" }}>PM</span>
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "4px" }}>Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "32px" }}>
          {error && (
            <div className="alert-error" style={{ marginBottom: "18px" }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email" type="email" required autoFocus
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input" disabled={loading}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password" type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input" disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", padding: "11px", fontSize: "15px", marginTop: "4px" }}>
              {loading ? <><span className="spinner" style={{ marginRight: "8px" }} />Signing in…</> : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "20px" }}>
          AgilePM — Agile Project Management System
        </p>
      </div>
    </div>
  );
}
