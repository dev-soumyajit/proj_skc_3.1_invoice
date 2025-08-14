// components/admin/cache-debug.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  RefreshCw, 
  Trash2, 
  Search, 
  Database, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Loader2
} from "lucide-react"
import { toast } from "sonner"

interface CacheHealth {
  status: string
  error?: string
}

interface CacheInspection {
  key: string
  rawData: string | null
  parsedData: any
  isValidJson: boolean
}

export function CacheDebugComponent() {
  const [loading, setLoading] = useState(false)
  const [health, setHealth] = useState<CacheHealth | null>(null)
  const [inspection, setInspection] = useState<CacheInspection | null>(null)
  const [inspectKey, setInspectKey] = useState("master:customers")

  const checkHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/cache?action=health')
      const data = await response.json()
      setHealth(data)
      
      if (data.status === 'healthy') {
        toast.success('Redis connection is healthy')
      } else {
        toast.error(`Redis connection issue: ${data.error}`)
      }
    } catch (error) {
      toast.error('Failed to check Redis health')
      setHealth({ status: 'error', error: 'Connection failed' })
    } finally {
      setLoading(false)
    }
  }

  const inspectCache = async (key: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/cache?action=inspect&key=${encodeURIComponent(key)}`)
      const data = await response.json()
      setInspection(data)
      
      if (data.rawData) {
        toast.success(`Cache key "${key}" inspected`)
      } else {
        toast.info(`No data found for key "${key}"`)
      }
    } catch (error) {
      toast.error('Failed to inspect cache')
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async (action: string, label: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/cache?action=${action}`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || `${label} cleared successfully`)
        // Refresh inspection if we're looking at a cleared key
        if (inspection) {
          setTimeout(() => inspectCache(inspection.key), 500)
        }
      } else {
        toast.error(data.error || `Failed to clear ${label.toLowerCase()}`)
      }
    } catch (error) {
      toast.error(`Failed to clear ${label.toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }

  const rebuildCustomers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/cache?action=rebuild-customers', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`Customer cache rebuilt with ${data.count} items`)
        // Refresh inspection
        setTimeout(() => inspectCache('master:customers'), 1000)
      } else {
        toast.error(data.error || 'Failed to rebuild customer cache')
      }
    } catch (error) {
      toast.error('Failed to rebuild customer cache')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Health Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Redis Health Check
          </CardTitle>
          <CardDescription>
            Check the connection status of your Redis cache
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={checkHealth} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Check Health
          </Button>

          {health && (
            <Alert className={health.status === 'healthy' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {health.status === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  Status: <Badge variant={health.status === 'healthy' ? 'default' : 'destructive'}>
                    {health.status}
                  </Badge>
                  {health.error && (
                    <span className="ml-2 text-sm text-red-600">
                      Error: {health.error}
                    </span>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cache Inspection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Cache Inspector
          </CardTitle>
          <CardDescription>
            Inspect the contents of specific cache keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="inspect-key" className="sr-only">Cache Key</Label>
              <Input
                id="inspect-key"
                value={inspectKey}
                onChange={(e) => setInspectKey(e.target.value)}
                placeholder="Enter cache key (e.g., master:customers)"
              />
            </div>
            <Button 
              onClick={() => inspectCache(inspectKey)} 
              disabled={loading || !inspectKey}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {inspection && (
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Key: {inspection.key}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Badge variant={inspection.rawData ? 'default' : 'secondary'}>
                    Data: {inspection.rawData ? 'Present' : 'None'}
                  </Badge>
                  <Badge variant={inspection.isValidJson ? 'default' : 'destructive'}>
                    JSON: {inspection.isValidJson ? 'Valid' : 'Invalid'}
                  </Badge>
                  <Badge variant="outline">
                    Type: {inspection.parsedData || 'None'}
                  </Badge>
                </div>

                {inspection.rawData && (
                  <div className="mt-3">
                    <Label className="text-xs font-medium text-slate-600">Raw Data Preview</Label>
                    <pre className="mt-1 p-3 bg-slate-50 rounded-md text-xs overflow-x-auto">
                      {inspection.rawData}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Clear specific caches or rebuild corrupted data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              onClick={() => clearCache('clear-customers', 'Customer Cache')}
              disabled={loading}
              className="justify-start"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Customers
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => clearCache('clear-vendors', 'Vendor Cache')}
              disabled={loading}
              className="justify-start"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Vendors
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => clearCache('clear-products', 'Product Cache')}
              disabled={loading}
              className="justify-start"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Products
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => clearCache('clear-corrupted', 'Corrupted Cache')}
              disabled={loading}
              className="justify-start"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Clear Corrupted
            </Button>
            
            <Button 
              variant="default" 
              onClick={rebuildCustomers}
              disabled={loading}
              className="justify-start"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Rebuild Customers
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={() => clearCache('clear-all', 'All Cache')}
              disabled={loading}
              className="justify-start"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}