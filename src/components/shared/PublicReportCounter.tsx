"use client";

import { useState, useEffect } from 'react';
import { getPublicReportCount } from '@/app/page-actions';
import { AnimatedCounter } from '@/components/shared/animated-counter';
import { Skeleton } from '@/components/ui/skeleton';

interface PublicReportCounterProps {
  fallbackCount?: number;
}

export function PublicReportCounter({ fallbackCount = 0 }: PublicReportCounterProps) {
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchCount() {
            try {
                const reportCount = await getPublicReportCount();
                setCount(reportCount);
            } catch (error) {
                console.error("Failed to fetch public report count:", error);
                setCount(0);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCount();
    }, []);

    if (isLoading) {
        return <Skeleton className="h-7 w-16 inline-block" />;
    }

    const displayValue = count > 0 ? count : fallbackCount;

    return <AnimatedCounter value={displayValue} />;
}
