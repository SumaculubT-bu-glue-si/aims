import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader, Download, FileSpreadsheet } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useToast } from "@/hooks/use-toast";
import { IMPORT_EXPORT } from "../../constants";

interface ExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: () => Promise<void>;
  isExporting: boolean;
}

export function ExportDialog({
  isOpen,
  onOpenChange,
  onExport,
  isExporting
}: ExportDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();

  const handleExportClick = async () => {
    try {
      await onExport();
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: t('actions.error'),
        description: t('pages.inventory.export_error'),
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t('pages.inventory.export_dialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('pages.inventory.export_dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {t('pages.inventory.export_dialog.supported_formats', { 
                    formats: IMPORT_EXPORT.SUPPORTED_FILE_TYPES.join(', ') 
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('pages.inventory.export_dialog.format_description')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {t('pages.inventory.export_dialog.includes')}
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {t('pages.inventory.export_dialog.all_assets')}</li>
              <li>• {t('pages.inventory.export_dialog.complete_data')}</li>
              <li>• {t('pages.inventory.export_dialog.ordered_columns')}</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            onClick={handleExportClick}
            disabled={isExporting}
            className="min-w-[100px]"
          >
            {isExporting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {t('actions.exporting')}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t('actions.export')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}