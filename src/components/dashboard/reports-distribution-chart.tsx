"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { getCategoryNameForDisplay } from "@/lib/utils";

// Suvienodinta spalvų paletė, kad atitiktų kategorijų pasirinkimo langą
const CATEGORY_COLORS: Record<string, string> = {
  fuel_theft: "#ef4444",       // red-500
  driving_safety: "#06b6d4",   // cyan-500
  behavior: "#f97316",         // orange-500
  discipline: "#ca8a04",       // yellow-600
  technical_damage: "#ec4899", // pink-500
  legal_reputation: "#22c55e", // green-500
  other_category: "#6b7280",   // gray-500
  default: "#a1a1aa",
};


export function ReportsDistributionChart({ reports }: { reports: any[] }) {
  const { t } = useLanguage();

  const data = Object.entries(
    reports.reduce((acc: Record<string, number>, report) => {
      const cat = report.category || "other_category";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).map(([id, value]) => ({
    id: id, // Pridedame ID, kad galėtume priskirti spalvą
    name: getCategoryNameForDisplay(id, t),
    value,
  }));

  return (
    <Card className="flex flex-col h-full transition-shadow duration-300 hover:shadow-glow-primary">
      <CardHeader className="items-center pb-2">
        <CardTitle className="text-lg">Nusižengimų statistika</CardTitle>
        <CardDescription>Pasiskirstymas pagal AI kategorijas</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip 
                contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))'
                }}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CATEGORY_COLORS[entry.id] || CATEGORY_COLORS.default} 
                    stroke="none" 
                  />
                ))}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
