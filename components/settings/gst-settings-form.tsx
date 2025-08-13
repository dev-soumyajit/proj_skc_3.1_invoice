"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, TestTube, CheckCircle, XCircle, Settings, Building, Key } from "lucide-react"

export function GSTSettingsForm() {
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [apiSettings, setApiSettings] = useState({
    api_base_url: "https://einv-apisandbox.nic.in",
    api_username: "",
    api_password: "",
    client_id: "",
    client_secret: "",
    environment: "sandbox",
  })

  const [companySettings, setCompanySettings] = useState({
    gstin: "27AABCU9603R1ZX",
    legal_name: "Your Company Name Pvt Ltd",
    trade_name: "Your Company",
    address_line1: "123 Business Park",
    address_line2: "Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    state_code: "27",
    pincode: "400069",
    phone: "+91 9876543210",
    email: "gst@yourcompany.com",
  })

  const handleTestConnection = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      // Simulate API test
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock test result
      const success = Math.random() > 0.3 // 70% success rate for demo

      setTestResult({
        success,
        message: success
          ? "GST API connection successful! Authentication token received."
          : "Connection failed. Please check your credentials and try again.",
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: "Network error occurred during testing.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setLoading(true)

    try {
      // Simulate save operation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In production, make API call to save settings
      console.log("Saving GST settings:", { apiSettings, companySettings })

      setTestResult({
        success: true,
        message: "GST settings saved successfully!",
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to save settings. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="api" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api" className="flex items-center">
            <Key className="mr-2 h-4 w-4" />
            API Configuration
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center">
            <Building className="mr-2 h-4 w-4" />
            Company Details
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Advanced Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GST API Configuration</CardTitle>
              <CardDescription>Configure your GST e-invoicing API credentials and endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant={apiSettings.environment === "sandbox" ? "default" : "secondary"}>
                      {apiSettings.environment === "sandbox" ? "Sandbox" : "Production"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setApiSettings({
                          ...apiSettings,
                          environment: apiSettings.environment === "sandbox" ? "production" : "sandbox",
                          api_base_url:
                            apiSettings.environment === "sandbox"
                              ? "https://einv-api.nic.in"
                              : "https://einv-apisandbox.nic.in",
                        })
                      }
                    >
                      Switch to {apiSettings.environment === "sandbox" ? "Production" : "Sandbox"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_base_url">API Base URL</Label>
                  <Input
                    id="api_base_url"
                    value={apiSettings.api_base_url}
                    onChange={(e) => setApiSettings({ ...apiSettings, api_base_url: e.target.value })}
                    placeholder="https://einv-apisandbox.nic.in"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_username">API Username</Label>
                  <Input
                    id="api_username"
                    value={apiSettings.api_username}
                    onChange={(e) => setApiSettings({ ...apiSettings, api_username: e.target.value })}
                    placeholder="Enter your GST API username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_password">API Password</Label>
                  <Input
                    id="api_password"
                    type="password"
                    value={apiSettings.api_password}
                    onChange={(e) => setApiSettings({ ...apiSettings, api_password: e.target.value })}
                    placeholder="Enter your GST API password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    value={apiSettings.client_id}
                    onChange={(e) => setApiSettings({ ...apiSettings, client_id: e.target.value })}
                    placeholder="Enter your client ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <Input
                    id="client_secret"
                    type="password"
                    value={apiSettings.client_secret}
                    onChange={(e) => setApiSettings({ ...apiSettings, client_secret: e.target.value })}
                    placeholder="Enter your client secret"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <Button onClick={handleTestConnection} disabled={loading} variant="outline">
                  <TestTube className="mr-2 h-4 w-4" />
                  {loading ? "Testing..." : "Test Connection"}
                </Button>

                {testResult && (
                  <Alert
                    className={`flex-1 ${testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                  >
                    <div className="flex items-center">
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className="ml-2">{testResult.message}</AlertDescription>
                    </div>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Enter your company details for GST e-invoicing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN *</Label>
                  <Input
                    id="gstin"
                    value={companySettings.gstin}
                    onChange={(e) => setCompanySettings({ ...companySettings, gstin: e.target.value })}
                    placeholder="27AABCU9603R1ZX"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_name">Legal Name *</Label>
                  <Input
                    id="legal_name"
                    value={companySettings.legal_name}
                    onChange={(e) => setCompanySettings({ ...companySettings, legal_name: e.target.value })}
                    placeholder="Your Company Name Pvt Ltd"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade_name">Trade Name</Label>
                  <Input
                    id="trade_name"
                    value={companySettings.trade_name}
                    onChange={(e) => setCompanySettings({ ...companySettings, trade_name: e.target.value })}
                    placeholder="Your Company"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    placeholder="gst@yourcompany.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state_code">State Code</Label>
                  <Input
                    id="state_code"
                    value={companySettings.state_code}
                    onChange={(e) => setCompanySettings({ ...companySettings, state_code: e.target.value })}
                    placeholder="27"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line1">Address Line 1 *</Label>
                <Input
                  id="address_line1"
                  value={companySettings.address_line1}
                  onChange={(e) => setCompanySettings({ ...companySettings, address_line1: e.target.value })}
                  placeholder="123 Business Park"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={companySettings.address_line2}
                    onChange={(e) => setCompanySettings({ ...companySettings, address_line2: e.target.value })}
                    placeholder="Andheri East"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={companySettings.city}
                    onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                    placeholder="Mumbai"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">PIN Code *</Label>
                  <Input
                    id="pincode"
                    value={companySettings.pincode}
                    onChange={(e) => setCompanySettings({ ...companySettings, pincode: e.target.value })}
                    placeholder="400069"
                    className="font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configure advanced GST integration options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retry_attempts">Retry Attempts</Label>
                  <Input id="retry_attempts" type="number" defaultValue="3" min="1" max="5" placeholder="3" />
                  <p className="text-xs text-slate-500">Number of retry attempts for failed API calls</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Request Timeout (seconds)</Label>
                  <Input id="timeout" type="number" defaultValue="30" min="10" max="120" placeholder="30" />
                  <p className="text-xs text-slate-500">API request timeout duration</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
                <Input id="webhook_url" type="url" placeholder="https://yourapp.com/webhooks/gst" />
                <p className="text-xs text-slate-500">URL to receive GST API status updates</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_headers">Custom Headers (JSON)</Label>
                <Textarea id="custom_headers" placeholder='{"X-Custom-Header": "value"}' rows={3} />
                <p className="text-xs text-slate-500">Additional headers to include in API requests</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end space-x-4">
        <Button variant="outline">Reset to Defaults</Button>
        <Button onClick={handleSaveSettings} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
