
"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { upcomingRenewals as renewalsData } from "@/lib/data"
import { useI18n } from "@/hooks/use-i18n"
import { addDays, format } from 'date-fns'
import { Loader } from "lucide-react"

interface Renewal {
  id: number;
  name: string;
  type: string;
  daysLeft: number;
  cost: number;
  renewalDate: string;
}

export default function ExpirationsPage() {
  const { t } = useI18n();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processedRenewals = renewalsData.map(item => {
      const renewalDate = addDays(new Date(), item.daysLeft)
      return {
        ...item,
        renewalDate: format(renewalDate, 'yyyy-MM-dd')
      }
    }).sort((a, b) => a.daysLeft - b.daysLeft)
    setRenewals(processedRenewals);
    setIsLoading(false);
  }, []);

  const getBadgeVariant = (daysLeft: number) => {
    if (daysLeft < 15) return "destructive"
    if (daysLeft < 45) return "secondary"
    return "outline"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.expirations.title')}</CardTitle>
        <CardDescription>{t('pages.expirations.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('labels.service')}</TableHead>
                <TableHead>{t('labels.type')}</TableHead>
                <TableHead className="text-center">{t('labels.expirations.days_left')}</TableHead>
                <TableHead>{t('labels.expirations.renewal_date')}</TableHead>
                <TableHead className="text-right">{t('labels.expirations.renewal_cost')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renewals.map((renewal) => (
                <TableRow key={renewal.id}>
                  <TableCell className="font-medium">{renewal.name}</TableCell>
                  <TableCell className="text-muted-foreground">{renewal.type}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getBadgeVariant(renewal.daysLeft)}>
                      {renewal.daysLeft} {t('pages.dashboard.days')}
                    </Badge>
                  </TableCell>
                  <TableCell>{renewal.renewalDate}</TableCell>
                  <TableCell className="text-right">¥{renewal.cost.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
