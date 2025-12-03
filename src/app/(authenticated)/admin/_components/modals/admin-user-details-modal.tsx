"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

interface AdminUserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // user: UserProfile | null; In the future, pass user data here
}

export function AdminUserDetailsModal({ isOpen, onClose }: AdminUserDetailsModalProps) {
  const { t } = useLanguage();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('admin.userDetailsModal.title')}</DialogTitle>
          <DialogDescription>
            {t('admin.userDetailsModal.description.part1')} {`...`}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>User details will be shown here.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
