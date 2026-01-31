"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldCheck, Info } from "lucide-react";
import Link from "next/link";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
               <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">Sveiki atvykę į DriverCheck</AlertDialogTitle>
          </div>
          
          <AlertDialogDescription className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Džiaugiamės, kad prisijungėte. Mūsų tikslas – padėti jums valdyti rizikas ir kurti saugesnę transporto bendruomenę.
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
               <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <p>
                    <strong>Kokybės standartas:</strong> Prašome užtikrinti, kad jūsų įkeliami įrašai būtų tikslūs ir pagrįsti. Tai padeda mums visiems išlaikyti duomenų bazės patikimumą.
                  </p>
               </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Primename, kad naudojantis sistema taikomos{" "}
              <Link href="/terms" className="text-primary hover:underline font-medium" target="_blank">
                Naudojimosi taisyklės
              </Link>.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose} className="w-full sm:w-auto">
            Supratau, tęsti
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
