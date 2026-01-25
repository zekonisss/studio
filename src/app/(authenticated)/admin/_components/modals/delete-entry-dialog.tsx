"use client";

import type { Report } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { Loader2 } from "lucide-react";

interface DeleteEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  report: Report | null;
  isDeleting: boolean;
}

export function DeleteEntryDialog({ isOpen, onClose, onConfirm, report, isDeleting }: DeleteEntryDialogProps) {
  const { t } = useLanguage();

  if (!report) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.entries.deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.entries.deleteDialog.description.part1')}{' '}
            <strong>`{report.fullName}`</strong>
            {t('admin.entries.deleteDialog.description.part2')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('admin.entries.deleteDialog.confirmDelete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
