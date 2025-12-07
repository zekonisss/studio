"use client";

import type { Report } from "@/types";
import { useLanguage } from "@/contexts/language-context";
import { getCategoryNameForDisplay } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Calendar, File, User, Globe, Hash } from "lucide-react";
import Image from "next/image";
import { DESTRUCTIVE_REPORT_MAIN_CATEGORIES } from "@/lib/constants";

interface ReportCardProps {
  report: Report;
  onViewDetails: () => void;
  onDelete?: () => void;
  isDeleted?: boolean;
}

export function ReportCard({ report, onViewDetails, onDelete, isDeleted = false }: ReportCardProps) {
  const { t } = useLanguage();

  const isDestructive = DESTRUCTIVE_REPORT_MAIN_CATEGORIES.includes(report.category);

  return (
    <Card className={`flex flex-col ${isDeleted ? 'opacity-60 bg-muted/50' : ''} ${isDestructive && !isDeleted ? 'border-destructive/30' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
            <div>
                 <CardTitle className="text-xl">{report.fullName}</CardTitle>
                 <CardDescription className="flex items-center gap-4 text-xs pt-1">
                    {report.nationality && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {t(`countries.${report.nationality}`)}</span>}
                    {report.birthYear && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {report.birthYear}</span>}
                 </CardDescription>
            </div>
            <Badge variant={isDestructive && !isDeleted ? 'destructive' : 'secondary'} className="text-center whitespace-nowrap">
                {getCategoryNameForDisplay(report.category, t)}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3 h-[60px]">
          {report.comment}
        </p>
         {report.tags && report.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
                {report.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{t(`tags.${tag}`)}</Badge>)}
            </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        <div className="text-xs text-muted-foreground flex items-center gap-2 w-full border-t pt-4">
             <Calendar className="w-3 h-3"/>
             <span>{isDeleted ? t('account.entries.deletedOn') : t('reports.history.entry.submittedOn')}:</span>
             <span className="font-semibold">{new Date(isDeleted ? report.deletedAt : report.createdAt).toLocaleDateString(t('common.localeForDate'))}</span>
        </div>
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            {t('reports.history.entry.viewDetailsButton')}
          </Button>
          {!isDeleted && onDelete && (
             <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('reports.history.entry.deleteButton')}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
