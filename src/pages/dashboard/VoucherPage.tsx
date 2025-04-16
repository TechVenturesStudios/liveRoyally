
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import QRCode from "@/components/qr/QRCode";
import { Button } from "@/components/ui/button";
import { Tag, Calendar, Store } from "lucide-react";

const VoucherPage = () => {
  // Mock voucher data
  const vouchers = [
    {
      id: "VC12345",
      eventId: "EV0001",
      useCaseId: "A1",
      networkId: "royal",
      title: "25% Off at Royal Cafe",
      description: "Get 25% off your entire purchase at Royal Cafe",
      provider: "Royal Cafe",
      expiry: "2024-05-15",
      status: "active"
    },
    {
      id: "VC12346",
      eventId: "EV0002",
      useCaseId: "B1",
      networkId: "royal",
      title: "$10 Off at Elite Boutique",
      description: "Get $10 off any purchase over $50 at Elite Boutique",
      provider: "Elite Boutique",
      expiry: "2024-05-20",
      status: "active"
    }
  ];

  // Get user ID from localStorage
  const getUserId = () => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      return user.id || "30001";
    }
    return "30001";
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold royal-header">Your Vouchers</h1>
        <p className="text-gray-600 mt-2">
          Present these vouchers at participating providers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vouchers.map((voucher) => (
          <Card key={voucher.id} className="p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">{voucher.title}</h2>
                <p className="text-gray-600 mb-4">{voucher.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Store className="h-4 w-4 mr-2" />
                    <span>Provider: {voucher.provider}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Expires: {new Date(voucher.expiry).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Tag className="h-4 w-4 mr-2" />
                    <span>Voucher ID: {voucher.id}</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button className="bg-royal hover:bg-royal-dark text-white">
                    View Details
                  </Button>
                </div>
              </div>
              
              <div>
                <QRCode
                  voucherId={voucher.id}
                  eventId={voucher.eventId}
                  useCaseId={voucher.useCaseId}
                  networkId={voucher.networkId}
                  userId={getUserId()}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {vouchers.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No Vouchers Available</h3>
          <p className="text-gray-500">You don't have any active vouchers yet.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default VoucherPage;
