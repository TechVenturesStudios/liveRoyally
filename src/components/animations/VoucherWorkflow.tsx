
import React, { useState, useEffect } from 'react';
import { CalendarPlus, Users, ShieldCheck, Gift, Percent, DollarSign } from 'lucide-react';
import { Card } from "@/components/ui/card";

const VoucherWorkflow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-royal mb-8 text-center">
        Voucher Package Creation Workflow
      </h2>
      
      <div className="grid md:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <Card
            key={index}
            className={`p-6 transition-all duration-500 transform ${
              currentStep === index
                ? 'scale-105 shadow-lg bg-cream'
                : 'scale-100 opacity-70'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`transition-transform duration-500 ${
                currentStep === index ? 'animate-bounce' : ''
              }`}>
                {step.icon}
              </div>
              
              <h3 className="font-semibold text-lg text-royal">{step.title}</h3>
              
              <p className="text-sm text-gray-600">{step.description}</p>
              
              {step.subItems && (
                <div className="mt-4 space-y-2">
                  {step.subItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center space-x-2 text-sm ${
                        currentStep === index ? 'animate-fade-in' : ''
                      }`}
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
      
      <div className="flex justify-center mt-8 space-x-2">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentStep === index ? 'bg-royal scale-125' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default VoucherWorkflow;
