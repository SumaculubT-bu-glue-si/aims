
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useI18n } from "@/hooks/use-i18n"

export default function AuditDashboardPage() {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('nav.dashboard')}
        </CardTitle>
        <CardDescription>
          {t('pages.audits.preparation.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{t('common.page_in_preparation')}</p>
      </CardContent>
    </Card>
  )
}
