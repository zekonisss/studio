"use client";

import { useState, useEffect } from 'react';
import { Fuel, ShieldAlert, UserX, FileText, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { lt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentActivity({ reports }: { reports: any[] }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const recent = [...reports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'fuel_theft': return <Fuel className="h-4 w-4 text-red-500" />;
      case 'driving_safety': return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case 'behavior': return <UserX className="h-4 w-4 text-blue-500" />;
      default: return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pt-2">
      {recent.map((report, i) => (
        <div key={i} className="flex items-start gap-4">
          <div className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
            {getIcon(report.category)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{report.fullName}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{report.comment}</p>
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
            <Clock className="h-3 w-3" />
            {isClient ? (
              formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: lt })
            ) : (
              <Skeleton className="h-3 w-16" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
