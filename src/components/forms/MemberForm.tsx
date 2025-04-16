
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "@/components/ui/FormField";
import { Button } from "@/components/ui/button";
import { MemberUser } from "@/types/user";
import { Card } from "@/components/ui/card";

const ETHNICITY_OPTIONS = [
  { label: "Black or African American", value: "black" },
  { label: "Hispanic or Latino", value: "hispanic" },
  { label: "Asian", value: "asian" },
  { label: "American Indian or Alaska Native", value: "native" },
  { label: "White", value: "white" },
  { label: "Other", value: "other" }
];

const AGE_GROUP_OPTIONS = [
  { label: "18-24", value: "18-24" },
  { label: "25-34", value: "25-34" },
  { label: "35-44", value: "35-44" },
  { label: "45-54", value: "45-54" },
  { label: "55-64", value: "55-64" },
  { label: "65 and older", value: "65+" }
];

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" }
];

// Dummy network options for now
const NETWORK_OPTIONS = [
  { label: "Royal Network", value: "royal" },
  { label: "Premium Network", value: "premium" },
  { label: "Elite Network", value: "elite" }
];

const MemberForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<MemberUser>>({
    networkName: "",
    networkCode: "",
    firstName: "",
    lastName: "",
    zipCode: "",
    email: "",
    phoneNumber: "",
    ethnicity: "",
    ageGroup: "",
    gender: "",
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
    
    // Generate a unique ID starting with 30001
    const userId = `30001${Math.floor(Math.random() * 10000)}`;
    
    // In a real app, we would send the data to an API
    console.log("Submitting member data:", { ...formData, id: userId, userType: "member" });
    
    // For now, let's simulate saving to localStorage
    localStorage.setItem("user", JSON.stringify({ 
      ...formData, 
      id: userId, 
      userType: "member" 
    }));
    
    // Redirect to the dashboard
    navigate("/dashboard");
  };

  return (
    <Card className="royal-card w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 royal-header">Member Registration</h2>
      
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
            label="First Name"
            name="firstName"
            type="text"
            placeholder="Enter your first name"
            required
            value={formData.firstName}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Last Name"
            name="lastName"
            type="text"
            placeholder="Enter your last name"
            required
            value={formData.lastName}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Zip Code"
            name="zipCode"
            type="text"
            placeholder="Enter your zip code"
            required
            value={formData.zipCode}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Email Address"
            name="email"
            type="email"
            placeholder="Enter your email address"
            required
            value={formData.email}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Phone Number"
            name="phoneNumber"
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phoneNumber}
            onChange={handleInputChange}
          />
          
          <FormField
            label="Ethnicity"
            name="ethnicity"
            type="select"
            options={ETHNICITY_OPTIONS}
            value={formData.ethnicity}
            onSelectChange={handleSelectChange("ethnicity")}
          />
          
          <FormField
            label="Age Group"
            name="ageGroup"
            type="select"
            options={AGE_GROUP_OPTIONS}
            value={formData.ageGroup}
            onSelectChange={handleSelectChange("ageGroup")}
          />
          
          <FormField
            label="Gender"
            name="gender"
            type="select"
            options={GENDER_OPTIONS}
            value={formData.gender}
            onSelectChange={handleSelectChange("gender")}
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

export default MemberForm;
