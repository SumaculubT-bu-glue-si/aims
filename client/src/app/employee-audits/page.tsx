"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mail, AlertTriangle, Loader } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AuditPlan {
  id: string
  name: string
  start_date: string
  due_date: string
  progress: {
    total_assets: number
    audited_assets: number
    percentage: number
  }
}

export default function EmployeeAuditsPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [auditPlans, setAuditPlans] = useState<AuditPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAccessLink, setShowAccessLink] = useState(false)
  const [accessLink, setAccessLink] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [showNoAudits, setShowNoAudits] = useState(false)
  const [showEmailNotFound, setShowEmailNotFound] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch available audit plans when component mounts
  useEffect(() => {
    fetchAuditPlans()
  }, [])

  const fetchAuditPlans = async () => {
    try {
      const response = await fetch('/api/employee-audits/available-plans')
      
      if (response.ok) {
        const data = await response.json()
        setAuditPlans(data.auditPlans || [])
        
        if (data.auditPlans && data.auditPlans.length === 0) {
          console.warn('No audit plans returned from API')
        }
      } else {
        console.error('Failed to fetch audit plans, status:', response.status)
        const errorData = await response.json()
        console.error('Error data:', errorData)
        
        // Show error to user
        setError(`Failed to fetch audit plans: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to fetch audit plans:', error)
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    
    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }
    
    if (!selectedPlanId || selectedPlanId === "") {
      setError("Please select an audit task")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/employee-audits/request-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          audit_plan_id: selectedPlanId 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.success) {
          if (data.email_sent) {
            // Email was sent successfully
            setEmailSent(true)
            setSuccessMessage(data.message)
            setShowAccessLink(true)
            setAccessLink('') // No need to show access link since email was sent
          } else if (data.accessUrl) {
            // Email failed but access URL provided as fallback
            setEmailSent(false)
            setSuccessMessage(data.message)
            setAccessLink(data.accessUrl)
            setShowAccessLink(true)
          } else {
            setShowNoAudits(true)
          }
        } else {
          setShowNoAudits(true)
        }
      } else {
        console.error('Request failed with status:', response.status)
        console.error('Response data:', data)
        
        if (response.status === 404) {
          setShowEmailNotFound(true)
        } else if (response.status === 403) {
          setShowNoAudits(true)
        } else if (response.status === 500) {
          setError('Server error. Please try again later or contact support.')
        } else {
          setError(data.message || `Failed to request access (Status: ${response.status})`)
        }
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail("")
    setSelectedPlanId("")
    setShowAccessLink(false)
    setAccessLink("")
    setEmailSent(false)
    setSuccessMessage(null)
    setShowNoAudits(false)
    setShowEmailNotFound(false)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">Select Inventory Task</CardTitle>
          <CardDescription>
            Choose your audit task and enter your email to receive a secure access link via email.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
                         <div className="space-y-2">
               <Label htmlFor="auditPlan">Inventory Task</Label>
                               {auditPlans.length > 0 ? (
                  <div className="relative">
                    <Select 
                      value={selectedPlanId} 
                      onValueChange={(value) => {
                        setSelectedPlanId(value)
                      }}
                    >
                                             <SelectTrigger className="w-full">
                         <SelectValue>
                           {selectedPlanId && auditPlans.find(plan => String(plan.id) === selectedPlanId)?.name}
                         </SelectValue>
                       </SelectTrigger>
                      <SelectContent>
                        {auditPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{plan.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {plan.progress.audited_assets} of {plan.progress.total_assets} assets audited ({plan.progress.percentage}%)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-500 text-center">
                      {auditPlans.length === 0 ? "Loading available audit tasks..." : "No audit tasks available"}
                    </p>
                  </div>
                )}
               
             </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Progress Summary for Selected Plan */}
            {selectedPlanId && auditPlans.find(plan => String(plan.id) === selectedPlanId) && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Audit Progress</span>
                  <span className="text-sm text-blue-700">
                    {auditPlans.find(plan => String(plan.id) === selectedPlanId)?.progress.percentage}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${auditPlans.find(plan => String(plan.id) === selectedPlanId)?.progress.percentage || 0}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-blue-700">
                  {auditPlans.find(plan => String(plan.id) === selectedPlanId)?.progress.audited_assets} of{' '}
                  {auditPlans.find(plan => String(plan.id) === selectedPlanId)?.progress.total_assets} assets audited
                </div>
              </div>
            )}

            <Alert className="bg-gray-50 border-gray-200">
              <AlertTriangle className="w-4 h-4 text-gray-600" />
              <AlertDescription className="text-gray-800">
                <span className="font-semibold">Access Link Expiration</span><br />
                The access link sent to your email will expire in 15 minutes for security purposes.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !email.trim() || !selectedPlanId || selectedPlanId === ""}
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Sending Access Link...
                </>
              ) : (
                "Send Access Link"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Access Link Modal */}
      {showAccessLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {emailSent ? 'Email Sent Successfully' : 'Access Link Generated'}
              </CardTitle>
              <CardDescription>
                {emailSent 
                  ? 'Your secure access link has been sent to your email. Check your inbox and click the link in the email to access your audit.'
                  : 'Your secure access link has been created. Click the button below to access your audit.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              )}
              
              {!emailSent && accessLink && (
                <Button 
                  onClick={() => window.open(accessLink, '_blank')}
                  className="w-full"
                >
                  Access Audit Dashboard
                </Button>
              )}
              
              <div className="text-center text-sm text-muted-foreground">
                {emailSent 
                  ? '✅ Check your email for the secure access link. The link will expire in 15 minutes.'
                  : '⚠️ Email delivery failed, but you can access your audit directly using the button above.'
                }
              </div>
              
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="w-full"
              >
                Request Another Link
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Audits Modal */}
      {showNoAudits && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
                             <CardTitle className="text-xl font-semibold text-gray-900">No Audit Task</CardTitle>
               <CardDescription>
                 You have no audit task, thank you.
               </CardDescription>
            </CardHeader>
            <CardContent>
                             <Button 
                 variant="outline" 
                 onClick={resetForm}
                 className="w-full"
               >
                 Close
               </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Not Found Modal */}
      {showEmailNotFound && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">Email Not Found</CardTitle>
              <CardDescription>
                The email address you entered is not registered in our system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="w-full"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
