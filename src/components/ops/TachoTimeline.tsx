
"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const timelineData = [
  { status: 'Rest', duration: 4, start: '00:00', end: '04:00' },
  { status: 'Driving', duration: 4.5, start: '04:00', end: '08:30' },
  { status: 'Work', duration: 0.75, start: '08:30', end: '09:15' },
  { status: 'Rest', duration: 0.75, start: '09:15', end: '10:00' },
  { status: 'Driving', duration: 4.5, start: '10:00', end: '14:30' },
  { status: 'Error', duration: 0.5, start: '14:30', end: '15:00' },
  { status: 'Rest', duration: 9, start: '15:00', end: '00:00' },
];

const statusStyles = {
  Driving: 'bg-green-500',
  Work: 'bg-blue-500',
  Rest: 'bg-gray-300 dark:bg-gray-600',
  Error: 'bg-red-500',
};

const statusLabels = {
    Driving: 'Vairavimas',
    Work: 'Kitas darbas',
    Rest: 'Poilsis',
    Error: 'Neatpažinta / Klaida',
}

export function TachoTimeline() {
  const totalDuration = 24;

  return (
    <TooltipProvider>
      <div className="w-full space-y-3">
        <div className="flex w-full h-10 rounded-lg overflow-hidden border dark:border-gray-700">
          {timelineData.map((item, index) => {
            const width = (item.duration / totalDuration) * 100;
            return (
              <Tooltip key={index} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div
                    className={`h-full ${statusStyles[item.status as keyof typeof statusStyles]} transition-all duration-300 hover:brightness-110`}
                    style={{ width: `${width}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{statusLabels[item.status as keyof typeof statusLabels]}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.start} - {item.end} ({item.duration}h)
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {/* Timeline Labels */}
        <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
