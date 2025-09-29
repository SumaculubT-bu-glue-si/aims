
"use client";

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
import { DollarSign, HardDrive, KeyRound, Clock, Users } from "lucide-react"
import { upcomingRenewals } from "@/lib/data"
import { AssetDistributionChart } from "@/components/asset-distribution-chart"
import { useI18n } from "@/hooks/use-i18n";
import { TransitionLink } from "@/components/transition-link";

export default function Dashboard() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TransitionLink href="/inventory">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('pages.dashboard.total_assets')}</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,254</div>
              <p className="text-xs text-muted-foreground">{t('pages.dashboard.from_last_month')}</p>
            </CardContent>
          </Card>
        </TransitionLink>
        <Card className="hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('pages.dashboard.licenses_nearing_expiration')}
            </CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">{t('pages.dashboard.within_next_30_days')}</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pages.dashboard.active_subscriptions')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">132</div>
            <p className="text-xs text-muted-foreground">{t('pages.dashboard.since_last_month')}</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pages.dashboard.estimated_monthly_cost')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥5,070,000</div>
            <p className="text-xs text-muted-foreground">{t('pages.dashboard.based_on_active_subscriptions')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <AssetDistributionChart />
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('pages.dashboard.upcoming_renewals')}</CardTitle>
            <CardDescription>
              {t('pages.dashboard.upcoming_renewals_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('pages.dashboard.asset')}</TableHead>
                  <TableHead>{t('pages.dashboard.expires')}</TableHead>
                  <TableHead>{t('pages.dashboard.cost')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingRenewals.map((renewal) => (
                  <TableRow key={renewal.id}>
                    <TableCell>
                      <div className="font-medium">{renewal.name}</div>
                      <div className="text-sm text-muted-foreground">{renewal.type}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={renewal.daysLeft < 15 ? "destructive" : "secondary"}>
                        {renewal.daysLeft} {t('pages.dashboard.days')}
                      </Badge>
                    </TableCell>
                    <TableCell>¥{renewal.cost.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Employee Access Section */}
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            Employee Audit Access
          </CardTitle>
          <CardDescription>
            Employees can access their assigned audits without admin login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Provide employees with secure, temporary access to their audit assignments via email verification.
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>• Secure email-based authentication</div>
                <div>• 24-hour temporary access tokens</div>
                <div>• Real-time asset status updates</div>
                <div>• Separate from admin interface</div>
              </div>
            </div>
            <TransitionLink href="/employee-audits">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Employee Access Portal
              </button>
            </TransitionLink>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
