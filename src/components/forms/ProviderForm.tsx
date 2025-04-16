import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "@/components/ui/FormField";
import { Button } from "@/components/ui/button";
import { ProviderUser } from "@/types/user";
import { Card } from "@/components/ui/card";

// Comprehensive list of all 50 U.S. states
const STATE_OPTIONS = [
  { label: "Alabama", value: "AL" },
  { label: "Alaska", value: "AK" },
  { label: "Arizona", value: "AZ" },
  { label: "Arkansas", value: "AR" },
  { label: "California", value: "CA" },
  { label: "Colorado", value: "CO" },
  { label: "Connecticut", value: "CT" },
  { label: "Delaware", value: "DE" },
  { label: "Florida", value: "FL" },
  { label: "Georgia", value: "GA" },
  { label: "Hawaii", value: "HI" },
  { label: "Idaho", value: "ID" },
  { label: "Illinois", value: "IL" },
  { label: "Indiana", value: "IN" },
  { label: "Iowa", value: "IA" },
  { label: "Kansas", value: "KS" },
  { label: "Kentucky", value: "KY" },
  { label: "Louisiana", value: "LA" },
  { label: "Maine", value: "ME" },
  { label: "Maryland", value: "MD" },
  { label: "Massachusetts", value: "MA" },
  { label: "Michigan", value: "MI" },
  { label: "Minnesota", value: "MN" },
  { label: "Mississippi", value: "MS" },
  { label: "Missouri", value: "MO" },
  { label: "Montana", value: "MT" },
  { label: "Nebraska", value: "NE" },
  { label: "Nevada", value: "NV" },
  { label: "New Hampshire", value: "NH" },
  { label: "New Jersey", value: "NJ" },
  { label: "New Mexico", value: "NM" },
  { label: "New York", value: "NY" },
  { label: "North Carolina", value: "NC" },
  { label: "North Dakota", value: "ND" },
  { label: "Ohio", value: "OH" },
  { label: "Oklahoma", value: "OK" },
  { label: "Oregon", value: "OR" },
  { label: "Pennsylvania", value: "PA" },
  { label: "Rhode Island", value: "RI" },
  { label: "South Carolina", value: "SC" },
  { label: "South Dakota", value: "SD" },
  { label: "Tennessee", value: "TN" },
  { label: "Texas", value: "TX" },
  { label: "Utah", value: "UT" },
  { label: "Vermont", value: "VT" },
  { label: "Virginia", value: "VA" },
  { label: "Washington", value: "WA" },
  { label: "West Virginia", value: "WV" },
  { label: "Wisconsin", value: "WI" },
  { label: "Wyoming", value: "WY" }
];

// Dummy network options for now
const NETWORK_OPTIONS = [
  { label: "Royal Network", value: "royal" },
  { label: "Premium Network", value: "premium" },
  { label: "Elite Network", value: "elite" }
];

// Dummy business category options
const BUSINESS_CATEGORIES = [
  { label: "Retail", value: "retail" },
  { label: "Food & Beverage", value: "food" },
  { label: "Entertainment", value: "entertainment" },
  { label: "Health & Wellness", value: "health" },
  { label: "Professional Services", value: "services" },
  { label: "Other", value: "other" }
];

const ProviderForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<ProviderUser>>({
    networkName: "",
    networkCode: "",
    agentFirstName: "",
    agentLastName: "",
    agentPhone: "",
    businessName: "",
    businessCategory: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZip: "",
    businessEmail: "",
    businessPhone: "",
    notificationEnabled: false,
    termsAccepted: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string) => (checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a unique ID starting with 20001
    const userId = `20001${Math.floor(Math.random() * 10000)}`;
    
    // In a real app, we would send the data to an API
    console.log("Submitting provider data:", { ...formData, id: userId, userType: "provider" });
    
    // For now, let's simulate saving to localStorage
    localStorage.setItem("user", JSON.stringify({ 
      ...formData, 
      id: userId, 
      userType: "provider",
      email: formData.businessEmail // For login purposes
    }));
    
    // Redirect to the dashboard
    navigate("/dashboard");
  };

  return (
    <Card className="royal-card w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 royal-header">Provider Registration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Network Name"
            name="networkName"
            type="select"
            required
            options={NETWORK_OPTIONS}
            value={formData.networkName}
            onSelectChange={handleSelectChange("networkName")}
          />
          
          <FormField
            label="Network Code"
            name="networkCode"
            type="text"
            placeholder="Network code will be assigned"
            required
            value={formData.networkCode}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Authorized Agent First Name"
            name="agentFirstName"
            type="text"
            placeholder="Enter agent's first name"
            required
            value={formData.agentFirstName}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Authorized Agent Last Name"
            name="agentLastName"
            type="text"
            placeholder="Enter agent's last name"
            required
            value={formData.agentLastName}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Authorized Agent Phone Number"
            name="agentPhone"
            type="tel"
            placeholder="Enter agent's phone number"
            required
            value={formData.agentPhone}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Business Name"
            name="businessName"
            type="text"
            placeholder="Enter business name"
            required
            value={formData.businessName}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Business Category"
            name="businessCategory"
            type="select"
            required
            options={BUSINESS_CATEGORIES}
            value={formData.businessCategory}
            onSelectChange={handleSelectChange("businessCategory")}
          />
          
          <FormField
            label="Business Address"
            name="businessAddress"
            type="text"
            placeholder="Enter business address"
            required
            value={formData.businessAddress}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Business City"
            name="businessCity"
            type="text"
            placeholder="Enter business city"
            required
            value={formData.businessCity}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Business State"
            name="businessState"
            type="select"
            required
            options={STATE_OPTIONS}
            value={formData.businessState}
            onSelectChange={handleSelectChange("businessState")}
          />
          
          <FormField
            label="Business Zip"
            name="businessZip"
            type="text"
            placeholder="Enter business zip"
            required
            value={formData.businessZip}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Business Email Address"
            name="businessEmail"
            type="email"
            placeholder="Enter business email"
            required
            value={formData.businessEmail}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Business Phone Number"
            name="businessPhone"
            type="tel"
            placeholder="Enter business phone"
            required
            value={formData.businessPhone}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="space-y-4">
          <FormField
            label="Notifications"
            name="notificationEnabled"
            type="checkbox"
            placeholder="I want to receive email/text notifications"
            checked={formData.notificationEnabled}
            onCheckboxChange={handleCheckboxChange("notificationEnabled")}
          />
          
          <FormField
            label="Terms of Agreement"
            name="termsAccepted"
            type="checkbox"
            placeholder="I accept the Terms of Agreement"
            required
            checked={formData.termsAccepted}
            onCheckboxChange={handleCheckboxChange("termsAccepted")}
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate("/")} className="border-royal text-royal">
            Cancel
          </Button>
          <Button type="submit" className="bg-royal hover:bg-royal-dark text-white">
            Register
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ProviderForm;
