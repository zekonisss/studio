"use client";

import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { InfoField } from "@/components/account/InfoField";
import { Button } from "@/components/ui/button";
import { useState, type ChangeEvent } from "react";
import { Building, Hash, Receipt, MapPin, User, Mail, Phone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CompanyDetailsTab() {
  const { t } = useLanguage();
  const { user, updateUserInContext } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: user?.companyName || "",
    companyCode: user?.companyCode || "",
    vatCode: user?.vatCode || "",
    address: user?.address || "",
    contactPerson: user?.contactPerson || "",
    phone: user?.phone || "",
  });

  if (!user) return null;

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
      console.error("Failed to update user details", error);
      toast({
        variant: "destructive",
        title: "Klaida",
        description: "Nepavyko atnaujinti duomenų."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <InfoField label={t('account.details.companyName')} value={formData.companyName} icon={Building} name="companyName" isEditing={isEditing} onChange={handleInputChange} />
        <InfoField label={t('account.details.companyCode')} value={formData.companyCode} icon={Hash} name="companyCode" isEditing={isEditing} onChange={handleInputChange} />
        <InfoField label={t('account.details.vatCode')} value={formData.vatCode} icon={Receipt} name="vatCode" isEditing={isEditing} onChange={handleInputChange} />
        <InfoField label={t('account.details.address')} value={formData.address} icon={MapPin} name="address" isEditing={isEditing} onChange={handleInputChange} />
        <InfoField label={t('account.details.contactPerson')} value={formData.contactPerson} icon={User} name="contactPerson" isEditing={isEditing} onChange={handleInputChange} />
        <InfoField label={t('account.details.phone')} value={formData.phone} icon={Phone} name="phone" isEditing={isEditing} onChange={handleInputChange} />
        <InfoField label={t('account.details.email')} value={user.email} icon={Mail} />
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.saveChanges')}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            {t('common.editData')}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground pt-4">
        {t('account.details.footerNote')}
      </p>
    </div>
  );
}