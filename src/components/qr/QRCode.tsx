
import React from "react";
import { Card } from "@/components/ui/card";
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  voucherId: string;
  eventId: string;
  useCaseId: string;
  networkId: string;
  userId: string;
}

const QRCode = ({ voucherId, eventId, useCaseId, networkId, userId }: QRCodeProps) => {
  // Generate a QR code based on these parameters
  const qrCodeData = `${voucherId}-${eventId}-${useCaseId}-${networkId}-${userId}`;
  
  return (
    <Card className="p-6 max-w-xs mx-auto">
      <div className="text-center">
        <h3 className="font-barlow font-bold text-lg mb-2">Voucher QR Code</h3>
        <p className="text-gray-500 text-sm mb-4">Scan this code at the provider location</p>
        
        {/* Real QR code */}
        <div className="w-48 h-48 mx-auto flex items-center justify-center mb-4 p-2 border-4 border-royal">
          <QRCodeSVG 
            value={qrCodeData} 
            size={176}
            level="H"
            includeMargin={false}
          />
        </div>
        
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p><span className="font-semibold">Voucher ID:</span> {voucherId}</p>
          <p><span className="font-semibold">Event ID:</span> {eventId}</p>
          <p><span className="font-semibold">Use Case:</span> {useCaseId}</p>
        </div>
      </div>
    </Card>
  );
};

export default QRCode;
