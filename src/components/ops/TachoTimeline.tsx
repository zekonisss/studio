
"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Activity {
  type: 'DRIVE' | 'WORK' | 'REST' | 'BREAK' | 'UNKNOWN';
  startTime: string;
  duration: number; // in minutes
}

// Helper to calculate end time
const addMinutes = (time: string, mins: number): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() + mins);
  const newHours = String(date.getHours()).padStart(2, '0');
  const newMinutes = String(date.getMinutes()).padStart(2, '0');
  return `${newHours}:${newMinutes}`;
};

const MOCK_ACTIVITIES: Activity[] = [
  { type: 'REST',    startTime: '00:00', duration: 360 }, // 6h rest
  { type: 'WORK',    startTime: '06:00', duration: 15 },  // 15m pre-drive check
  { type: 'DRIVE',   startTime: '06:15', duration: 270 }, // 4.5h drive
  { type: 'BREAK',   startTime: '10:45', duration: 45 },  // 45m break
  { type: 'DRIVE',   startTime: '11:30', duration: 150 }, // 2.5h drive
  { type: 'WORK',    startTime: '14:00', duration: 30 },  // 30m unloading
  { type: 'DRIVE',   startTime: '14:30', duration: 90 },  // 1.5h drive
  { type: 'UNKNOWN', startTime: '16:00', duration: 15 },  // 15m unknown error
  { type: 'REST',    startTime: '16:15', duration: 465 }, // Remaining rest
];

const statusStyles: Record<Activity['type'], string> = {
  DRIVE: 'bg-green-500',
  WORK: 'bg-blue-500',
  REST: 'bg-gray-300 dark:bg-gray-600',
  BREAK: 'bg-gray-300 dark:bg-gray-600',
  UNKNOWN: 'bg-red-500',
};

const statusLabels: Record<Activity['type'], string> = {
    DRIVE: 'Vairavimas',
    WORK: 'Kitas darbas',
    REST: 'Poilsis',
    BREAK: 'Pertrauka',
    UNKNOWN: 'Neatpažinta / Klaida',
}

export function TachoTimeline() {
  const totalMinutesInDay = 1440;

  return (
    <TooltipProvider>
      <div className="w-full space-y-3">
        <div className="flex w-full h-10 rounded-lg overflow-hidden border dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          {MOCK_ACTIVITIES.map((activity, index) => {
            const widthPercent = (activity.duration / totalMinutesInDay) * 100;
            const endTime = addMinutes(activity.startTime, activity.duration);
            const durationHours = Math.floor(activity.duration / 60);
            const durationMins = activity.duration % 60;
            const durationString = `${durationHours > 0 ? `${durationHours}h` : ''} ${durationMins > 0 ? `${durationMins}min` : ''}`.trim();

            return (
              <Tooltip key={index} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div
                    className={`h-full ${statusStyles[activity.type]} transition-all duration-300 hover:brightness-110 cursor-pointer`}
                    style={{ width: `${widthPercent}%` }}
                    title={`${statusLabels[activity.type]}: ${activity.startTime} - ${endTime}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{statusLabels[activity.type]}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.startTime} - {endTime} ({durationString})
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {/* Timeline Labels */}
        <div className="flex justify-between text-xs text-muted-foreground px-1">
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
