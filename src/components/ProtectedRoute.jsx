import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const allow = sessionStorage.getItem("fromHome");

  if (!allow) {
    return <Navigate to="/" replace />;
  }

  return children;
}