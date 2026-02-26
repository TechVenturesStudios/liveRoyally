import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CognitoUser } from "amazon-cognito-identity-js";
import { userPool } from "@/lib/cognito.client";

const ConfirmAccount = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const user = new CognitoUser({ Username: email, Pool: userPool });

    user.confirmRegistration(code, true, (err, result) => {
      setLoading(false);
      if (err) {
        console.error("Confirmation error:", err);
        setMessage("Invalid code or user not found. Please try again.");
      } else {
        console.log("Confirmation result:", result);
        setMessage("Account confirmed successfully! You can now log in.");
        navigate("/login");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-4 royal-header">Confirm Your Account</h1>
        <p className="text-center text-gray-600 mb-6">
          Enter the verification code sent to your email.
        </p>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter the 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full bg-royal text-white" disabled={loading}>
            {loading ? "Confirming..." : "Confirm Account"}
          </Button>

          {message && (
            <p className="text-center mt-4 text-sm text-gray-700">{message}</p>
          )}
        </form>
      </Card>
    </div>
  );
};

export default ConfirmAccount;
