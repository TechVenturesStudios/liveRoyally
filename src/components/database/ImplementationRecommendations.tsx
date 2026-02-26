
import React from "react";

interface Recommendation {
  title: string;
  description: string;
}

const recommendations: Recommendation[] = [
  {
    title: "Database Storage",
    description: "Store all redemption data in a dedicated database table. This enables real-time reporting and analysis. Use the schema shown above."
  },
  {
    title: "Report Generation",
    description: "Provide downloadable reports in CSV and PDF formats for offline analysis. These can be generated on-demand or scheduled automatically."
  },
  {
    title: "Data Capture",
    description: "When a provider scans a voucher, all the required information should be captured automatically from the QR code and user profile."
  },
  {
    title: "Analytics Dashboard",
    description: "Provide a real-time analytics dashboard that visualizes redemption data across different dimensions (demographics, geography, time)."
  }
];

const ImplementationRecommendations = () => {
  return (
    <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
      <h3 className="text-lg font-barlow font-bold text-blue-800 mb-2">Implementation Recommendations</h3>
      <p className="text-blue-700 mb-4">
        Based on the requirements, here are the recommended approaches for tracking voucher redemptions:
      </p>
      <ul className="list-disc pl-5 space-y-3 text-blue-700">
        {recommendations.map((rec, index) => (
          <li key={index}>
            <strong>{rec.title}:</strong> {rec.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ImplementationRecommendations;
