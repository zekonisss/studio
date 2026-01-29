"use client";

import { useState, useEffect } from 'react';
import { getDriverSearchStats } from '@/app/(authenticated)/search/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriverSearchStatsProps {
    firstName: string;
    lastName: string;
}

const StatCard = ({ icon: Icon, label, value, isLoading, highlight = false }: { icon: React.ElementType, label: string, value: number, isLoading: boolean, highlight?: boolean }) => (
    <div className={cn(
        "flex items-center gap-3 rounded-lg p-3",
        highlight ? "bg-amber-500/10 text-amber-700 dark:text-amber-500" : "bg-muted/60"
    )}>
        <Icon className="h-5 w-5 shrink-0" />
        <div className="flex-1">
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            {isLoading ? (
                 <Skeleton className="h-5 w-8 mt-1" />
            ) : (
                <div className="text-lg font-bold">{value}</div>
            )}
        </div>
    </div>
);


export function DriverSearchStats({ firstName, lastName }: DriverSearchStatsProps) {
    const [stats, setStats] = useState<{ total: number, recent: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // NAUJAS DIAGNOSTINIS PRANEŠIMAS (matomas naršyklės konsolėje)
        console.log(`[DriverSearchStats] Komponentas gavo: firstName='${firstName}', lastName='${lastName}'`);

        const fetchStats = async () => {
            setIsLoading(true);
            try {
                // Svarbu: perduodame gautus parametrus
                const searchStats = await getDriverSearchStats(firstName, lastName);
                setStats(searchStats);
            } catch (error) {
                console.error("Klaida gaunant vairuotojo statistiką:", error);
                setStats({ total: 0, recent: 0 }); // Fallback on error
            } finally {
                setIsLoading(false);
            }
        };

        if (firstName) {
            fetchStats();
        } else {
            // Jei nėra vardo, nieko nedarome ir rodome nulius
            setIsLoading(false);
            setStats({ total: 0, recent: 0 });
        }
    }, [firstName, lastName]);

    return (
        <div className="mt-4 pt-4 border-t">
             <h4 className="font-semibold text-sm mb-2">Paieškos analitika</h4>
             <div className="grid grid-cols-2 gap-4">
                <StatCard 
                    icon={Clock}
                    label="Patikros (60 d.)"
                    isLoading={isLoading}
                    value={stats?.recent ?? 0}
                    highlight={(stats?.recent ?? 0) > 0}
                />
                <StatCard 
                    icon={BarChart}
                    label="Visos patikros"
                    isLoading={isLoading}
                    value={stats?.total ?? 0}
                />
             </div>
        </div>
    );
}
