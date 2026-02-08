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

export function TachoTimeline({ activities }: { activities: Activity[] }) {
  const totalMinutesInDay = 1440;

  if (!activities || activities.length === 0) {
      return null;
  }

  return (
    <TooltipProvider>
      <div className="w-full space-y-3">
        <div className="flex w-full h-10 rounded-lg overflow-hidden border dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          {activities.map((activity, index) => {
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
