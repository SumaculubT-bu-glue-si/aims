
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { licenseOptimizationRecommendations } from "@/ai/flows/license-optimization"
import type { LicenseOptimizationOutput } from "@/ai/flows/license-optimization"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Lightbulb, Loader, Sparkles } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"

function useFormSchema() {
    const { t } = useI18n();
    return z.object({
        softwareInventory: z.string().min(10, t('validation.min_length', { field: t('pages.optimize.form.inventory'), count: 10 })),
        userUsageData: z.string().min(10, t('validation.min_length', { field: t('pages.optimize.form.usage'), count: 10 })),
        subscriptionDetails: z.string().min(10, t('validation.min_length', { field: t('pages.optimize.form.subscription'), count: 10 })),
    });
}

export default function OptimizePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LicenseOptimizationOutput | null>(null)
  const { t, language } = useI18n()
  const { toast } = useToast();
  
  const formSchema = useFormSchema();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      softwareInventory: "Software: Figma Enterprise, Licenses: 150, Utilization: 60%, Cost: ¥810,000/month\nSoftware: Microsoft 365 E5, Licenses: 500, Utilization: 85%, Cost: ¥1,875,000/month",
      userUsageData: "User A (Designer): Figma daily, all features. User B (Sales): Figma view-only, once a week.\nUser C (Developer): M365 daily (Outlook, Teams). User D (HR): M365 daily (Word, Excel, Outlook).",
      subscriptionDetails: "Figma Enterprise: Renews Feb 15, 2025. M365 E5: Renews Jul 1, 2025.",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    setResult(null)
    try {
      const optimizationResult = await licenseOptimizationRecommendations({
        ...values,
        language: language,
      })
      setResult(optimizationResult)
    } catch (error) {
      console.error("Error getting recommendations:", error)
      toast({
          variant: "destructive",
          title: t('actions.error'),
          description: t('errors.ai_recommendation_failed'),
      });
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>{t('pages.optimize.header')}</CardTitle>
          <CardDescription>
            {t('pages.optimize.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="softwareInventory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.optimize.form.inventory')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('pages.optimize.form.inventory_placeholder')}
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userUsageData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.optimize.form.usage')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('pages.optimize.form.usage_placeholder')}
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subscriptionDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.optimize.form.subscription')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('pages.optimize.form.subscription_placeholder')}
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {t('pages.optimize.button_generate')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="lg:col-span-1">
        <Card className="sticky top-20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    {t('pages.optimize.recommendations_header')}
                </CardTitle>
                <CardDescription>
                    {t('pages.optimize.recommendations_desc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[400px]">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <Loader className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">{t('pages.optimize.analyzing')}</p>
                    </div>
                )}
                {result && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">{t('pages.optimize.cost_savings')}</h3>
                            <p className="text-2xl font-bold text-green-600">{result.costSavingsEstimate}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">{t('pages.optimize.recommendations')}</h3>
                            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
                                {result.recommendations}
                            </div>
                        </div>
                    </div>
                )}
                 {!loading && !result && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-muted-foreground">{t('pages.optimize.report_placeholder')}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <p className="text-xs text-muted-foreground">
                    {t('pages.optimize.footer')}
                </p>
            </CardFooter>
        </Card>
      </div>
    </div>
  )
}
