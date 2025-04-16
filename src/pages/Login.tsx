
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // In a real app, we would make an API call to authenticate the user
    // For now, let's simulate a successful login
    
    // Simulate getting the user type based on email
    // In a real application, this would come from the backend after authentication
    let userType = "member"; // default
    
    if (email.includes("provider")) {
      userType = "provider";
    } else if (email.includes("partner")) {
      userType = "partner";
    } else if (email.includes("admin")) {
      userType = "admin";
    }
    
    // Simulate a user object
    const user = {
      id: userType === "member" ? "30001123" : 
           userType === "provider" ? "20001123" : 
           userType === "partner" ? "10001123" : "00001123",
      email,
      userType
    };
    
    // Store the user in localStorage
    localStorage.setItem("user", JSON.stringify(user));
    
    // Redirect to the dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 shadow-sm bg-white">
        <div className="container mx-auto flex justify-between items-center">
          <Logo />
          <div className="space-x-4">
            <button
              onClick={() => navigate("/register")}
              className="text-royal hover:text-royal-dark transition-colors"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <Card className="royal-card w-full max-w-md">
          <div className="space-y-6 p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold royal-header">Sign In</h1>
              <p className="text-gray-600 mt-2">Welcome back to Live Royally</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="royal-input"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="text-sm text-royal hover:text-royal-dark"
                    onClick={(e) => {
                      e.preventDefault();
                      // In a real app, this would navigate to a password reset page
                      alert("Password reset functionality would be here");
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="royal-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-royal hover:bg-royal-dark text-white"
              >
                Sign In
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <a
                  className="text-royal hover:text-royal-dark font-medium"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/register");
                  }}
                >
                  Register
                </a>
              </p>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-charcoal text-white">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} Live Royally. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
