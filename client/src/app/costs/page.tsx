
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { activeSubscriptions } from "@/lib/data"
import { useI18n } from "@/hooks/use-i18n"
import { Loader } from "lucide-react"

interface CostGroup {
  name: string
  totalCost: number
}

export default function CostsPage() {
  const { t } = useI18n()
  const [byLocation, setByLocation] = useState<CostGroup[]>([])
  const [byProject, setByProject] = useState<CostGroup[]>([])
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const locationCosts = activeSubscriptions.reduce((acc, sub) => {
      acc[sub.location] = (acc[sub.location] || 0) + sub.monthlyCost
      return acc
    }, {} as Record<string, number>)

    setByLocation(
      Object.entries(locationCosts)
        .map(([name, totalCost]) => ({ name, totalCost }))
        .sort((a, b) => b.totalCost - a.totalCost)
    )

    const projectCosts = activeSubscriptions.reduce((acc, sub) => {
      acc[sub.project] = (acc[sub.project] || 0) + sub.monthlyCost
      return acc
    }, {} as Record<string, number>)

    setByProject(
      Object.entries(projectCosts)
        .map(([name, totalCost]) => ({ name, totalCost }))
        .sort((a, b) => b.totalCost - a.totalCost)
    )
    setIsLoading(false);
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.costs.title")}</CardTitle>
        <CardDescription>{t("pages.costs.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="by-location">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="by-location">
                {t("pages.costs.by_location")}
              </TabsTrigger>
              <TabsTrigger value="by-project">
                {t("pages.costs.by_project")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="by-location" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("labels.location")}</TableHead>
                    <TableHead className="text-right">
                      {t("labels.total_cost")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byLocation.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        ¥{item.totalCost.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="by-project" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("labels.project")}</TableHead>
                    <TableHead className="text-right">
                      {t("labels.total_cost")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byProject.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">
                        ¥{item.totalCost.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
