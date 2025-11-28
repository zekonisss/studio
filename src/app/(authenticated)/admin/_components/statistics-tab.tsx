"use client";

import { useState, useEffect } from 'react';
import type { Report, UserProfile } from '@/types';
import { getAllReports, getAllUsers } from '@/lib/server/db';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCategoryNameForDisplay } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartData {
  name: string;
  count: number;
}

export function StatisticsTab() {
  const { t } = useLanguage();
  const [reportStats, setReportStats] = useState<ChartData[]>([]);
  const [userStats, setUserStats] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [reports, users] = await Promise.all([getAllReports(), getAllUsers()]);
        
        // Process report stats
        const reportCounts = reports.reduce((acc, report) => {
          const categoryName = getCategoryNameForDisplay(report.category, t);
          acc[categoryName] = (acc[categoryName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        setReportStats(Object.entries(reportCounts).map(([name, count]) => ({ name, count })));

        // Process user stats
        const userCounts = users.reduce((acc, user) => {
          const statusKey = `admin.users.status.${user.paymentStatus}`;
          const statusName = t(statusKey);
          acc[statusName] = (acc[statusName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        setUserStats(Object.entries(userCounts).map(([name, count]) => ({ name, count })));

      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [t]);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Įrašai pagal kategorijas</CardTitle>
        </CardHeader>
        <CardContent>
          {reportStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
                <YAxis allowDecimals={false}/>
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Įrašų skaičius" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p>{t('admin.statistics.noDataForChart')}</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Vartotojai pagal būseną</CardTitle>
        </CardHeader>
        <CardContent>
           {userStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false}/>
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--accent))" name="Vartotojų skaičius" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p>{t('admin.statistics.noDataForChart')}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
