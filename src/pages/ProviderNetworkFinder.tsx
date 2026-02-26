import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/ui/logo";
import { Building, MapPin, Users, ArrowRight, Crown, Search } from "lucide-react";
import { Link } from "react-router-dom";

const networks = [
  { id: "live-royally", name: "Live Royally Network", description: "Premier community network for local businesses" },
  { id: "downtown-district", name: "Downtown Business District", description: "Connecting downtown merchants and services" },
  { id: "community-first", name: "Community First Alliance", description: "Neighborhood-focused business collective" },
  { id: "main-street", name: "Main Street Partners", description: "Supporting traditional main street businesses" },
  { id: "urban-collective", name: "Urban Business Collective", description: "Modern urban business network" },
];

const states = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const ProviderNetworkFinder = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = () => {
    if (city && state) {
      setSearchPerformed(true);
    }
  };

  const handleJoinLiveRoyally = () => {
    // Navigate to registration with Live Royally pre-selected
    window.location.href = "/register?network=live-royally&type=provider";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline" className="bg-white text-primary border-primary font-bold">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
            Join a Local Partner Network
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect your business with community members and grow together. 
            Choose to join the Live Royally Network or find local partners in your area.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Live Royally Network Card */}
          <Card className="relative overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-colors">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-semibold rounded-bl-lg">
              Recommended
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-primary/10">
                  <Crown className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-heading">Live Royally Network</CardTitle>
                  <CardDescription>Premier community network</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Join our flagship network and connect with thousands of community members 
                ready to support local businesses like yours.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Access to 10,000+ community members</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-primary" />
                  <span>500+ active providers nationwide</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Available in all 50 states</span>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  size="lg" 
                  className="w-full group"
                  onClick={handleJoinLiveRoyally}
                >
                  Join Live Royally Network
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Find Local Partners Card */}
          <Card className="border-2 border-muted hover:border-muted-foreground/30 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-heading">Find Local Partners</CardTitle>
                  <CardDescription>Discover networks in your area</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Search for partner organizations in your city and state to find 
                the best network fit for your business.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    placeholder="Enter your city" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent className="bg-background max-h-60">
                      {states.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="network">Available Networks</Label>
                  <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                    <SelectTrigger id="network">
                      <SelectValue placeholder="Select a network" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {networks.map((network) => (
                        <SelectItem key={network.id} value={network.id}>
                          {network.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="w-full"
                  onClick={handleSearch}
                  disabled={!city || !state}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search for Partners
                </Button>
              </div>

              {searchPerformed && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    {networks.length} networks available in {city}, {state}. 
                    Select a network above to learn more.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Network Details Section */}
        {selectedNetwork && (
          <div className="mt-12 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">
                  {networks.find(n => n.id === selectedNetwork)?.name}
                </CardTitle>
                <CardDescription>
                  {networks.find(n => n.id === selectedNetwork)?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="flex-1">
                    Request to Join
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Contact Partner
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold font-heading mb-4">Why Join a Network?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Community Access</h3>
              <p className="text-sm text-muted-foreground">
                Connect with local members actively looking to support businesses like yours.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Campaign Tools</h3>
              <p className="text-sm text-muted-foreground">
                Create vouchers, host events, and track customer engagement effortlessly.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Local Focus</h3>
              <p className="text-sm text-muted-foreground">
                Keep dollars circulating in your community and strengthen local economies.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} LOCAL METRICS. All rights reserved.</p>
          <p className="mt-2 text-xs opacity-70">Romans 8:31</p>
        </div>
      </footer>
    </div>
  );
};

export default ProviderNetworkFinder;
