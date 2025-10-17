
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { activeSubscriptions } from "@/lib/data"
import { useI18n } from "@/hooks/use-i18n"
import { Loader } from "lucide-react"

interface Subscription {
  id: number
  name: string
  type: string
  monthlyCost: number
  project: string
  location: string
}

type GroupedSubscriptions = Record<string, Record<string, Subscription[]>>

export default function SubscriptionsPage() {
  const { t } = useI18n()
  const [groupedData, setGroupedData] = useState<GroupedSubscriptions>({})
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processData = () => {
      const groups: GroupedSubscriptions = activeSubscriptions.reduce(
        (acc, subscription) => {
          const { location, project } = subscription
          if (!acc[location]) {
            acc[location] = {}
          }
          if (!acc[location][project]) {
            acc[location][project] = []
          }
          acc[location][project].push(subscription)
          return acc
        },
        {} as GroupedSubscriptions
      )
      setGroupedData(groups)
      setIsLoading(false);
    }
    processData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pages.subscriptions.title")}</CardTitle>
        <CardDescription>{t("pages.subscriptions.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex items-center justify-center h-[400px]">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <Accordion type="multiple" className="w-full">
            {Object.entries(groupedData).map(([location, projects]) => (
                <AccordionItem key={location} value={location}>
                <AccordionTrigger className="text-lg font-medium">{location}</AccordionTrigger>
                <AccordionContent>
                    <Accordion type="multiple" className="w-full px-4">
                    {Object.entries(projects).map(([project, subscriptions]) => (
                        <AccordionItem key={project} value={project}>
                        <AccordionTrigger>{project}</AccordionTrigger>
                        <AccordionContent>
                            <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>{t("pages.subscriptions.table.name")}</TableHead>
                                <TableHead>{t("pages.subscriptions.table.type")}</TableHead>
                                <TableHead className="text-right">{t("pages.subscriptions.table.monthly_cost")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.name}</TableCell>
                                    <TableCell>{sub.type}</TableCell>
                                    <TableCell className="text-right">¥{sub.monthlyCost.toLocaleString()}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                            </Table>
                        </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                </AccordionContent>
                </AccordionItem>
            ))}
            </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
