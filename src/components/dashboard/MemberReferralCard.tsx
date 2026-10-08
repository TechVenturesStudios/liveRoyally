import React, { useEffect, useState } from "react";
import { Gift, Copy, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getUserFromStorage } from "@/utils/userStorage";
import { toast } from "sonner";

export default function MemberReferralCard() {
  const [email, setEmail] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [total, setTotal] = useState(0);
  const [rewarded, setRewarded] = useState(0);
  const [sending, setSending] = useState(false);

  const query = () => {
    const cognitoId = getUserFromStorage()?.cognitoId;
    return cognitoId ? `?cognitoId=${encodeURIComponent(cognitoId)}` : "";
  };

  useEffect(() => {
    fetch(`/api/referrals${query()}`).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setTotal(data.total || 0);
      setRewarded(data.rewarded || 0);
    }).catch(() => undefined);
  }, []);

  const sendReferral = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      const response = await fetch(`/api/referrals${query()}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inviteeEmail: email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create referral");
      setReferralLink(data.referralLink);
      setEmail("");
      setTotal((count) => count + 1);
      toast.success(data.emailed ? "Referral invitation sent" : "Referral link created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create referral");
    } finally {
      setSending(false);
    }
  };

  const copyLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied");
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg"><Gift className="h-5 w-5 text-primary" /> Refer a friend</CardTitle>
        <CardDescription>Invite someone to Local Metrics. You earn referral points when they register.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="friend@example.com" />
          <Button onClick={sendReferral} disabled={sending || !email.trim()}><Send className="h-4 w-4 mr-2" />{sending ? "Sending..." : "Invite"}</Button>
        </div>
        {referralLink && <div className="flex gap-2"><Input value={referralLink} readOnly /><Button variant="outline" onClick={copyLink}><Copy className="h-4 w-4 mr-2" />Copy link</Button></div>}
        <p className="text-xs text-muted-foreground">Referrals: {total} · Rewards earned: {rewarded}</p>
      </CardContent>
    </Card>
  );
}
