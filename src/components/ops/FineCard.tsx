"use client";

import { Badge } from '@/components/ui/badge';
import { FileCode2, Calendar, MapPin, Euro, AlertCircle } from 'lucide-react';

interface FineData {
    date: string;
    time: string;
    amount: string;
    location: string;
    violation: string;
    status: 'Pending' | 'Paid';
}

export function FineCard({ data }: { data: FineData }) {
  const { date, time, amount, location, violation, status } = data;

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <FileCode2 className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
                 </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Baudos informacija</h3>
            </div>
            <Badge variant={status === 'Paid' ? 'default' : 'secondary'} className={status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'}>
                {status === 'Paid' ? 'Apmokėta' : 'Laukiama'}
            </Badge>
        </div>
        <div className="space-y-4 text-sm">
             <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Pažeidimas</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 text-right">{violation}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Calendar className="w-4 h-4" /> Data ir laikas</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{date} {time}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Euro className="w-4 h-4" /> Suma</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{amount}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><MapPin className="w-4 h-4" /> Vieta</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{location}</span>
            </div>
        </div>
    </div>
  );
}
