
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center max-w-md px-6">
        <div className="flex justify-center mb-6">
          <div className="bg-royal/10 rounded-full p-6">
            <Crown className="h-12 w-12 text-royal" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4 royal-header">404</h1>
        <p className="text-xl text-gray-600 mb-8">
          We couldn't find the page you're looking for
        </p>
        <div className="space-y-4">
          <Button 
            onClick={() => navigate("/")} 
            className="w-full bg-royal hover:bg-royal-dark text-white"
          >
            Return to Home
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)} 
            className="w-full border-royal text-royal"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
