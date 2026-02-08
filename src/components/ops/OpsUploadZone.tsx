"use client";

import { UploadCloud } from 'lucide-react';
import { type ChangeEvent, type DragEvent, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  onFilesSelected: (files: File[]) => void;
}

export function OpsUploadZone({ onFilesSelected }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <div 
      className={cn(
        "relative w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col justify-center items-center text-center p-6 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/20 transition-colors duration-300",
        isDragging && "border-primary bg-primary/10"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById('ops-file-input')?.click()}
    >
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <UploadCloud className="w-10 h-10 text-gray-500 dark:text-gray-400" />
        </div>
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
            Įkelkite Baudą arba Tacho failą analizei
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Palaikomi formatai: .ddd, .pdf, .jpg
        </p>
        <input 
          id="ops-file-input"
          type="file"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          accept=".pdf,.jpg,.jpeg,.png,.ddd"
          onChange={handleFileChange}
        />
    </div>
  );
}
