import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { completeNewPasswordChallenge, confirmPasswordReset, loginWithCognito } from "@/api/auth";
import { saveUserToStorage } from "@/utils/userStorage";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [challengeSession, setChallengeSession] = useState("");
  const [isResetCodeMode, setIsResetCodeMode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const needsNewPassword = Boolean(challengeSession);
  const isPasswordUpdateMode = needsNewPassword || isResetCodeMode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isPasswordUpdateMode) {
      if (!email) {
        setError("Email is required");
        return;
      }

      if (isResetCodeMode && !resetCode.trim()) {
        setError("Verification code is required");
        return;
      }

      if (!newPassword || !confirmPassword) {
        setError("New password and confirmation are required");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        return;
      }
    } else if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      if (needsNewPassword) {
        const user = await completeNewPasswordChallenge(email, challengeSession, newPassword);
        saveUserToStorage(user);
        toast.success("Password updated", { description: "Welcome to Live Royally!" });
        navigate("/dashboard");
        return;
      }

      if (isResetCodeMode) {
        await confirmPasswordReset(email, resetCode, newPassword);
        setIsResetCodeMode(false);
        setResetCode("");
        setNewPassword("");
        setConfirmPassword("");
        setPassword("");
        toast.success("Password reset", { description: "Sign in with your new password." });
        return;
      }

      const result = await loginWithCognito(email, password);

      if ("challengeName" in result) {
        setChallengeSession(result.session);
        setEmail(result.email);
        setPassword("");
        toast.info("Create a new password to finish signing in");
        return;
      }

      const user = result.user;
      saveUserToStorage(user);
      toast.success("Login successful", { description: "Welcome back!" });
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      toast.error("Login failed", { description: message });
    } finally {
      setLoading(false);
      setPassword("");
    }
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
            <h1 className="text-2xl font-bold royal-header text-center">
              {isPasswordUpdateMode ? "Create New Password" : "Sign In"}
            </h1>
            <p className="text-gray-600 text-center">
              {isResetCodeMode
                ? "Enter your password reset verification code and choose a new password."
                : needsNewPassword
                  ? "Your temporary password was accepted. Choose a permanent password for your account."
                : "Welcome back to Live Royally"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isPasswordUpdateMode && (
                <>
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
                </>
              )}

              {isPasswordUpdateMode && (
                <>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={needsNewPassword}
                      required
                    />
                  </div>

                  {isResetCodeMode && (
                    <div className="space-y-2">
                      <Label>Verification Code</Label>
                      <Input
                        inputMode="numeric"
                        placeholder="Enter reset code"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter a new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-royal hover:bg-royal-dark text-white"
                disabled={loading}
              >
                {loading
                  ? isPasswordUpdateMode
                    ? "Updating password..."
                    : "Signing in..."
                  : isPasswordUpdateMode
                    ? "Set Password & Sign In"
                    : "Sign In"}
              </Button>
            </form>

            {!needsNewPassword && (
              <div className="space-y-3 pt-4 text-center text-sm text-gray-600">
                <button
                  type="button"
                  className="text-royal hover:text-royal-dark"
                  onClick={() => {
                    setError("");
                    setIsResetCodeMode((current) => !current);
                    setPassword("");
                    setResetCode("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  {isResetCodeMode ? "Back to sign in" : "Have a password reset code?"}
                </button>

                {!isResetCodeMode && (
                  <p>
                    Don't have an account?{" "}
                <span
                  className="text-royal hover:text-royal-dark cursor-pointer"
                  onClick={() => navigate("/register")}
                >
                  Register
                </span>
                  </p>
                )}
              </div>
            )}
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
