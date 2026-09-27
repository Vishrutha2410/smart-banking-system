import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  loginUser,
  registerUser,
  fetchCurrentUser,
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ======================================================
  // RESTORE LOGIN SESSION
  // ======================================================

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();

        setUser(currentUser);
        setToken(storedToken);

        localStorage.setItem(
          "user",
          JSON.stringify(currentUser)
        );
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  // ======================================================
  // LOGIN
  // ======================================================

  const login = useCallback(
    async (email, password, role) => {
      const data = await loginUser({
        email,
        password,
        role,
      });

      // Store login information
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      // Redirect according to role
      navigate(
        data.user.role === "admin"
          ? "/admin"
          : "/dashboard"
      );

      return data;
    },
    [navigate]
  );

  // ======================================================
  // REGISTER
  // ======================================================
  //
  // IMPORTANT:
  // Registration does NOT automatically log the user in.
  //
  // After successful registration:
  //   1. User is created in MongoDB
  //   2. No bank account is created
  //   3. User is redirected to Login
  //
  // ======================================================

  const register = useCallback(
    async (payload) => {
      const data = await registerUser(payload);

      // IMPORTANT:
      // Do NOT store token here.
      // Do NOT set the user here.
      // Do NOT automatically open the dashboard.

      // Registration is complete.
      // User must login manually.
      navigate("/login");

      return data;
    },
    [navigate]
  );

  // ======================================================
  // LOGOUT
  // ======================================================

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    navigate("/login");
  }, [navigate]);

  // ======================================================
  // UPDATE USER IN STATE
  // ======================================================

  const updateUserInState = useCallback(
    (updatedUser) => {
      setUser(updatedUser);

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );
    },
    []
  );

  // ======================================================
  // CONTEXT VALUE
  // ======================================================

  const value = {
    user,
    token,
    loading,

    isAuthenticated:
      !!token && !!user,

    isAdmin:
      user?.role === "admin",

    login,
    register,
    logout,
    updateUserInState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ======================================================
// USE AUTH
// ======================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};

export default AuthContext;