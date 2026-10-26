import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Crown, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import SquareCardCheckout from "@/components/forms/SquareCardCheckout";
import { getUserFromStorage } from "@/utils/userStorage";

const TOKEN_KEY = "live-royally-join-token";

export default function LiveRoyallyJoinPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState(false);
  const user = getUserFromStorage();

  useEffect(() => {
    const queryToken = new URLSearchParams(location.search).get("token")?.trim();
    const storedToken = queryToken || sessionStorage.getItem(TOKEN_KEY) || "";
    if (queryToken) {
      sessionStorage.setItem(TOKEN_KEY, queryToken);
      navigate({ pathname: location.pathname, search: "" }, { replace: true });
    }
    setToken(storedToken);
    if (!storedToken) { setError("This invitation link is missing or has expired."); setLoading(false); return; }
    fetch(`/api/live-royally-join?token=${encodeURIComponent(storedToken)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "This invitation is no longer valid");
        setInvite(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load invitation"))
      .finally(() => setLoading(false));
  }, [location.pathname, location.search, navigate]);

  const handleJoin = async (paymentToken: string) => {
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/live-royally-join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, paymentToken }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to activate subscription");
      sessionStorage.removeItem(TOKEN_KEY);
      navigate("/registration-success/provider?liveRoyally=true", { replace: true });
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to activate subscription"); }
    finally { setSubmitting(false); }
  };

  return <div className="min-h-screen bg-gradient-to-b from-cream to-cream-dark flex flex-col">
    <header className="py-4 px-6 shadow-sm bg-white"><div className="container mx-auto"><Logo /></div></header>
    <main className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl royal-card">
        <CardHeader className="text-center"><div className="mx-auto mb-3 rounded-full bg-primary/10 p-3 w-fit"><Crown className="h-8 w-8 text-primary" /></div><CardTitle className="text-3xl royal-header">You’re joining the Live Royally Network</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : error ? <p className="text-center text-destructive">{error}</p> : <>
            <div className="rounded-lg border bg-muted/30 p-5 text-center"><p className="font-semibold">{invite.provider.businessName}</p><p className="text-sm text-muted-foreground mt-1">Live Royally Network membership</p><p className="text-3xl font-bold text-primary mt-4">$100<span className="text-base font-normal text-muted-foreground">/year</span></p><p className="text-sm text-muted-foreground mt-1">Your subscription starts immediately after successful payment.</p></div>
            {!user ? <div className="space-y-3 text-center"><p className="text-sm text-muted-foreground">Sign in to your existing provider account to continue. Your invitation will be saved while you sign in.</p><Button className="w-full" onClick={() => navigate("/login?returnTo=/join-network")}>Sign in to continue</Button></div> : user.userType !== "provider" ? <p className="text-center text-destructive">Please sign in with the provider account that received this invitation.</p> : !checkout ? <div className="space-y-3"><p className="text-sm text-center text-muted-foreground">You’re signed in as <strong>{user.email}</strong>.</p><Button className="w-full" onClick={() => setCheckout(true)}>Continue as {invite.provider.businessName}</Button></div> : <SquareCardCheckout total={100} isSubmitting={submitting} billingContact={{ givenName: user.firstName, familyName: user.lastName, email: user.email, countryCode: "US" }} onSubmitToken={handleJoin} submitError={error} buttonLabel="Pay $100 and join the network" securityMessage="Secure Square card entry. Your card will be charged today and your annual subscription will start immediately." />}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Secure payment processing by Square</div>
          </>}
        </CardContent>
      </Card>
    </main>
  </div>;
}
