import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { type Authority, useAuth } from "@/contexts/AuthContext";

interface AuthorityRouteProps {
  authority?: Authority | Authority[];
  allAuthorities?: Authority[];
}

const AuthorityRoute: React.FC<AuthorityRouteProps> = ({ authority, allAuthorities = [] }) => {
  const { principal } = useAuth();

  const anyAuthorities = authority ? (Array.isArray(authority) ? authority : [authority]) : [];
  const hasAnyRequired = anyAuthorities.length === 0 || principal?.authorities?.some((a) => anyAuthorities.includes(a));
  const hasAllRequired = allAuthorities.every((requiredAuthority) =>
    principal?.authorities?.includes(requiredAuthority)
  );

  if (!hasAnyRequired || !hasAllRequired) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AuthorityRoute;
