
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "@/components/ui/FormField";
import { Button } from "@/components/ui/button";
import { PartnerUser } from "@/types/user";
import { Card } from "@/components/ui/card";

// Dummy network options for now
const NETWORK_OPTIONS = [
  { label: "Royal Network", value: "royal" },
  { label: "Premium Network", value: "premium" },
  { label: "Elite Network", value: "elite" }
];

// Dummy organization category options
const ORGANIZATION_CATEGORIES = [
  { label: "Educational", value: "education" },
  { label: "Non-Profit", value: "nonprofit" },
  { label: "Government", value: "government" },
  { label: "Corporate", value: "corporate" },
  { label: "Community", value: "community" },
  { label: "Other", value: "other" }
];

// Dummy state options
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
  // Add more states as needed
];

const PartnerForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<PartnerUser>>({
    networkName: "",
    networkCode: "",
    agentFirstName: "",
    agentLastName: "",
    agentPhone: "",
    organizationName: "",
    organizationAddress: "",
    organizationCity: "",
    organizationState: "",
    organizationZip: "",
    organizationCategory: "",
    organizationEmail: "",
    organizationPhone: "",
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
    
    // Generate a unique ID starting with 10001
    const userId = `10001${Math.floor(Math.random() * 10000)}`;
    
    // In a real app, we would send the data to an API
    console.log("Submitting partner data:", { ...formData, id: userId, userType: "partner" });
    
    // For now, let's simulate saving to localStorage
    localStorage.setItem("user", JSON.stringify({ 
      ...formData, 
      id: userId, 
      userType: "partner",
      email: formData.organizationEmail // For login purposes
    }));
    
    // Redirect to the dashboard
    navigate("/dashboard");
  };

  return (
    <Card className="royal-card w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 royal-header">Partner Registration</h2>
      
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
            label="Organization Name"
            name="organizationName"
            type="text"
            placeholder="Enter organization name"
            required
            value={formData.organizationName}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Organization Address"
            name="organizationAddress"
            type="text"
            placeholder="Enter organization address"
            required
            value={formData.organizationAddress}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Organization City"
            name="organizationCity"
            type="text"
            placeholder="Enter organization city"
            required
            value={formData.organizationCity}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Organization State"
            name="organizationState"
            type="select"
            required
            options={STATE_OPTIONS}
            value={formData.organizationState}
            onSelectChange={handleSelectChange("organizationState")}
          />
          
          <FormField
            label="Organization Zip"
            name="organizationZip"
            type="text"
            placeholder="Enter organization zip"
            required
            value={formData.organizationZip}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Organization Category"
            name="organizationCategory"
            type="select"
            required
            options={ORGANIZATION_CATEGORIES}
            value={formData.organizationCategory}
            onSelectChange={handleSelectChange("organizationCategory")}
          />
          
          <FormField
            label="Organization Email Address"
            name="organizationEmail"
            type="email"
            placeholder="Enter organization email"
            required
            value={formData.organizationEmail}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Organization Phone Number"
            name="organizationPhone"
            type="tel"
            placeholder="Enter organization phone"
            required
            value={formData.organizationPhone}
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

export default PartnerForm;
