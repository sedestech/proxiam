import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setTokenGetter } from "../lib/api";

/**
 * Hook that connects Clerk auth to our API client.
 * Must be rendered inside ClerkProvider.
 */
export function useClerkToken() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      setTokenGetter(() => getToken());
    }
  }, [isSignedIn, getToken]);
}
