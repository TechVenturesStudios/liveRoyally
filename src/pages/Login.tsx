import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js";
import { userPool } from "@/lib/cognito.client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    const user = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: async (session) => {
        console.log("Login successful:", session);
        toast.success("Login successful", { description: "Welcome back!" });

        const idToken = session.getIdToken().getJwtToken();
        const accessToken = session.getAccessToken().getJwtToken();
        const cognitoSub = session.getIdToken().payload.sub;

        // Store tokens
        localStorage.setItem("idToken", idToken);
        localStorage.setItem("accessToken", accessToken);

        try {
          const res = await fetch(
            `https://6dgikqae3grzlgeasd2l3fatku0vsadv.lambda-url.us-east-2.on.aws/?cognitoId=${cognitoSub}`
          );

          const data = await res.json();
          console.log("DB user info:", data);

          if (!res.ok || !data.user_type) {
            throw new Error("User does not exist in database");
          }

          // Choose the right profile object based on user_type
          let profile: any = null;
          if (data.user_type === "member") {
            profile = data.member_profile;
          } else if (data.user_type === "provider") {
            profile = data.provider_profile;
          } else if (data.user_type === "partner") {
            profile = data.partner_profile;
          }

          // Store a richer user object in localStorage
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: data.user_id,
              email: data.email,
              userType: data.user_type,
              displayId: data.display_id,
              firstName: data.first_name,
              lastName: data.last_name,
              phoneNumber: data.phone_number,
              profile:data.profile, // member/provider/partner profile depending on userType
            })
          );

          // Go to role router (which will send them to the right dashboard)
          navigate("/dashboard");
        } catch (err: any) {
          console.error("DB lookup error:", err);
          setError("Could not load user profile.");
          toast.error("Login error", {
            description: err.message || "User profile not found in the database",
          });
        }

        setLoading(false);
      },

      onFailure: (err) => {
        console.error("Login failed:", err);
        setError(err.message || "Authentication failed");
        toast.error("Login failed", { description: err.message });
        setLoading(false);
      },

      newPasswordRequired: (userAttributes, requiredAttributes) => {
        delete userAttributes.email_verified;
        delete userAttributes.phone_number_verified;

        const newPassword = prompt("Please enter a new password:");

        user.completeNewPasswordChallenge(newPassword!, {}, {
          onSuccess: (session) => {
            console.log("Password changed successfully");
            navigate("/dashboard");
          },
          onFailure: (err) => {
            console.error("Failed to change password:", err);
          }
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex flex-col">
      <header className="py-4 px-6 shadow-sm bg-white">
        <div className="container mx-auto flex justify-between items-center">
          <Logo />
          <button
            onClick={() => navigate("/register")}
            className="text-royal hover:text-royal-dark transition-colors"
          >
            Register
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <Card className="royal-card w-full max-w-md">
          <div className="space-y-6 p-6">
            <h1 className="text-2xl font-bold royal-header text-center">Sign In</h1>
            <p className="text-gray-600 text-center">Welcome back to Live Royally</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-royal hover:bg-royal-dark text-white"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 pt-4">
              Don't have an account?{" "}
              <span
                className="text-royal hover:text-royal-dark cursor-pointer"
                onClick={() => navigate("/register")}
              >
                Register
              </span>
            </p>
          </div>
        </Card>
      </main>

      <footer className="py-6 bg-charcoal text-white text-center">
        <p>&copy; {new Date().getFullYear()} Live Royally. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;
