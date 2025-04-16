
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardWelcome from "@/components/dashboard/DashboardWelcome";
import DashboardCards from "@/components/dashboard/DashboardCards";
import { getUserFromStorage } from "@/utils/userStorage";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = getUserFromStorage();
    if (userData) {
      setUser(userData);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <DashboardWelcome />
      <DashboardCards userType={user.userType} />
    </DashboardLayout>
  );
};

export default Dashboard;
