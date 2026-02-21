import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import LoadingFallback from "./LoadingFallback";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <LoadingFallback />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}
