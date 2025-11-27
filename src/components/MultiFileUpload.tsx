"use client";

import React, { useState, type ChangeEvent } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface Props {
  onUploadComplete: (downloadURLs: string[]) => void;
}

export default function MultiFileUpload({ onUploadComplete }: Props) {
  const { t } = useLanguage();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);

    try {
      const uploadPromises = files.map(file => {
        const fileRef = ref(storage, `reports/${Date.now()}_${file.name}`);
        return uploadBytes(fileRef, file).then(() => getDownloadURL(fileRef));
      });

      const downloadURLs = await Promise.all(uploadPromises);
      onUploadComplete(downloadURLs);
      setFiles([]); // Clear files after successful upload
    } catch (err: any) {
      console.error("Upload error:", err);
      setError("Klaida įkeliant failus. Pabandykite dar kartą.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Input id="multi-picture" type="file" multiple onChange={handleFileChange} disabled={isUploading} />
      </div>
      
      {files.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Įkeliama...</span>
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              <span>{`Įkelti ${files.length} failus`}</span>
            </>
          )}
        </Button>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
