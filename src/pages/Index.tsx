
import React from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, RefreshCw, Building } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 shadow-sm bg-white">
        <div className="container mx-auto flex justify-between items-center">
          <Logo />
          {!isMobile && (
            <div className="space-x-4">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => navigate("/register")}
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white py-20 px-6">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Strengthen <span className="text-yellow-300">Local Economies</span>
          </h1>
          <p className="text-xl max-w-2xl mx-auto mb-10">
            Connect businesses, consumers, and community stakeholders to circulate dollars locally and drive sustainable economic development.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              className="bg-yellow-400 hover:bg-yellow-500 text-emerald-900 text-lg px-8 py-6"
              onClick={() => navigate("/register")}
            >
              Join Your Community
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-white hover:bg-white hover:text-emerald-700 text-white text-lg px-8 py-6"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-emerald-700">
            Community Economic Development
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-emerald-100 rounded-full p-4 inline-block mb-6">
                <RefreshCw className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Circulate Local Dollars</h3>
              <p className="text-gray-600">
                Keep money flowing within your community by connecting local businesses and consumers.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-emerald-100 rounded-full p-4 inline-block mb-6">
                <Users className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Connect Stakeholders</h3>
              <p className="text-gray-600">
                Bridge the gap between businesses, consumers, and community organizations.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-emerald-100 rounded-full p-4 inline-block mb-6">
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-4">Measure Impact</h3>
              <p className="text-gray-600">
                Track and analyze economic activity and development metrics within your community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-800 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Strengthen Your Local Economy?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-10">
            Join Local Metrics today and be part of the community economic development movement.
          </p>
          <Button 
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 text-lg px-8 py-6"
            onClick={() => navigate("/register")}
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white border-t border-gray-800">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo size="large" />
            <div className="mt-6 md:mt-0 text-center md:text-right">
              <p>&copy; {new Date().getFullYear()} Local Metrics. All rights reserved.</p>
              <p className="text-sm mt-2 opacity-80">Romans 8:31</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
