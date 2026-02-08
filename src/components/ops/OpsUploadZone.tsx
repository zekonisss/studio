"use client";

import { UploadCloud } from 'lucide-react';
import { type ChangeEvent, type DragEvent } from 'react';

interface Props {
  onFileSelected: (file: File) => void;
}

export function OpsUploadZone({ onFileSelected }: Props) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div 
      className="relative w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col justify-center items-center text-center p-6 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/20 transition-colors duration-300"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
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
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          accept=".pdf,.jpg,.jpeg,.png,.ddd"
          onChange={handleFileChange}
        />
    </div>
  );
}