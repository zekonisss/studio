"use client";

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoField } from '@/components/account/InfoField';
import { Button } from '@/components/ui/button';
import { useState, type ChangeEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { 
    Building, 
    Hash, 
    BookUser, 
    AtSign, 
    Phone, 
    Mailbox,
    BadgePercent
} from 'lucide-react';


export default function CompanyDetailsTab() {
  const { user, updateUserInContext } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: user?.companyName || '',
    companyCode: user?.companyCode || '',
    vatCode: user?.vatCode || '',
    address: user?.address || '',
    contactPerson: user?.contactPerson || '',
    phone: user?.phone || '',
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
        await updateUserInContext(formData);
        toast({
            title: t('admin.users.toast.dataUpdated.title'),
            description: t('admin.users.toast.dataUpdated.description', { companyName: formData.companyName }),
        });
        setIsEditing(false);
    } catch (error) {
        console.error("Failed to update user data", error);
        toast({
            variant: "destructive",
            title: "Klaida",
            description: "Nepavyko atnaujinti duomenų.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6 border-0 shadow-none">
      <CardHeader>
        <CardTitle>{t('account.details.title')}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoField label={t('account.details.companyName')} value={formData.companyName} icon={Building} name="companyName" isEditing={isEditing} onChange={handleInputChange} />
        <InfoField label={t('account.details.companyCode')} value={formData.companyCode} icon={Hash} />
        <InfoField label={t('account.details.vatCode')} value={formData.vatCode} icon={BadgePercent} name="vatCode" isEditing={isEditing} onChange={handleInputChange} />
        <InfoField label={t('account.details.address')} value={formData.address} icon={Mailbox} name="address" isEditing={isEditing} onChange={handleInputChange} />
        <InfoField label={t('account.details.contactPerson')} value={formData.contactPerson} icon={BookUser} name="contactPerson" isEditing={isEditing} onChange={handleInputChange} />
        <InfoField label={t('account.details.email')} value={user?.email} icon={AtSign} />
        <InfoField label={t('account.details.phone')} value={formData.phone} icon={Phone} name="phone" isEditing={isEditing} onChange={handleInputChange} />
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-6 mt-6">
        <p className="text-sm text-muted-foreground">{t('account.details.footerNote')}</p>
        <div>
          {isEditing ? (
             <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                    {t('common.cancel')}
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('account.saveChangesButton')}
                </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>{t('account.editDataButton')}</Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
