
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportCardProps {
  title: string;
  description: string;
  items: string[];
}

const ReportCard = ({ title, description, items }: ReportCardProps) => (
  <Card className="p-6">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <Button variant="outline" className="flex items-center gap-2">
        <Download className="h-4 w-4" />
        <span>Export</span>
      </Button>
    </div>
    <ul className="list-disc pl-5 text-sm space-y-2 text-gray-600">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </Card>
);

const ReportsGrid = () => {
  const reports = [
    {
      title: "Redemption Summary Report",
      description: "Overview of all voucher redemptions by date range",
      items: [
        "Total redemptions by date range",
        "Breakdown by voucher type",
        "Value of redemptions",
        "Geographic distribution of redemptions",
      ],
    },
    {
      title: "Demographic Analysis",
      description: "Demographic breakdown of voucher redemptions",
      items: [
        "Redemptions by age group",
        "Redemptions by gender",
        "Redemptions by ethnicity",
        "Cross-tabulation of demographics",
      ],
    },
    {
      title: "Provider Performance",
      description: "Analysis of voucher redemptions by provider",
      items: [
        "Redemption counts by provider",
        "Value of redemptions by provider",
        "Provider location analysis",
        "Provider redemption trends",
      ],
    },
    {
      title: "Event Effectiveness",
      description: "Analysis of voucher redemptions by originating event",
      items: [
        "Redemption rates by event",
        "Time-to-redemption analysis",
        "Event ROI calculations",
        "Comparative event performance",
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Reports</CardTitle>
        <CardDescription>
          Standard reports that can be generated from redemption data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report, index) => (
            <ReportCard
              key={index}
              title={report.title}
              description={report.description}
              items={report.items}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsGrid;
