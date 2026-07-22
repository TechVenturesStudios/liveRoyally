import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scanner, type IDetectedBarcode, type IScannerError } from "@yudiel/react-qr-scanner";
import { Camera, CheckCircle, Database, FileText, PauseCircle, PlayCircle, Search, ScanLine, XCircle } from "lucide-react";

type ScanState = "idle" | "success" | "error";

type ProviderScanResult = {
  qrCodeData: string;
  voucherId: string;
  memberId: string;
  memberDisplayId: string | null;
  memberNetworkCode: string | null;
  claimedAt: string | null;
  voucher: {
    eventId: string | null;
    type: string | null;
    value: unknown;
    expirationDate: string | null;
    status: string | null;
    promoItem: string | null;
    memberPrice: number | null;
    maxRedemptions: number | null;
  };
  provider: {
    businessName: string | null;
    networkCode: string | null;
    networkName: string | null;
  };
};

type ProviderScanResponse =
  | {
      success: true;
      scan: ProviderScanResult;
    }
  | {
      error: string;
    };

const providerScanExamples = [
  '{"voucherId":"V-123","eventId":"EV0001","useCaseId":"A","networkId":"royal","userId":"USER-1"}',
  '{"voucherId":"V-456","eventId":"EV0050","useCaseId":"P","networkId":"east","userId":"USER-2"}',
];

