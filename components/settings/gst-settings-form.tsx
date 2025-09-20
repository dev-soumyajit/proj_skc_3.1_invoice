"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, TestTube, CheckCircle, XCircle, Settings, Building, Key } from "lucide-react"

interface GSTSettings {
  api_base_url: string
  api_username: string
  api_password: string
  client_id: string
  client_secret: string
  environment: 'sandbox' | 'production'
  company_gstin: string
  legal_name: string
  trade_name?: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  state_code: string
  pincode: string
  phone?: string
  email?: string
  retry_attempts?: string
  request_timeout?: string
  auto_submit_invoices?: string
  rate_limit_requests?: string
  webhook_url?: string
  custom_headers?: string
}

export function GSTSettingsForm() {
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<GSTSettings | null>(null)

  // Load settings on mount via API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/gst/settings")
        if (!response.ok) throw new Error("Failed to fetch settings")
        const { settings } = await response.json()
        setSettings(settings)
      } catch (err) {
        setError("Failed to load GST settings")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleTestConnection = async () => {
    if (!settings) return
    setTestLoading(true)
    setTestResult(null)
    setError(null)

    try {
      const response = await fetch("/api/gst/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      if (!response.ok) throw new Error("Failed to test connection")
      const result = await response.json()
      setTestResult(result)
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Connection test failed",
      })
    } finally {
      setTestLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!settings) return
    setLoading(true)
    setError(null)
    setTestResult(null)

    try {
      // Basic validation
      if (!settings.company_gstin.match(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)) {
        throw new Error("Invalid GSTIN format")
      }
      if (!settings.api_base_url || !settings.client_id || !settings.api_username) {
        throw new Error("API Base URL, Client ID, and Username are required")
      }
      if (!settings.legal_name || !settings.address_line1 || !settings.city || !settings.state || !settings.state_code || !settings.pincode) {
        throw new Error("All required company details must be filled")
      }

      const response = await fetch("/api/gst/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to save settings")
      }

      const { message } = await response.json()
      setTestResult({ success: true, message })
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to save settings",
      })
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleEnvironmentSwitch = () => {
    if (!settings) return
    const newEnv = settings.environment === "sandbox" ? "production" : "sandbox"
    const newUrl = newEnv === "sandbox" ? "https://einv-apisandbox.nic.in" : "https://einv-api.nic.in"
    setSettings({ ...settings, environment: newEnv, api_base_url: newUrl })
  }

  if (loading && !settings) {
    return <div>Loading settings...</div>
  }

  if (!settings) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || "Failed to load settings"}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
                    <Badge variant={settings.environment === "sandbox" ? "default" : "secondary"}>
                      {settings.environment.toUpperCase()}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={handleEnvironmentSwitch}>
                      Switch to {settings.environment === "sandbox" ? "Production" : "Sandbox"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_base_url">API Base URL *</Label>
                  <Input
                    id="api_base_url"
                    value={settings.api_base_url}
                    onChange={(e) => setSettings({ ...settings, api_base_url: e.target.value })}
                    placeholder="https://einv-apisandbox.nic.in"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_username">API Username *</Label>
                  <Input
                    id="api_username"
                    value={settings.api_username}
                    onChange={(e) => setSettings({ ...settings, api_username: e.target.value })}
                    placeholder="Enter your GST API username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_password">API Password</Label>
                  <Input
                    id="api_password"
                    type="password"
                    value={settings.api_password}
                    onChange={(e) => setSettings({ ...settings, api_password: e.target.value })}
                    placeholder="Enter your GST API password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id">Client ID *</Label>
                  <Input
                    id="client_id"
                    value={settings.client_id}
                    onChange={(e) => setSettings({ ...settings, client_id: e.target.value })}
                    placeholder="Enter your client ID"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <Input
                    id="client_secret"
                    type="password"
                    value={settings.client_secret}
                    onChange={(e) => setSettings({ ...settings, client_secret: e.target.value })}
                    placeholder="Enter your client secret"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <Button onClick={handleTestConnection} disabled={testLoading || loading} variant="outline">
                  <TestTube className="mr-2 h-4 w-4" />
                  {testLoading ? "Testing..." : "Test Connection"}
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
                  <Label htmlFor="company_gstin">GSTIN *</Label>
                  <Input
                    id="company_gstin"
                    value={settings.company_gstin}
                    onChange={(e) => setSettings({ ...settings, company_gstin: e.target.value })}
                    placeholder="29AAXPC1234E1Z5"
                    className="font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_name">Legal Name *</Label>
                  <Input
                    id="legal_name"
                    value={settings.legal_name}
                    onChange={(e) => setSettings({ ...settings, legal_name: e.target.value })}
                    placeholder="Your Company Name Pvt Ltd"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade_name">Trade Name</Label>
                  <Input
                    id="trade_name"
                    value={settings.trade_name || ""}
                    onChange={(e) => setSettings({ ...settings, trade_name: e.target.value })}
                    placeholder="Your Company"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.phone || ""}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email || ""}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="gst@yourcompany.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state_code">State Code *</Label>
                  <Input
                    id="state_code"
                    value={settings.state_code}
                    onChange={(e) => setSettings({ ...settings, state_code: e.target.value })}
                    placeholder="27"
                    className="font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line1">Address Line 1 *</Label>
                <Input
                  id="address_line1"
                  value={settings.address_line1}
                  onChange={(e) => setSettings({ ...settings, address_line1: e.target.value })}
                  placeholder="123 Business Park"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={settings.address_line2 || ""}
                    onChange={(e) => setSettings({ ...settings, address_line2: e.target.value })}
                    placeholder="Andheri East"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    placeholder="Mumbai"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">PIN Code *</Label>
                  <Input
                    id="pincode"
                    value={settings.pincode}
                    onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                    placeholder="400069"
                    className="font-mono"
                    required
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
                  <Input
                    id="retry_attempts"
                    type="number"
                    value={settings.retry_attempts || "3"}
                    onChange={(e) => setSettings({ ...settings, retry_attempts: e.target.value })}
                    min="1"
                    max="5"
                    placeholder="3"
                  />
                  <p className="text-xs text-slate-500">Number of retry attempts for failed API calls</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="request_timeout">Request Timeout (seconds)</Label>
                  <Input
                    id="request_timeout"
                    type="number"
                    value={settings.request_timeout || "30"}
                    onChange={(e) => setSettings({ ...settings, request_timeout: e.target.value })}
                    min="10"
                    max="120"
                    placeholder="30"
                  />
                  <p className="text-xs text-slate-500">API request timeout duration</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auto_submit_invoices">Auto Submit Invoices</Label>
                  <select
                    id="auto_submit_invoices"
                    value={settings.auto_submit_invoices || "0"}
                    onChange={(e) => setSettings({ ...settings, auto_submit_invoices: e.target.value })}
                    className="border p-2 rounded"
                  >
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                  <p className="text-xs text-slate-500">Automatically submit invoices to GST</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate_limit_requests">Rate Limit Requests</Label>
                  <Input
                    id="rate_limit_requests"
                    type="number"
                    value={settings.rate_limit_requests || "50"}
                    onChange={(e) => setSettings({ ...settings, rate_limit_requests: e.target.value })}
                    min="10"
                    max="100"
                    placeholder="50"
                  />
                  <p className="text-xs text-slate-500">Requests per hour</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
                <Input
                  id="webhook_url"
                  type="url"
                  value={settings.webhook_url || ""}
                  onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                  placeholder="https://yourapp.com/webhooks/gst"
                />
                <p className="text-xs text-slate-500">URL to receive GST API status updates</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_headers">Custom Headers (JSON)</Label>
                <Textarea
                  id="custom_headers"
                  value={settings.custom_headers || '{"X-Custom-Header": "value"}'}
                  onChange={(e) => setSettings({ ...settings, custom_headers: e.target.value })}
                  rows={3}
                  placeholder='{"X-Custom-Header": "value"}'
                />
                <p className="text-xs text-slate-500">Additional headers to include in API requests</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => {
            setSettings(null)
            window.location.reload()
          }}
        >
          Reset to Defaults
        </Button>
        <Button onClick={handleSaveSettings} disabled={loading || testLoading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}