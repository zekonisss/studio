"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { getCategoryNameForDisplay } from "@/lib/utils";

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#64748b"];

export function ReportsDistributionChart({ reports }: { reports: any[] }) {
  const { t } = useLanguage();

  const data = Object.entries(
    reports.reduce((acc: Record<string, number>, report) => {
      const cat = report.category || "other_category";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {})
  ).map(([id, value]) => ({
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
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
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
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
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
