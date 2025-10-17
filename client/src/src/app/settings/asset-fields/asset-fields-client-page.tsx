
"use client"

import { useState } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader, AlertTriangle } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { type AssetField } from "@/lib/schemas/settings"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type AssetFieldsClientPageProps = {
  initialFields: AssetField[];
  initialError: string | null;
};

export default function AssetFieldsClientPage({ initialFields, initialError }: AssetFieldsClientPageProps) {
  const [fields, setFields] = useState<AssetField[]>(initialFields || []);
  const [error, setError] = useState<string | null>(initialError);
  const { t } = useI18n();

  const getDataTypeLabel = (dataType: string) => {
    switch (dataType) {
      case 'Text': return t('pages.settings.asset_fields.data_type_text');
      case 'Number': return t('pages.settings.asset_fields.data_type_number');
      case 'Date': return t('pages.settings.asset_fields.data_type_date');
      default: return dataType;
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('nav.manage_asset_fields')}</CardTitle>
            <CardDescription>{t('pages.settings.asset_fields.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow flex flex-col min-h-0">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('actions.error')}</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="relative flex-1">
            <div className="absolute inset-0 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="py-1 px-2 w-40">{t('pages.settings.asset_fields.table_header_system_name')}</TableHead>
                    <TableHead className="py-1 px-2">{t('pages.settings.asset_fields.table_header_display_name')}</TableHead>
                    <TableHead className="py-1 px-2 w-24 text-center">{t('pages.settings.asset_fields.table_header_visible')}</TableHead>
                    <TableHead className="py-1 px-2 w-40">{t('pages.settings.asset_fields.table_header_type')}</TableHead>
                    <TableHead className="py-1 px-2">{t('pages.settings.asset_fields.table_header_notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell className="py-2 px-2 font-mono text-xs text-muted-foreground">{field.systemName}</TableCell>
                      <TableCell className="py-2 px-2">{field.displayName}</TableCell>
                      <TableCell className="py-2 px-2 text-center">{field.visible ? '✔' : ''}</TableCell>
                      <TableCell className="py-2 px-2"><Badge variant="outline">{getDataTypeLabel(field.dataType)}</Badge></TableCell>
                      <TableCell className="py-2 px-2 text-muted-foreground">{field.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
