
"use client";

import { UploadCloud, FileText, HardDrive } from 'lucide-react';
import { type ChangeEvent, type DragEvent, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  description: string;
  accept: string; // HTML input accept format
  onFileSelect: (file: File) => void;
  icon?: 'document' | 'tacho';
}

export function OpsUploadZone({ title, description, accept, onFileSelect, icon = 'document' }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
        setIsDragging(true);
    }
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const Icon = icon === 'tacho' ? HardDrive : FileText;

  return (
    <div 
      className={cn(
        "relative w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col justify-center items-center text-center p-4 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/20 transition-colors duration-300",
        isDragging && "border-primary bg-primary/10"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => document.getElementById(`ops-file-input-${icon}`)?.click()}
    >
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
            <Icon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
        </div>
        <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200">
            {title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
        </p>
        <input 
          id={`ops-file-input-${icon}`}
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          accept={accept}
          onChange={handleFileChange}
          onClick={(event) => {
            // This is the fix: reset the input value to allow re-selecting the same file.
            (event.target as HTMLInputElement).value = '';
          }}
        />
    </div>
  );
}
