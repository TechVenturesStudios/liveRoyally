import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { CheckCircle, Users, TrendingUp, MapPin, ArrowRight, Instagram, Facebook, Linkedin, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Waitlist = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !userType) {
      toast({
        title: "Please fill in all fields",
        description: "We need your name, email, and user type to add you to the waitlist.",
        variant: "destructive",
      });
      return;
    }
    // Simulate submission
    setIsSubmitted(true);
    toast({
      title: "You're on the list!",
      description: "We'll notify you when Local Metrics launches.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#761cc3] via-[#8b2db8] to-[#dc3daa]">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <Link to="/" className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-[#dc3daa]" />
          <span className="font-['Barlow_Semi_Condensed'] uppercase tracking-wide font-bold text-2xl text-white">
            Local Metrics
          </span>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-8">
            <span className="animate-pulse w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="text-white/90 text-sm font-medium">Coming Soon</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
            JOIN THE MOVEMENT TO
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-pink-200">
              STRENGTHEN LOCAL ECONOMIES
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto">
            Be among the first to access Local Metrics — the platform connecting communities, 
            circulating local dollars, and measuring real economic impact.
          </p>

          {/* Signup Form */}
          {!isSubmitted ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md mx-auto border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
                Reserve Your Spot
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/90 border-0 text-gray-900 placeholder:text-gray-500"
                />
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/90 border-0 text-gray-900 placeholder:text-gray-500"
                />
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-white/90 text-gray-900 border-0"
                >
                  <option value="">I am a...</option>
                  <option value="member">Member (Consumer)</option>
                  <option value="provider">Provider (Business)</option>
                  <option value="partner">Partner (Organization)</option>
                </select>
                <Button 
                  type="submit" 
                  className="w-full bg-[#dc3daa] hover:bg-[#c42d95] text-white font-bold py-6"
                >
                  Join the Waitlist
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
              <p className="text-white/60 text-sm mt-4">
                No spam, ever. We'll only email you when we launch.
              </p>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md mx-auto border border-white/20">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
                You're on the List!
              </h2>
              <p className="text-white/80">
                Thanks for joining, {name}! We'll send you an email at {email} when Local Metrics is ready for you.
              </p>
            </div>
          )}
        </div>

        {/* Features Preview */}
        <div className="max-w-5xl mx-auto mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
              Connect Stakeholders
            </h3>
            <p className="text-white/70">
              Unite members, providers, and partners in a thriving local ecosystem.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
              Measure Impact
            </h3>
            <p className="text-white/70">
              Track real economic data and see your community's growth in real-time.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20 text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
              Circulate Local Dollars
            </h3>
            <p className="text-white/70">
              Keep money flowing within your community through exclusive vouchers and deals.
            </p>
          </div>
        </div>

        {/* Launch Goals */}
        <div className="max-w-3xl mx-auto mt-16 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/30">
          <h3 className="text-2xl font-bold text-white text-center mb-8" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
            LAUNCH GOALS
          </h3>
          <div className="flex flex-wrap justify-center gap-12">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
                150+
              </div>
              <div className="text-white/70">Early Signups</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
                3
              </div>
              <div className="text-white/70">Partner Networks</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif" }}>
                Q3 2026
              </div>
              <div className="text-white/70">Expected Launch</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center">
        {/* Social Media Links */}
        <div className="flex justify-center gap-4 mb-6">
          <a 
            href="https://instagram.com/liveroyally22" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <Instagram className="h-5 w-5 text-white" />
          </a>
          <a 
            href="https://facebook.com/liveroyally22" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <Facebook className="h-5 w-5 text-white" />
          </a>
          <a 
            href="https://linkedin.com/in/liveroyally22" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <Linkedin className="h-5 w-5 text-white" />
          </a>
        </div>
        
        {/* Share Buttons */}
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-full transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share on LinkedIn
          </button>
          <button
            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-full transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share on Facebook
          </button>
        </div>
        
        <p className="text-white/60 text-sm">Follow us @liveroyally22</p>
        <p className="text-white/60 text-sm mt-2">© 2024 Local Metrics. All rights reserved.</p>
        <p className="text-xs mt-1 text-white/40">Romans 8:31</p>
      </footer>
    </div>
  );
};

export default Waitlist;
