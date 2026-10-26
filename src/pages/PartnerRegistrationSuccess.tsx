import { Clock3, Home, LogIn, Mail, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const PartnerRegistrationSuccess = () => {
  const navigate = useNavigate();
  const { userType } = useParams<{ userType: "member" | "provider" | "partner" }>();
  const isPartner = userType === "partner";
  const isProvider = userType === "provider";

  if (!isPartner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex flex-col">
        <header className="py-4 px-6 shadow-sm bg-white">
          <div className="container mx-auto flex justify-between items-center">
            <Logo />
            <Button
              onClick={() => navigate("/login")}
              className="bg-white hover:bg-white/90 text-brand-purple border border-brand-purple font-bold"
            >
              Sign In
            </Button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="royal-card w-full max-w-xl rounded-xl bg-white p-8 text-center shadow-lg md:p-12">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#eee8f6]">
              <Mail className="h-9 w-9 text-[#51239b]" strokeWidth={2.5} aria-hidden="true" />
            </div>

            <h1 className="mb-4 font-barlow text-3xl font-bold tracking-tight text-[#32106f] md:text-4xl">
              Registration Received
            </h1>
            <p className="mx-auto max-w-md text-base leading-relaxed text-gray-600 md:text-lg">
              {isProvider
                ? "Your application has been submitted to the partner you selected for review."
                : "Your temporary password will be sent to the email address you provided in your registration."}
            </p>

            <div className="mt-8 flex items-start gap-4 rounded-lg border border-[#ddd4e8] bg-[#faf9fc] px-5 py-4 text-left text-base leading-snug text-[#294671]">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#51239b]" strokeWidth={2} aria-hidden="true" />
              <p>
                {isProvider
                  ? "The partner is reviewing your application. You will receive an email when they approve or decline it, and you will not be able to sign in until it is approved."
                  : "Check your inbox for the temporary password, then sign in to your account. If it doesn’t arrive within a few minutes, check your spam folder."}
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                onClick={() => navigate("/login")}
                className="h-[50px] bg-[#51239b] text-base font-medium text-white hover:bg-[#421b82]"
              >
                <LogIn className="h-5 w-5" />
                Continue to Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="h-[50px] border-[#51239b] text-base font-medium text-[#51239b] hover:bg-[#f7f2fc]"
              >
                <Home className="h-5 w-5" />
                Back to Home
              </Button>
            </div>
          </div>
        </main>

        <footer className="py-6 bg-charcoal text-white">
          <div className="container mx-auto text-center">
            <p>&copy; {new Date().getFullYear()} Live Royally. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex flex-col">
      <header className="py-4 px-6 shadow-sm bg-white">
        <div className="container mx-auto flex justify-between items-center">
          <Logo />
          <Button
            onClick={() => navigate("/login")}
            className="bg-white hover:bg-white/90 text-brand-purple border border-brand-purple font-bold"
          >
            Sign In
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="royal-card w-full max-w-xl rounded-xl bg-white p-8 text-center shadow-lg md:p-12">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-[#eee8f6]">
            <ShieldCheck className="h-11 w-11 text-[#51239b]" strokeWidth={2.2} aria-hidden="true" />
          </div>
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[#f4b72d] px-4 py-1 text-sm font-medium uppercase tracking-wide text-[#c86a00]">
            <Clock3 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Pending Approval
          </div>
          <h1 className="mb-4 font-barlow text-4xl font-bold tracking-tight text-[#32106f] md:text-[38px]">
            Partner Application Received
          </h1>
          <p className="mx-auto max-w-md text-gray-600">
            A temporary password will be sent to the email address provided in your registration once your partner account is approved.
          </p>
          <div className="mt-8 flex items-start gap-4 rounded-lg border border-[#ddd4e8] bg-[#faf9fc] px-5 py-4 text-left text-base leading-snug text-[#294671]">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#51239b]" strokeWidth={2} aria-hidden="true" />
            <p>
              Your application is being reviewed by the Local Metrics team. Once it’s approved, watch your inbox for the temporary password you’ll use to sign in.
            </p>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => navigate("/login")} className="h-[50px] bg-[#51239b] text-base font-medium text-white hover:bg-[#421b82]">
              <LogIn className="h-5 w-5" />
              Continue to Sign In
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="h-[50px] border-[#51239b] text-base font-medium text-[#51239b] hover:bg-[#f7f2fc]">
              <Home className="h-5 w-5" />
              Back to Home
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-6 bg-charcoal text-white">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} Live Royally. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PartnerRegistrationSuccess;
