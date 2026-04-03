import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role");
    const username = sessionStorage.getItem("username");
    if (token && role) setUser({ token, role, username });
    setLoading(false);
  }, []);

  const login = (data) => {
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("role", data.role);
    sessionStorage.setItem("username", data.username);
    sessionStorage.setItem("email", data.email); 
    sessionStorage.setItem("user_id", data.user_id);
    setUser({ token: data.token, role: data.role, username: data.username, email: data.email, user_id: data.user_id });
  };

  const logout = () => {
    sessionStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
