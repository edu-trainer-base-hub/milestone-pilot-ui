import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, principal } = useAuth();
  const loc = useLocation();

  console.log("PrivateRoute - in ", loc.pathname);
  console.log("PrivateRoute principal - in ", principal?.authorities);

  return isAuthenticated || loc.pathname === "#login" ? (
    <Outlet />
  ) : (
    <Navigate to="login" state={{ from: loc }} replace />
  );
};

export default PrivateRoute;
