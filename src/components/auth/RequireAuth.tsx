import { ReactNode } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type RequireAuthProps = {
  children: ReactNode;
  role?: "member" | "group_admin";
};

const RequireAuth = ({ children, role }: RequireAuthProps) => {
  const location = useLocation();
  const token = sessionStorage.getItem("unityvault:token");
  const storedRole = sessionStorage.getItem("unityvault:role");

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && storedRole !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-card">
          <h2 className="text-xl font-semibold text-foreground">Access denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You don’t have permission to view this page.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link to="/login">
              <Button className="w-full">Go to login</Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full">Back to home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
