import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";

// Payment Pages
import FarmerPaymentsPage from "./pages/FarmerPaymentsPage";
import FPOPaymentsPage from "./pages/FPOPaymentsPage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";

// Layout & Landing
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";

// Language Popup
import LanguagePopup from "./components/landing/LanguagePopup";

// Auth
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Dashboards
import DashboardPage from "./pages/DashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import FPODashboardPage from "./pages/FPODashboardPage";
import BuyerDashboardPage from "./pages/BuyerDashboardPage";

// Marketplace / Other Pages
import MandiPricesPage from "./pages/MandiPricesPage";
import PriceDetailPage from "./pages/PriceDetailPage";
import BuyerMarketPage from "./pages/BuyerMarketPage";
import MyLotsPage from "./pages/MyLotsPage";
import BrowseLotsPage from "./pages/BrowseLotsPage";
import CreateLotPage from "./pages/CreateLotPage";
import LogisticsPage from "./pages/LogisticsPage";
import PaymentsPage from "./pages/PaymentsPage";
import DisputePage from "./pages/DisputePage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLandingPage, setIsLandingPage] = useState(location.pathname === "/");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(
    localStorage.getItem("bf_user_role") || "farmer",
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // =====================================================
  // LANGUAGE POPUP
  // =====================================================
  const [showLanguagePopup, setShowLanguagePopup] = useState(true);

  // =====================================================
  // LANGUAGE INITIALIZATION
  // =====================================================
  useEffect(() => {
    const savedLanguage = localStorage.getItem("bf_language");

    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  // =====================================================
  // JWT SESSION RESTORE
  // =====================================================

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("bf_auth_token");

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "https://bharat-fasal.onrender.com/api/auth/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          localStorage.removeItem("bf_auth_token");
          localStorage.removeItem("bf_logged_in");
          localStorage.removeItem("bf_user_role");

          setIsLoggedIn(false);
          setCurrentUser(null);
          setUserRole("farmer");

          return;
        }

        const backendUser = data.user;

        const user = {
          id: backendUser.id,
          name: backendUser.name,
          companyName: backendUser.organizationName || "",
          email: backendUser.email || "",
          role: backendUser.role,
          location: backendUser.village || "",
          phone: backendUser.mobile,
          district: backendUser.district || "",
          state: backendUser.state || "",
        };

        setCurrentUser(user);
        setUserRole(backendUser.role);
        setIsLoggedIn(true);

        localStorage.setItem("bf_logged_in", "true");
        localStorage.setItem("bf_user_role", backendUser.role);
      } catch (error) {
        console.error("Session restore error:", error);

        setIsLoggedIn(false);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  // =====================================================
  // LANGUAGE DIRECTION
  // =====================================================
  useEffect(() => {
    const lang = i18n.language || "en";

    const dir = lang === "ur" ? "rtl" : "ltr";

    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }, [i18n.language]);

  // =====================================================
  // LANDING PAGE CHECK
  // =====================================================
  useEffect(() => {
    if (location.pathname === "/") {
      setIsLandingPage(true);
    } else {
      setIsLandingPage(false);
    }
  }, [location.pathname]);

  // =====================================================
  // GET STARTED
  // =====================================================
  const handleGetStarted = () => {
    navigate("/register");
  };

  // =====================================================
  // LANDING LOGIN
  // =====================================================
  const handleLandingLogin = () => {
    navigate("/login");
  };

  // =====================================================
  // LOGIN
  // =====================================================
  const handleLogin = (role = "farmer", user = null) => {
    localStorage.setItem("bf_logged_in", "true");
    localStorage.setItem("bf_user_role", role);

    setUserRole(role);
    setCurrentUser(user);
    setIsLoggedIn(true);

    navigate("/");
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const handleLogout = () => {
    localStorage.removeItem("bf_auth_token");
    localStorage.removeItem("bf_logged_in");
    localStorage.removeItem("bf_user_role");

    setIsLoggedIn(false);
    setUserRole("farmer");
    setCurrentUser(null);

    navigate("/");
  };

  // =====================================================
  // LANGUAGE POPUP COMPLETE
  // =====================================================
  const handleLanguageComplete = () => {
    setShowLanguagePopup(false);
  };

  // =====================================================
  // PUBLIC LANDING PAGE + LANGUAGE POPUP
  // =====================================================
  if (authLoading) {
    return null;
  }

  if (location.pathname === "/" && !isLoggedIn) {
    return (
      <>
        <LandingPage
          onGetStarted={handleGetStarted}
          onLogin={handleLandingLogin}
        />

        {showLanguagePopup && (
          <LanguagePopup onComplete={handleLanguageComplete} />
        )}
      </>
    );
  }

  // =====================================================
  // REGISTER
  // =====================================================
  if (location.pathname === "/register" && !isLoggedIn) {
    return <RegisterPage onLogin={handleLogin} />;
  }

  // =====================================================
  // LOGIN
  // =====================================================
  if (location.pathname === "/login" && !isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // =====================================================
  // PUBLIC MANDI PRICES
  // =====================================================
  if (location.pathname === "/prices" && !isLoggedIn) {
    return <MandiPricesPage />;
  }

  // =====================================================
  // NOT LOGGED IN
  // =====================================================
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // =====================================================
  // DASHBOARD
  // =====================================================
  const getDashboard = () => {
    switch (userRole) {
      case "admin":
        return <AdminDashboardPage user={currentUser} />;

      case "fpo":
        return <FPODashboardPage user={currentUser} />;

      case "buyer":
        return <BuyerDashboardPage user={currentUser} />;

      case "farmer":
      default:
        return <DashboardPage user={currentUser} />;
    }
  };

  // =====================================================
  // AUTHENTICATED APPLICATION
  // =====================================================
  return (
    <Layout onLogout={handleLogout} user={currentUser}>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={getDashboard()} />

        {/* Mandi Prices */}
        <Route path="/prices" element={<MandiPricesPage />} />

        {/* Price Details */}
        <Route path="/prices/:commodityId" element={<PriceDetailPage />} />

        {/* Buyers */}
        <Route
          path="/buyers"
          element={<BuyerMarketPage user={currentUser} />}
        />

        {/* Create Lot */}
        <Route
          path="/lots/create"
          element={<CreateLotPage user={currentUser} />}
        />

        {/* Lots */}
        <Route
          path="/lots"
          element={
            userRole === "buyer" ? (
              <BrowseLotsPage user={currentUser} />
            ) : (
              <MyLotsPage user={currentUser} />
            )
          }
        />

        {/* Logistics */}
        <Route path="/logistics" element={<LogisticsPage />} />

        {/* Payments */}
        <Route
          path="/payments"
          element={
            userRole === "farmer" ? (
              <FarmerPaymentsPage user={currentUser} />
            ) : userRole === "fpo" ? (
              <FPOPaymentsPage user={currentUser} />
            ) : userRole === "buyer" ? (
              <PaymentsPage user={currentUser} />
            ) : userRole === "admin" ? (
              <AdminPaymentsPage user={currentUser} />
            ) : (
              <FarmerPaymentsPage user={currentUser} />
            )
          }
        />

        {/* Disputes */}
        <Route path="/disputes" element={<DisputePage />} />

        {/* Settings */}
        <Route
          path="/settings"
          element={<SettingsPage onLogout={handleLogout} user={currentUser} />}
        />

        {/* Unknown Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
