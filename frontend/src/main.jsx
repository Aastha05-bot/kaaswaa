import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./Context/AuthContext";
import { ShopProvider } from "./Context/ShopContext";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ShopProvider>
        <App />
      </ShopProvider>
    </AuthProvider>
  </React.StrictMode>
);