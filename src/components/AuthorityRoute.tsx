import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { type Authority, useAuth } from "@/contexts/AuthContext";

interface AuthorityRouteProps {
  authority: Authority | Authority[];
}

const AuthorityRoute: React.FC<AuthorityRouteProps> = ({ authority }) => {
  const { principal } = useAuth();

  const authorities = Array.isArray(authority) ? authority : [authority];

  if (!principal?.authorities?.some((a) => authorities.includes(a))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AuthorityRoute;
