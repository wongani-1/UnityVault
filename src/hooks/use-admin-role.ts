import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Hook to verify admin role and prevent unauthorized access to admin features
 * Returns true only if the user has the group_admin role
 */
export const useAdminRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const role = sessionStorage.getItem("unityvault:role");
    const token = sessionStorage.getItem("unityvault:token");
    
    if (!token) {
      navigate("/login");
      return;
    }
    
    if (role !== "group_admin") {
      setIsAdmin(false);
      return;
    }
    
    setIsAdmin(true);
  }, [navigate]);

  return isAdmin;
};
