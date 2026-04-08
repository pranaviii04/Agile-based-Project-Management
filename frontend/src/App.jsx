import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";
import { useAuth } from "./context/AuthContext";

function App() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const showNavbar = isAuthenticated && location.pathname !== "/login";

  return (
    <div className="min-h-screen bg-slate-950">
      {showNavbar && <Navbar />}
      <main>
        <AppRoutes />
      </main>
    </div>
  );
}

export default App;
