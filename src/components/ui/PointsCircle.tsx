import React from "react";

interface PointsCircleProps {
  points: number;
  maxPoints?: number;
  size?: "sm" | "md";
}

const PointsCircle = ({ points, maxPoints = 300, size = "md" }: PointsCircleProps) => {
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const fontSize = size === "sm" ? "text-[6px]" : "text-[7px]";
  const ratio = Math.min(points / maxPoints, 1);

  return (
    <svg viewBox="0 0 36 36" className={sizeClass}>
      <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
      <circle
        cx="18" cy="18" r="15"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeDasharray={`${ratio * 94.25} 94.25`}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
      <text
        x="18" y="19"
        textAnchor="middle"
        dominantBaseline="central"
        className={`fill-foreground ${fontSize} font-bold`}
      >
        {points}
      </text>
    </svg>
  );
};

export default PointsCircle;
