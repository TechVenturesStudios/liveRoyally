
import React from 'react';
import { CalendarPlus, Users, ShieldCheck, Gift, Percent, DollarSign } from 'lucide-react';
import { Card } from "@/components/ui/card";

const VoucherWorkflow = () => {
  const steps = [
    {
      title: "Partner Creates Event",
      icon: <CalendarPlus className="w-12 h-12 text-royal" />,
      description: "Partners initiate by creating a new event"
    },
    {
      title: "Providers Join",
      icon: <Users className="w-12 h-12 text-royal" />,
      description: "Network providers join by offering discounts",
      subItems: [
        { icon: <Percent className="w-6 h-6" />, text: "Percentage off" },
        { icon: <DollarSign className="w-6 h-6" />, text: "Dollar amount off" },
        { icon: <Gift className="w-6 h-6" />, text: "Free item" }
      ]
    },
    {
      title: "Partner Approves",
      icon: <ShieldCheck className="w-12 h-12 text-royal" />,
      description: "Partner reviews and approves provider participation"
    },
    {
      title: "Members Access Deals",
      icon: <Gift className="w-12 h-12 text-royal" />,
      description: "Network members can view and purchase new deals"
    }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-barlow font-bold text-royal mb-8 text-center">
        Voucher Package Creation Workflow
      </h2>
      
      <div className="grid md:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <Card
            key={index}
            className="p-6 border-2 border-gray-100 hover:border-royal/20"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="mb-2">
                {step.icon}
              </div>
              
              <h3 className="font-barlow font-bold text-lg text-royal">{step.title}</h3>
              
              <p className="text-sm text-gray-600">{step.description}</p>
              
              {step.subItems && (
                <div className="mt-2 space-y-2">
                  {step.subItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 text-sm"
                    >
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VoucherWorkflow;
