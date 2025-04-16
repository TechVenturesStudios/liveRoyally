
import React from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Crown, ShieldCheck, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 shadow-sm bg-white">
        <div className="container mx-auto flex justify-between items-center">
          <Logo />
          <div className="space-x-4">
            <Button 
              variant="ghost" 
              className="text-royal hover:text-royal-dark"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
            <Button 
              className="bg-royal hover:bg-royal-dark text-white"
              onClick={() => navigate("/register")}
            >
              Register
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="royal-gradient text-white py-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Live Life <span className="text-gold">Royally</span>
          </h1>
          <p className="text-xl max-w-2xl mx-auto mb-10">
            Connect customers and businesses with exclusive rewards and experiences through our premium engagement platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              className="bg-gold hover:bg-gold-dark text-charcoal text-lg px-8 py-6"
              onClick={() => navigate("/register")}
            >
              Create an Account
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-cream">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 royal-header">
            Experience the Royal Advantage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-royal/10 rounded-full p-4 inline-block mb-6">
                <Crown className="h-8 w-8 text-royal" />
              </div>
              <h3 className="text-xl font-bold mb-4">Premium Experiences</h3>
              <p className="text-gray-600">
                Access exclusive deals and offers from top businesses in your network.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-royal/10 rounded-full p-4 inline-block mb-6">
                <ShieldCheck className="h-8 w-8 text-royal" />
              </div>
              <h3 className="text-xl font-bold mb-4">Secure Engagement</h3>
              <p className="text-gray-600">
                Safely connect with businesses through our verified QR code system.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-royal/10 rounded-full p-4 inline-block mb-6">
                <Zap className="h-8 w-8 text-royal" />
              </div>
              <h3 className="text-xl font-bold mb-4">Reward Points</h3>
              <p className="text-gray-600">
                Earn rewards with every interaction and track your engagement score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-charcoal text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Join the Royal Network?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-10">
            Create your account today and start experiencing the benefits of Live Royally.
          </p>
          <Button 
            className="bg-gold hover:bg-gold-dark text-charcoal text-lg px-8 py-6"
            onClick={() => navigate("/register")}
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-charcoal text-white border-t border-charcoal-light">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo size="large" />
            <div className="mt-6 md:mt-0">
              <p>&copy; {new Date().getFullYear()} Live Royally. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
