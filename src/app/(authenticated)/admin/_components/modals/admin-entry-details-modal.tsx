
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import type { Report } from '@/types';
import { getCategoryNameForDisplay, getTagNameForDisplay } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminEntryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
}

export function AdminEntryDetailsModal({ isOpen, onClose, report }: AdminEntryDetailsModalProps) {
  const { t, locale } = useLanguage();
  
  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('admin.entryDetailsModal.title')}</DialogTitle>
          <DialogDescription>{t('admin.entryDetailsModal.description')}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 font-semibold">{t('admin.entryDetailsModal.driver')}:</div>
                    <div className="col-span-2">{report.fullName}</div>
                </div>
                {report.nationality && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 font-semibold">{t('admin.entryDetailsModal.nationality')}:</div>
                        <div className="col-span-2">{t(`countries.${report.nationality}`)}</div>
                    </div>
                )}
                 {report.birthYear && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 font-semibold">{t('admin.entryDetailsModal.birthYear')}:</div>
                        <div className="col-span-2">{report.birthYear}</div>
                    </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 font-semibold">{t('admin.entryDetailsModal.mainCategory')}:</div>
                    <div className="col-span-2"><Badge variant="secondary">{getCategoryNameForDisplay(report.category, t)}</Badge></div>
                </div>
                 {report.tags && report.tags.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 font-semibold">{t('admin.entryDetailsModal.tags')}:</div>
                        <div className="col-span-2 flex flex-wrap gap-2">
                           {report.tags.map(tag => <Badge key={tag} variant="outline">{getTagNameForDisplay(tag, t)}</Badge>)}
                        </div>
                    </div>
                 )}
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 font-semibold">{t('admin.entryDetailsModal.comment')}:</div>
                    <div className="col-span-2 whitespace-pre-wrap text-sm">{report.comment}</div>
                </div>
                {report.imageUrl && (
                     <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 font-semibold">{t('admin.entryDetailsModal.attachedFile')}:</div>
                        <div className="col-span-2">
                             <a href={report.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative h-64 w-full md:w-96 rounded-md overflow-hidden border">
                                <Image 
                                    src={report.imageUrl} 
                                    alt={t('admin.entryDetailsModal.imageAltPrefix', {fullName: report.fullName})} 
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    data-ai-hint={report.dataAiHint || ''}
                                />
                             </a>
                        </div>
                    </div>
                )}
                 <div className="grid grid-cols-3 gap-4 border-t pt-4 mt-4">
                    <div className="col-span-1 text-xs text-muted-foreground">{t('admin.entryDetailsModal.submittedByCompany')}:</div>
                    <div className="col-span-2 text-xs">{report.reporterCompanyName}</div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 text-xs text-muted-foreground">{t('admin.entryDetailsModal.submitterId')}:</div>
                    <div className="col-span-2 text-xs">{report.reporterId}</div>
                </div>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 text-xs text-muted-foreground">{t('admin.entryDetailsModal.submissionDate')}:</div>
                    <div className="col-span-2 text-xs">{new Date(report.createdAt).toLocaleString(locale)}</div>
                </div>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
