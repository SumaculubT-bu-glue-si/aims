
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LabelList } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import { assetDistribution } from "@/lib/data"
import { useI18n } from "@/hooks/use-i18n";

export function AssetDistributionChart() {
  const { t } = useI18n();
  
  const chartConfig = {
    assets: {
      label: t('pages.dashboard.assets'),
    },
    pcs: {
      label: t('pages.inventory.tabs.pcs'),
      color: "hsl(var(--chart-1))",
    },
    smartphones: {
      label: t('pages.inventory.tabs.smartphones'),
      color: "hsl(var(--chart-2))",
    },
    software: {
      label: t('pages.inventory.tabs.software'),
      color: "hsl(var(--chart-3))",
    },
    office: {
      label: t('pages.inventory.tabs.office_gear'),
      color: "hsl(var(--chart-4))",
    },
  } satisfies ChartConfig

  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>{t('pages.dashboard.asset_distribution')}</CardTitle>
        <CardDescription>
          {t('pages.dashboard.asset_distribution_desc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
         <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
           <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={assetDistribution}
                layout="vertical"
                margin={{ left: 10, right: 40 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="pcs" stackId="a" fill="var(--color-pcs)" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="pcs" position="right" offset={8} className="fill-foreground" fontSize={12} />
                </Bar>
                <Bar dataKey="smartphones" stackId="a" fill="var(--color-smartphones)" >
                   <LabelList dataKey="smartphones" position="right" offset={8} className="fill-foreground" fontSize={12} />
                </Bar>
                <Bar dataKey="software" stackId="a" fill="var(--color-software)" >
                   <LabelList dataKey="software" position="right" offset={8} className="fill-foreground" fontSize={12} />
                </Bar>
                 <Bar dataKey="office" stackId="a" fill="var(--color-office)" radius={[0, 4, 4, 0]}>
                   <LabelList dataKey="office" position="right" offset={8} className="fill-foreground" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
      </CardContent>
    </Card>
  )
}
