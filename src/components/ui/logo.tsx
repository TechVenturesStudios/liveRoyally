
import { TrendingUp } from "lucide-react";

export const Logo = ({ size = "default" }: { size?: "small" | "default" | "large" }) => {
  const sizes = {
    small: "text-lg",
    default: "text-2xl",
    large: "text-4xl"
  };

  return (
    <div className="flex items-center gap-2">
      <TrendingUp className={`text-brand-pink ${size === "small" ? "h-5 w-5" : size === "large" ? "h-8 w-8" : "h-6 w-6"}`} />
      <span className={`font-['Barlow_Semi_Condensed'] uppercase tracking-wide font-bold ${sizes[size]} text-brand-purple`}>Local Metrics</span>
    </div>
  );
};
