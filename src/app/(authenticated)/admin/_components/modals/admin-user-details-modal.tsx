"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/language-context';
import type { UserProfile } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminUserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

const DetailRow = ({ label, value }: { label: string; value?: string | boolean | null }) => {
  let displayValue: React.ReactNode = value;
  if (typeof value === 'boolean') {
    displayValue = value ? 'Taip' : 'Ne';
  } else if (!value) {
    displayValue = '-';
  }
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b">
      <div className="col-span-1 text-sm font-semibold text-muted-foreground">{label}:</div>
      <div className="col-span-2 text-sm">{displayValue}</div>
    </div>
  );
};


export function AdminUserDetailsModal({ isOpen, onClose, user }: AdminUserDetailsModalProps) {
  const { t } = useLanguage();
  
  if (!user) return null;

  const getStatusBadge = (status: UserProfile['paymentStatus']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">{t('admin.users.status.active')}</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600">{t('admin.users.status.pending_verification')}</Badge>;
      case 'pending_payment':
        return <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600">{t('admin.users.status.pending_payment')}</Badge>;
      case 'inactive':
        return <Badge variant="destructive">{t('admin.users.status.inactive')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('admin.userDetailsModal.title')}</DialogTitle>
          <DialogDescription>
            {t('admin.userDetailsModal.description.part1')} {`'${user.companyName}'`}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
            <div className="py-4 space-y-2">
                <DetailRow label={t('admin.userDetailsModal.userId')} value={user.id} />
                <DetailRow label={t('admin.userDetailsModal.companyName')} value={user.companyName} />
                <DetailRow label={t('admin.userDetailsModal.companyCode')} value={user.companyCode} />
                <DetailRow label={t('admin.userDetailsModal.vatCode')} value={user.vatCode} />
                <DetailRow label={t('admin.userDetailsModal.address')} value={user.address} />
                <DetailRow label={t('admin.userDetailsModal.contactPerson')} value={user.contactPerson} />
                <DetailRow label={t('admin.userDetailsModal.email')} value={user.email} />
                <DetailRow label={t('admin.userDetailsModal.phone')} value={user.phone} />
                <div className="grid grid-cols-3 gap-2 py-2 border-b">
                    <div className="col-span-1 text-sm font-semibold text-muted-foreground">{t('admin.userDetailsModal.status')}:</div>
                    <div className="col-span-2 text-sm">{getStatusBadge(user.paymentStatus)}</div>
                </div>
                <DetailRow label={t('admin.userDetailsModal.administrator')} value={user.isAdmin} />
                <DetailRow label={t('admin.userDetailsModal.agreedToTerms')} value={user.agreeToTerms} />
                <DetailRow label="Registracijos data" value={new Date(user.registeredAt).toLocaleString(t('common.localeForDate'))} />
                <DetailRow label="Aktyvacijos data" value={user.accountActivatedAt ? new Date(user.accountActivatedAt).toLocaleString(t('common.localeForDate')) : '-'} />
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
