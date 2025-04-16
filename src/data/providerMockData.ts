
import { ProviderUser } from "@/types/user";

// Mock data for providers
export const mockProviders: ProviderUser[] = [
  {
    id: "PRV001",
    networkName: "Royal Network",
    networkCode: "ROYAL1",
    email: "provider1@example.com",
    userType: "provider",
    notificationEnabled: true,
    termsAccepted: true,
    agentFirstName: "John",
    agentLastName: "Smith",
    agentPhone: "555-123-4567",
    businessName: "Smith's Merchandise",
    businessCategory: "Retail",
    businessAddress: "123 Commerce St",
    businessCity: "Metropolis",
    businessState: "NY",
    businessZip: "10001",
    businessEmail: "info@smithmerch.com",
    businessPhone: "555-987-6543"
  },
  {
    id: "PRV002",
    networkName: "Royal Network",
    networkCode: "ROYAL1",
    email: "provider2@example.com",
    userType: "provider",
    notificationEnabled: true,
    termsAccepted: true,
    agentFirstName: "Emma",
    agentLastName: "Johnson",
    agentPhone: "555-234-5678",
    businessName: "Johnson Cafe",
    businessCategory: "Food & Beverage",
    businessAddress: "456 Main St",
    businessCity: "Springfield",
    businessState: "IL",
    businessZip: "62701",
    businessEmail: "info@johnsoncafe.com",
    businessPhone: "555-876-5432"
  },
  {
    id: "PRV003",
    networkName: "Royal Network",
    networkCode: "ROYAL1",
    email: "provider3@example.com",
    userType: "provider",
    notificationEnabled: false,
    termsAccepted: true,
    agentFirstName: "Michael",
    agentLastName: "Williams",
    agentPhone: "555-345-6789",
    businessName: "Williams Fitness",
    businessCategory: "Health & Wellness",
    businessAddress: "789 Gym Ave",
    businessCity: "Fitsville",
    businessState: "CA",
    businessZip: "90210",
    businessEmail: "info@williamsfitness.com",
    businessPhone: "555-765-4321"
  }
];

// Mock events data
export const mockEvents = [
  {
    id: "EVT001",
    title: "Summer Market Festival",
    status: "pending", // pending, active, completed
    date: "2025-06-15",
    time: "10:00 AM - 4:00 PM",
    location: "Downtown Plaza",
    description: "A vibrant market showcasing local businesses and artisans",
    organizer: "City Business Association",
    participated: false,
    networkScore: 150
  },
  {
    id: "EVT002",
    title: "Business Networking Expo",
    status: "pending",
    date: "2025-05-20",
    time: "6:00 PM - 9:00 PM",
    location: "Grand Hotel Conference Center",
    description: "Connect with other businesses in the Royal Network",
    organizer: "Chamber of Commerce",
    participated: false,
    networkScore: 200
  },
  {
    id: "EVT003",
    title: "Spring Community Fair",
    status: "completed",
    date: "2025-03-28",
    time: "11:00 AM - 5:00 PM",
    location: "Central Park",
    description: "Annual community gathering with local vendors and entertainment",
    organizer: "Parks Department",
    participated: true,
    networkScore: 175
  },
  {
    id: "EVT004",
    title: "Holiday Shopping Event",
    status: "completed",
    date: "2024-12-15",
    time: "12:00 PM - 8:00 PM",
    location: "Shopping District",
    description: "Special holiday promotion event for local shops",
    organizer: "Business Improvement District",
    participated: true,
    networkScore: 225
  },
  {
    id: "EVT005",
    title: "Small Business Showcase",
    status: "active",
    date: "2025-07-10",
    time: "10:00 AM - 3:00 PM",
    location: "Convention Center",
    description: "Showcase your products and services to the community",
    organizer: "Small Business Association",
    participated: false,
    networkScore: 300
  }
];

// Mock authorized representatives
export const mockAuthorizedReps = [
  {
    id: "USR001",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "555-111-2222",
    role: "Primary Representative",
    status: "active"
  },
  {
    id: "USR002",
    name: "Michael Chen",
    email: "michael@example.com",
    phone: "555-333-4444",
    role: "Secondary Representative",
    status: "active"
  }
];

// Mock network members for authorized representative selection
export const mockNetworkMembers = [
  {
    id: "MEM001",
    name: "Alex Turner",
    email: "alex@example.com",
    memberSince: "2024-01-15"
  },
  {
    id: "MEM002",
    name: "Jessica Williams",
    email: "jessica@example.com",
    memberSince: "2024-02-03"
  },
  {
    id: "MEM003",
    name: "David Miller",
    email: "david@example.com",
    memberSince: "2024-03-21"
  }
];
