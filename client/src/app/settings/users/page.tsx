
'use client';

import EmployeesClientPage from "./users-client-page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/hooks/use-i18n";

export default function ManageEmployeesPage() {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('nav.manage_employees')}</CardTitle>
            <CardDescription>{t('pages.settings.employees.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <EmployeesClientPage />
      </CardContent>
    </Card>
  )
}
