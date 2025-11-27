"use client";

import type { Report } from '@/types';
import { useLanguage } from '@/contexts/language-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { getCategoryNameForDisplay, migrateTagIfNeeded } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminEntryDetailsModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminEntryDetailsModal({ report, isOpen, onClose }: AdminEntryDetailsModalProps) {
  const { t } = useLanguage();

  if (!report) return null;

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat(t('common.localeForDate'), { dateStyle: 'full', timeStyle: 'medium' }).format(new Date(date));
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('admin.entryDetailsModal.title')}</DialogTitle>
          <DialogDescription>{t('admin.entryDetailsModal.description')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label={t('admin.entryDetailsModal.driver')} value={report.fullName} />
              <InfoItem label={t('admin.entryDetailsModal.nationality')} value={report.nationality} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <InfoItem label={t('admin.entryDetailsModal.birthYear')} value={report.birthYear?.toString()} />
               <InfoItem label={t('admin.entryDetailsModal.mainCategory')} value={<Badge>{getCategoryNameForDisplay(report.category, t)}</Badge>} />
            </div>

            {report.tags && report.tags.length > 0 && (
                <InfoItem label={t('admin.entryDetailsModal.tags')} value={
                    <div className="flex flex-wrap gap-2">
                        {report.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{t(`tags.${migrateTagIfNeeded(tag)}`)}</Badge>
                        ))}
                    </div>
                } />
            )}

            <InfoItem label={t('admin.entryDetailsModal.comment')} value={<p className="text-sm whitespace-pre-wrap">{report.comment}</p>} />

             <InfoItem label={t('admin.entryDetailsModal.attachedFile')} value={
                report.imageUrls && report.imageUrls.length > 0 ? (
                    <a href={report.imageUrls[0]} target="_blank" rel="noopener noreferrer">
                        <Image
                            src={report.imageUrls[0]}
                            alt={t('admin.entryDetailsModal.imageAltPrefix', { fullName: report.fullName })}
                            width={200}
                            height={150}
                            className="rounded-md object-cover border hover:opacity-80 transition-opacity"
                        />
                    </a>
                ) : t('common.notSpecified')
             } />

            <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <InfoItem label={t('admin.entryDetailsModal.submittedByCompany')} value={report.reporterCompanyName} />
                <InfoItem label={t('admin.entryDetailsModal.submitterId')} value={<span className="text-xs font-mono">{report.reporterId}</span>} />
                <InfoItem label={t('admin.entryDetailsModal.submissionDate')} value={formatDate(report.createdAt as Date)} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="text-base font-semibold">{value || '-'}</div>
  </div>
);
