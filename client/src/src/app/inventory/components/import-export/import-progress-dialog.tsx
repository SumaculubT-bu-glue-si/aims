import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { ImportSummary } from "@/lib/types/index";

interface ImportProgressDialogProps {
  isOpen: boolean;
  progress: { current: number; total: number };
  isImporting: boolean;
  summary: ImportSummary | null;
  onClose: () => void;
}

export function ImportProgressDialog({
  isOpen,
  progress,
  isImporting,
  summary,
  onClose
}: ImportProgressDialogProps) {
  const { t } = useI18n();

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('actions.import.progress.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('actions.import.progress.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          {isImporting ? (
            <>
              <Loader className="h-10 w-10 animate-spin text-primary" />
              <div className="w-full text-center">
                <p className="text-lg font-semibold mb-2">
                  {t('actions.importing_progress', { 
                    current: progress.current, 
                    total: progress.total 
                  })}
                </p>
                <Progress 
                  value={(progress.total > 0 ? (progress.current / progress.total) : 0) * 100} 
                  className="w-full" 
                />
              </div>
            </>
          ) : summary ? (
            <div className="w-full text-center">
              <div className="text-green-600 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('actions.import.progress.complete')}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{t('actions.import.progress.total_processed', { count: summary.total })}</p>
                <p>{t('actions.import.progress.pcs_imported', { count: summary.pcs })}</p>
                <p>{t('actions.import.progress.monitors_imported', { count: summary.monitors })}</p>
                <p>{t('actions.import.progress.phones_imported', { count: summary.phones })}</p>
                <p>{t('actions.import.progress.others_imported', { count: summary.others })}</p>

                {summary.categorizationDetails && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="font-semibold text-blue-800 mb-2">Asset Categorization Details:</p>
                    {summary.categorizationDetails.pcs.length > 0 && (
                      <div className="mb-2">
                        <p className="text-blue-700 text-xs font-medium">PCs ({summary.categorizationDetails.pcs.length}):</p>
                        <p className="text-blue-600 text-xs">
                          {summary.categorizationDetails.pcs.slice(0, 3).join(', ')}
                          {summary.categorizationDetails.pcs.length > 3 && ` and ${summary.categorizationDetails.pcs.length - 3} more`}
                        </p>
                      </div>
                    )}
                    {summary.categorizationDetails.monitors.length > 0 && (
                      <div className="mb-2">
                        <p className="text-blue-700 text-xs font-medium">Monitors ({summary.categorizationDetails.monitors.length}):</p>
                        <p className="text-blue-600 text-xs">
                          {summary.categorizationDetails.monitors.slice(0, 3).join(', ')}
                          {summary.categorizationDetails.monitors.length > 3 && ` and ${summary.categorizationDetails.monitors.length - 3} more`}
                        </p>
                      </div>
                    )}
                    {summary.categorizationDetails.phones.length > 0 && (
                      <div className="mb-2">
                        <p className="text-blue-700 text-xs font-medium">Phones ({summary.categorizationDetails.phones.length}):</p>
                        <p className="text-blue-600 text-xs">
                          {summary.categorizationDetails.phones.slice(0, 3).join(', ')}
                          {summary.categorizationDetails.phones.length > 3 && ` and ${summary.categorizationDetails.phones.length - 3} more`}
                        </p>
                      </div>
                    )}
                    {summary.categorizationDetails.others.length > 0 && (
                      <div className="mb-2">
                        <p className="text-blue-700 text-xs font-medium">Others ({summary.categorizationDetails.others.length}):</p>
                        <p className="text-blue-600 text-xs">
                          {summary.categorizationDetails.others.slice(0, 3).join(', ')}
                          {summary.categorizationDetails.others.length > 3 && ` and ${summary.categorizationDetails.others.length - 3} more`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {summary.errors.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="font-semibold text-red-800">{t('actions.import.progress.errors_encountered')}</p>
                    {summary.errors.map((error, index) => (
                      <p key={index} className="text-red-700 text-xs">{error}</p>
                    ))}
                  </div>
                )}
              </div>
              <Button
                className="mt-4"
                onClick={onClose}
              >
                {t('actions.import.progress.close')}
              </Button>
            </div>
          ) : null}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}