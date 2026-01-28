"use client";

import { useEffect, useState } from "react";
import { getRecentActivity } from "@/app/page-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Search, ShieldCheck } from "lucide-react";

export function LiveActivityFeed() {
  const [recentLogs, setRecentLogs] = useState<{id: string, text: string, time: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const logs = await getRecentActivity();
        setRecentLogs(logs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <Card className="shadow-sm border-orange-500/20 h-fit">
      <CardHeader className="pb-3 border-b border-orange-100 dark:border-orange-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-500" />
            Rinkos Aktyvumas
          </CardTitle>
          <div className="flex h-2 w-2 relative">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Paskutinės patikros sistemoje</p>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4 text-xs text-muted-foreground">Kraunama...</div>
          ) : recentLogs.length > 0 ? (
            recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                <div className="mt-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full">
                  <Search className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="grid gap-0.5 w-full">
                  <p className="text-sm font-semibold text-foreground truncate max-w-[150px]">
                    {log.text}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Patikra</span>
                    <span className="font-mono text-[10px]">
                       {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-xs text-muted-foreground">Nėra duomenų</div>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[10px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-green-600" />
          <span>Duomenys anonimizuoti.</span>
        </div>
      </CardContent>
    </Card>
  );
}
