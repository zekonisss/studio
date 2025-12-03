"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

interface AdminEntryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // report: Report | null; In the future, pass report data here
}

export function AdminEntryDetailsModal({ isOpen, onClose }: AdminEntryDetailsModalProps) {
  const { t } = useLanguage();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('admin.entryDetailsModal.title')}</DialogTitle>
          <DialogDescription>{t('admin.entryDetailsModal.description')}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Entry details will be shown here.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