const ProviderScanQrPage = () => {
  const [manualCode, setManualCode] = useState("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanMessage, setScanMessage] = useState("Point the camera at a member voucher QR code.");
  const [lastRawValue, setLastRawValue] = useState("");
  const [scanResult, setScanResult] = useState<ProviderScanResult | null>(null);
  const [scannerPaused, setScannerPaused] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const detailRows = useMemo(() => {
    if (!scanResult) {
      return [];
    }

    return [
      { label: "Voucher ID", value: scanResult.voucherId },
      { label: "Member", value: scanResult.memberDisplayId || scanResult.memberId },
      { label: "Member Network", value: scanResult.memberNetworkCode || "Unknown" },
      { label: "Event ID", value: scanResult.voucher.eventId || "Unknown" },
      { label: "Use Case", value: scanResult.voucher.type || "N" },
      { label: "Provider", value: scanResult.provider.businessName || "Unknown provider" },
      { label: "Provider Network", value: scanResult.provider.networkName || scanResult.provider.networkCode || "Unknown" },
      { label: "Claimed At", value: scanResult.claimedAt ? new Date(scanResult.claimedAt).toLocaleString() : "Unknown" },
      { label: "Expires", value: scanResult.voucher.expirationDate ? new Date(scanResult.voucher.expirationDate).toLocaleDateString() : "No expiry" },
      { label: "Status", value: scanResult.voucher.status || "Unknown" },
      { label: "Max Redemptions", value: scanResult.voucher.maxRedemptions ?? "Unlimited" },
      { label: "Member Price", value: scanResult.voucher.memberPrice ?? "Not set" },
    ];
  }, [scanResult]);

  const lookupQrCode = async (rawQrCodeData: string) => {
    const normalized = rawQrCodeData.trim();
    if (!normalized || normalized === lastRawValue || isLookingUp) {
      return;
    }

    setIsLookingUp(true);
    setLastRawValue(normalized);
    setScannerError(null);

    try {
      const response = await fetch("/api/provider-scan-voucher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ qrCodeData: normalized }),
      });

      const data = (await response.json().catch(() => ({}))) as ProviderScanResponse;

      if (!response.ok || "error" in data) {
        const message = "error" in data ? data.error : "Failed to resolve QR code";
        setScanState("error");
        setScanMessage(message);
        setScanResult(null);
        return;
      }

      setScanResult(data.scan);
      setScanState("success");
      setScanMessage("Voucher found in the database and ready for redemption review.");
      setScannerPaused(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resolve QR code";
      setScanState("error");
      setScanMessage(message);
      setScanResult(null);
      setScannerError(message);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleDetectedCodes = (detectedCodes: IDetectedBarcode[]) => {
    const rawValue = detectedCodes[0]?.rawValue?.trim();
    if (!rawValue) {
      return;
    }

    void lookupQrCode(rawValue);
  };

  const handleScanError = (error: IScannerError) => {
    setScannerError(error.message);
    setScanState("error");
    setScanMessage("Camera access failed or the scanner could not start.");
  };

  const handleManualValidate = (event: React.FormEvent) => {
    event.preventDefault();
    void lookupQrCode(manualCode);
  };

  const handleReset = () => {
    setScannerPaused(false);
    setScannerError(null);
    setScanState("idle");
    setScanMessage("Point the camera at a member voucher QR code.");
    setScanResult(null);
    setManualCode("");
    setLastRawValue("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">Provider Scanner</Badge>
            </div>
            <h1 className="font-barlow text-2xl font-bold text-foreground sm:text-3xl">Scan QR Code</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan a member voucher QR code and pull the voucher details from the database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/dashboard/database-schema">
              <Button variant="outline" className="gap-2">
                <Database className="h-4 w-4" />
                Schema
              </Button>
            </Link>
            <Button variant="outline" className="gap-2" onClick={handleReset}>
              <ScanLine className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-2 border-b bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Camera Scanner</CardTitle>
                  <CardDescription>{scanMessage}</CardDescription>
                </div>
                <Button
                  type="button"
                  variant={scannerPaused ? "default" : "outline"}
                  className="gap-2"
                  onClick={() => setScannerPaused((value) => !value)}
                >
                  {scannerPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                  {scannerPaused ? "Resume" : "Pause"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-inner">
                <div className="relative aspect-[4/5] min-h-[420px] w-full">
                  <Scanner
                    onScan={handleDetectedCodes}
                    onError={handleScanError}
                    formats={["qr_code"]}
                    paused={scannerPaused}
                    allowMultiple={false}
                    constraints={{ facingMode: "environment" }}
                    components={{
                      finder: true,
                      torch: true,
                      zoom: true,
                      onOff: true,
                    }}
                    classNames={{
                      container: "h-full w-full",
                      video: "h-full w-full object-cover",
                    }}
                  />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent p-4 text-white">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Camera className="h-4 w-4" />
                      Rear camera active
                    </div>
                    <p className="mt-1 text-xs text-white/80">
                      Keep the QR code centered in the frame. The QR payload is resolved against the database before results are shown.
                    </p>
                  </div>
                </div>
              </div>

              {scannerError && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <div className="flex items-center gap-2 font-medium">
                    <XCircle className="h-4 w-4" />
                    Scanner issue
                  </div>
                  <p className="mt-1">{scannerError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-white p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Scan Status</div>
                  <div className="mt-2 flex items-center gap-2">
                    {scanState === "success" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : scanState === "error" ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Search className="h-5 w-5 text-primary" />
                    )}
                    <span className="font-medium">
                      {scanState === "success" ? "Voucher found" : scanState === "error" ? "Needs review" : "Waiting for scan"}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last Payload</div>
                  <div className="mt-2 break-all text-sm text-foreground/80">
                    {lastRawValue || "No code scanned yet"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manual Entry</CardTitle>
                <CardDescription>
                  Paste the QR payload if you cannot use the camera.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleManualValidate}>
                  <Input
                    value={manualCode}
                    onChange={(event) => setManualCode(event.target.value)}
                    placeholder='{"voucherId":"V-123",...}'
                    className="royal-input"
                  />
                  <Button type="submit" className="w-full gap-2" disabled={isLookingUp}>
                    <Search className="h-4 w-4" />
                    {isLookingUp ? "Validating..." : "Validate Code"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scan Result</CardTitle>
                <CardDescription>
                  Review the voucher details resolved from the database.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scanResult ? (
                  <div className="space-y-3">
                    {detailRows.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-medium text-right">{item.value}</span>
                      </div>
                    ))}

                    <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
                      <div className="flex items-center gap-2 font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Ready to redeem
                      </div>
                      <p className="mt-1">
                        This scan matched a stored voucher QR payload for your provider network.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button className="flex-1 gap-2">
                        <FileText className="h-4 w-4" />
                        Receipt
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2" onClick={handleReset}>
                        <Camera className="h-4 w-4" />
                        Scan Next
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
                    No scan has been confirmed yet.
                    <div className="mt-4 space-y-2">
                      <div className="font-medium text-foreground">Example QR payloads</div>
                      <ul className="list-disc space-y-1 pl-5">
                        {providerScanExamples.map((example) => (
                          <li key={example} className="break-all">
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProviderScanQrPage;
