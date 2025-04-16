
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, getUserFromStorage } from "@/utils/userStorage";
import { toast } from "sonner";

/**
 * Custom hook for authentication checks in dashboard components
 * Returns user data and loading state
 */
export const useAuthCheck = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for user in localStorage
    const userData = getUserFromStorage();
    console.log("User data from storage:", userData);
    
    if (!userData) {
      console.log("No user found, redirecting to login");
      toast.error("Please sign in to access the dashboard");
      navigate("/login");
      return;
    }
    
    // Small delay to ensure state updates properly
    setTimeout(() => {
      setUser(userData);
      setIsLoading(false);
    }, 100);
  }, [navigate]);

  return { user, isLoading };
};
