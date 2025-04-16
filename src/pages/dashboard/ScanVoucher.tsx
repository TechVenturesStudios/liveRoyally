
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle } from "lucide-react";

const ScanVoucher = () => {
  const [voucherCode, setVoucherCode] = useState("");
  const [scanResult, setScanResult] = useState<null | "success" | "error">(null);
  const [voucherDetails, setVoucherDetails] = useState<any>(null);

  const handleScanVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, we would validate the QR code against a database
    // For demo purposes, we'll simulate validation with a simple check
    const isValid = voucherCode.includes("-") && voucherCode.split("-").length >= 4;
    
    if (isValid) {
      const [voucherId, eventId, useCaseId, networkId, userId] = voucherCode.split("-");
      
      setScanResult("success");
      setVoucherDetails({
        voucherId,
        eventId,
        useCaseId,
        networkId,
        userId,
        timestamp: new Date().toISOString(),
      });
      
      // In a real app, we'd save this redemption to a database
      console.log("Voucher redeemed:", {
        voucherId,
        eventId,
        useCaseId,
        networkId, 
        userId,
        timestamp: new Date().toISOString(),
      });
    } else {
      setScanResult("error");
      setVoucherDetails(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold royal-header">Scan Voucher</h1>
        <p className="text-gray-600 mt-2">
          Validate and redeem customer vouchers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Scan QR Code</h2>
          <p className="text-gray-600 mb-6">
            Enter the voucher code or scan the QR code to validate the voucher.
          </p>
          
          <form onSubmit={handleScanVoucher} className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter voucher code (e.g., VC12345-EV0001-A1-royal-30001)"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="royal-input flex-1"
              />
              <Button type="submit" className="bg-royal hover:bg-royal-dark text-white">
                <Search className="h-4 w-4 mr-2" /> Validate
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">or</p>
              <Button 
                type="button" 
                variant="outline" 
                className="mt-2 border-royal text-royal"
                onClick={() => {
                  // In a real app, this would trigger camera access for QR scanning
                  alert("In a complete app, this would open the camera for QR code scanning");
                }}
              >
                Scan with Camera
              </Button>
            </div>
          </form>
          
          {scanResult && (
            <div className={`mt-6 p-4 rounded-lg ${scanResult === "success" ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex items-center">
                {scanResult === "success" ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 mr-2" />
                )}
                <h3 className="font-semibold">
                  {scanResult === "success" ? "Voucher Valid" : "Invalid Voucher"}
                </h3>
              </div>
              <p className="text-sm mt-2">
                {scanResult === "success"
                  ? "This voucher is valid and can be redeemed."
                  : "This voucher code is invalid or has already been redeemed."}
              </p>
            </div>
          )}
        </Card>
        
        {voucherDetails && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Voucher Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Voucher ID:</span>
                <span className="font-medium">{voucherDetails.voucherId}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Event ID:</span>
                <span className="font-medium">{voucherDetails.eventId}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Use Case:</span>
                <span className="font-medium">{voucherDetails.useCaseId}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium">{voucherDetails.networkId}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">User ID:</span>
                <span className="font-medium">{voucherDetails.userId}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-600">Redeemed:</span>
                <span className="font-medium">
                  {new Date(voucherDetails.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
            
            <Button 
              className="w-full mt-6 bg-royal hover:bg-royal-dark text-white"
              onClick={() => {
                alert("Voucher has been redeemed successfully!");
                setScanResult(null);
                setVoucherDetails(null);
                setVoucherCode("");
              }}
            >
              Complete Redemption
            </Button>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ScanVoucher;
