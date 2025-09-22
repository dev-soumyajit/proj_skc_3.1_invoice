"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Package, TrendingUp, Check, X } from "lucide-react"
import { toast } from "sonner"

interface StockAlert {
  alert_id: number
  alert_type: string
  alert_message: string
  current_quantity: number
  threshold_quantity?: number
  is_read: boolean
  created_at: string
  product_name: string
  product_code?: string
  godown_name: string
  unit_name: string
}

const getAlertTypeIcon = (type: string) => {
  switch (type) {
    case "low_stock":
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    case "out_of_stock":
      return <X className="h-4 w-4 text-red-600" />
    case "overstock":
      return <TrendingUp className="h-4 w-4 text-blue-600" />
    default:
      return <Package className="h-4 w-4 text-slate-600" />
  }
}

const getAlertTypeColor = (type: string) => {
  switch (type) {
    case "low_stock":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "out_of_stock":
      return "bg-red-100 text-red-800 border-red-200"
    case "overstock":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-slate-100 text-slate-800 border-slate-200"
  }
}

export function StockAlerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState("")
  const [unreadOnly, setUnreadOnly] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [typeFilter, unreadOnly])

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: "50"
      })

      if (unreadOnly) params.append('unread', 'true')
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter)

      const response = await fetch(`/api/stock/alerts?${params}`)
      const data = await response.json()

      if (data.success) {
        setAlerts(data.data)
      } else {
        toast.error(data.error || 'Failed to fetch alerts')
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
      toast.error('Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }

  const markAlertsAsRead = async (alertIds: number[]) => {
    try {
      const response = await fetch('/api/stock/alerts/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_ids: alertIds })
      })

      const data = await response.json()
      if (data.success) {
        fetchAlerts()
      } else {
        toast.error(data.error || 'Failed to mark alerts as read')
      }
    } catch (error) {
      console.error('Error marking alerts as read:', error)
      toast.error('Failed to mark alerts as read')
    }
  }

  const markAllAsRead = () => {
    const unreadIds = alerts.filter(alert => !alert.is_read).map(alert => alert.alert_id)
    if (unreadIds.length > 0) {
      markAlertsAsRead(unreadIds)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-slate-500">Loading alerts...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={typeFilter || "all"} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Alert Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              <SelectItem value="overstock">Overstock</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={unreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
          >
            {unreadOnly ? "Unread Only" : "Show All"}
          </Button>
        </div>

        {alerts.some(alert => !alert.is_read) && (
          <Button onClick={markAllAsRead} size="sm">
            <Check className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Alerts</CardTitle>
          <CardDescription>
            Important notifications about inventory levels ({alerts.length} alerts)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-slate-500">No stock alerts at this time.</p>
              <p className="text-sm text-slate-400 mt-1">All inventory levels are within acceptable ranges.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className={`p-4 rounded-lg border-l-4 ${getAlertTypeColor(alert.alert_type)} ${
                    !alert.is_read ? 'bg-opacity-50' : 'bg-opacity-30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getAlertTypeIcon(alert.alert_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {alert.alert_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {!alert.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-900 mb-1">
                          {alert.alert_message}
                        </p>
                        <div className="text-xs text-slate-600 space-y-1">
                          <div>
                            <span className="font-medium">Product:</span> {alert.product_name}
                            {alert.product_code && ` (${alert.product_code})`}
                          </div>
                          <div>
                            <span className="font-medium">Warehouse:</span> {alert.godown_name}
                          </div>
                          <div>
                            <span className="font-medium">Current Stock:</span>{' '}
                            {alert.current_quantity.toLocaleString()} {alert.unit_name}
                            {alert.threshold_quantity && (
                              <span className="ml-2">
                                (Threshold: {alert.threshold_quantity.toLocaleString()} {alert.unit_name})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                      {!alert.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAlertsAsRead([alert.alert_id])}
                          className="h-6 px-2"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}