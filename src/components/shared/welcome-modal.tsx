
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
import { UserSearch } from "lucide-react"; // Changed from ShieldAlert

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <UserSearch className="h-16 w-16 text-primary" />
          </div>
          <AlertDialogTitle className="text-center text-2xl">Sveiki atvykę į DriverCheck!</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-md text-muted-foreground space-y-3 pt-2">
            <div>
              DriverCheck yra platforma, skirta padėti įmonėms sumažinti rizikas, susijusias su vairuotojų veikla, ir tikrinti jų informaciją.
            </div>
            <div>
              <strong>Svarbu:</strong> Prašome naudoti šią sistemą atsakingai ir laikantis visų taikomų duomenų apsaugos bei privatumo įstatymų. Įkelkite tik tikslią ir patikrintą informaciją.
            </div>
            <div>
              Jūs esate atsakingi už įkeliamų duomenų teisingumą ir teisėtumą.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={onClose} className="w-full sm:w-auto">
            Supratau, tęsti
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
