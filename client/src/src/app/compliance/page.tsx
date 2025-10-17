
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useI18n } from "@/hooks/use-i18n"

export default function CompliancePage() {
  const { t } = useI18n()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.compliance.title")}</CardTitle>
        <CardDescription>{t("pages.compliance.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{t("common.page_in_preparation")}</p>
      </CardContent>
    </Card>
  )
}
