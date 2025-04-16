
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserTypeSelector from "@/components/ui/UserTypeSelector";
import MemberForm from "@/components/forms/MemberForm";
import ProviderForm from "@/components/forms/ProviderForm";
import PartnerForm from "@/components/forms/PartnerForm";
import { Logo } from "@/components/ui/logo";
import { UserType } from "@/types/user";

const Register = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType | null>(null);

  const renderForm = () => {
    switch (userType) {
      case "member":
        return <MemberForm />;
      case "provider":
        return <ProviderForm />;
      case "partner":
        return <PartnerForm />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 shadow-sm bg-white">
        <div className="container mx-auto flex justify-between items-center">
          <Logo />
          <div className="space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="text-royal hover:text-royal-dark transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-6xl mx-auto space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold royal-header mb-4">Create Your Account</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join Live Royally and connect with exclusive deals and rewards. 
              Register now to start your royal experience.
            </p>
          </div>

          {!userType ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center mb-6">I want to join as a:</h2>
              <UserTypeSelector onSelect={setUserType} selectedType={userType} />
            </div>
          ) : (
            <div className="w-full space-y-8">
              <button
                onClick={() => setUserType(null)}
                className="flex items-center text-royal hover:text-royal-dark mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 mr-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                Back to selection
              </button>

              {renderForm()}
            </div>
          )}
        </div>
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

export default Register;
