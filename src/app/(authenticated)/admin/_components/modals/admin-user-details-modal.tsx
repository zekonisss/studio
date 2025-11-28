"use client";

import { useState, useEffect } from 'react';
import type { UserProfile } from '@/types';
import { useLanguage } from '@/contexts/language-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, addAuditLogEntry } from '@/lib/server/db';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminUserDetailsModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: () => void;
}

export function AdminUserDetailsModal({ user, isOpen, onClose, onUserUpdate }: AdminUserDetailsModalProps) {
  const { t } = useLanguage();
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        companyName: user.companyName,
        companyCode: user.companyCode,
        vatCode: user.vatCode,
        address: user.address,
        contactPerson: user.contactPerson,
        phone: user.phone,
      });
    }
  }, [user]);

  if (!user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSave = async () => {
      if (!adminUser) return;
      setIsLoading(true);
      const changes: Partial<UserProfile> = {};
      const changedFields: string[] = [];

      (Object.keys(formData) as Array<keyof typeof formData>).forEach(key => {
          if (formData[key] !== user[key]) {
              changes[key] = formData[key] as any;
              changedFields.push(key);
          }
      });
      
      if (Object.keys(changes).length > 0) {
          try {
              await updateUserProfile(user.id, changes);
              await addAuditLogEntry({
                  adminId: adminUser.id,
                  adminName: adminUser.contactPerson,
                  actionKey: 'userDetailsUpdated',
                  details: { userId: user.id, userEmail: user.email, companyName: user.companyName, updatedFields: changedFields.join(', ') },
              });
              toast({
                  title: t('admin.users.toast.dataUpdated.title'),
                  description: t('admin.users.toast.dataUpdated.description', { companyName: changes.companyName || user.companyName }),
              });
              onUserUpdate();
              setIsEditing(false);
          } catch (error) {
              console.error("Error updating user profile:", error);
          }
      } else {
          setIsEditing(false);
      }
      setIsLoading(false);
  }

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat(t('common.localeForDate'), { dateStyle: 'full' }).format(new Date(date));
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('admin.userDetailsModal.title')}</DialogTitle>
          <DialogDescription>
            {t('admin.userDetailsModal.description.part1')} <strong>{user.companyName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
        <div className="grid gap-4 py-4">
          <InfoItem isEditing={isEditing} name="companyName" label={t('admin.userDetailsModal.companyName')} value={formData.companyName} onChange={handleInputChange} />
          <InfoItem isEditing={isEditing} name="companyCode" label={t('admin.userDetailsModal.companyCode')} value={formData.companyCode} onChange={handleInputChange} />
          <InfoItem isEditing={isEditing} name="vatCode" label={t('admin.userDetailsModal.vatCode')} value={formData.vatCode} onChange={handleInputChange} />
          <InfoItem isEditing={isEditing} name="address" label={t('admin.userDetailsModal.address')} value={formData.address} onChange={handleInputChange} />
          <hr/>
          <InfoItem isEditing={isEditing} name="contactPerson" label={t('admin.userDetailsModal.contactPerson')} value={formData.contactPerson} onChange={handleInputChange} />
          <InfoItem isEditing={false} label={t('admin.userDetailsModal.email')} value={user.email} />
          <InfoItem isEditing={isEditing} name="phone" label={t('admin.userDetailsModal.phone')} value={formData.phone} onChange={handleInputChange} />
          <hr/>
          <InfoItem isEditing={false} label={t('admin.userDetailsModal.status')} value={<Badge>{t(`admin.users.status.${user.paymentStatus}`)}</Badge>} />
          <InfoItem isEditing={false} label={t('admin.userDetailsModal.administrator')} value={user.isAdmin ? t('common.yes') : t('common.no')} />
          <InfoItem isEditing={false} label={t('admin.userDetailsModal.agreedToTerms')} value={user.agreeToTerms ? t('common.yes') : t('common.no')} />
          <InfoItem isEditing={false} label={t('admin.userDetailsModal.userId')} value={<span className="text-xs font-mono">{user.id}</span>} />

        </div>
        </ScrollArea>
        <DialogFooter className="pt-4 border-t">
            {isEditing ? (
                 <div className="flex justify-end w-full gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>{t('common.cancel')}</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('common.saveChanges')}
                    </Button>
                 </div>
            ) : (
                <Button onClick={() => setIsEditing(true)}>{t('common.editData')}</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface InfoItemProps {
    label: string;
    value: React.ReactNode;
    isEditing: boolean;
    name?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InfoItem = ({ label, value, isEditing, name, onChange }: InfoItemProps) => (
  <div>
    <Label htmlFor={name} className="text-sm font-medium text-muted-foreground">{label}</Label>
    {isEditing && name && typeof value === 'string' ? (
        <Input id={name} name={name} value={value} onChange={onChange} className="mt-1" />
    ) : (
        <div className="text-base font-semibold mt-1">{value || '-'}</div>
    )}
  </div>
);
