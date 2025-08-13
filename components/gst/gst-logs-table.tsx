"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Search, MoreHorizontal, Eye, Download, RotateCcw, CheckCircle, XCircle, Clock } from "lucide-react"

// Mock GST logs data
const gstLogs = [
  {
    log_id: 1,
    invoice_id: 1,
    invoice_no: "INV-2024-001",
    transaction_type: "generate",
    status: "success",
    irn: "1234567890123456789012345678901234567890123456789012345678901234",
    ack_no: "112010054812345",
    ack_date: "2024-02-16T10:30:00Z",
    api_endpoint: "https://einv-apisandbox.nic.in/eicore/v1.03/Invoice",
    created_at: "2024-02-16T10:25:00Z",
    updated_at: "2024-02-16T10:30:00Z",
    error_code: null,
    error_message: null,
  },
  {
    log_id: 2,
    invoice_id: 2,
    invoice_no: "INV-2024-002",
    transaction_type: "generate",
    status: "failed",
    irn: null,
    ack_no: null,
    ack_date: null,
    api_endpoint: "https://einv-apisandbox.nic.in/eicore/v1.03/Invoice",
    created_at: "2024-02-15T14:20:00Z",
    updated_at: "2024-02-15T14:20:00Z",
    error_code: "2150",
    error_message: "Duplicate IRN",
  },
  {
    log_id: 3,
    invoice_id: 1,
    invoice_no: "INV-2024-001",
    transaction_type: "cancel",
    status: "success",
    irn: "1234567890123456789012345678901234567890123456789012345678901234",
    ack_no: null,
    ack_date: null,
    api_endpoint: "https://einv-apisandbox.nic.in/eicore/v1.03/Invoice/Cancel",
    created_at: "2024-02-17T09:15:00Z",
    updated_at: "2024-02-17T09:15:00Z",
    error_code: null,
    error_message: null,
  },
  {
    log_id: 4,
    invoice_id: 3,
    invoice_no: "INV-2024-003",
    transaction_type: "retry",
    status: "pending",
    irn: null,
    ack_no: null,
    ack_date: null,
    api_endpoint: "https://einv-apisandbox.nic.in/eicore/v1.03/Invoice",
    created_at: "2024-02-17T11:00:00Z",
    updated_at: "2024-02-17T11:00:00Z",
    error_code: null,
    error_message: null,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800"
    case "failed":
      return "bg-red-100 text-red-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "success":
      return <CheckCircle className="h-4 w-4" />
    case "failed":
      return <XCircle className="h-4 w-4" />
    case "pending":
      return <Clock className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const getTransactionTypeColor = (type: string) => {
  switch (type) {
    case "generate":
      return "bg-blue-100 text-blue-800"
    case "cancel":
      return "bg-red-100 text-red-800"
    case "retry":
      return "bg-orange-100 text-orange-800"
    case "error":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export function GSTLogsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredLogs, setFilteredLogs] = useState(gstLogs)
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const filtered = gstLogs.filter(
      (log) =>
        log.invoice_no.toLowerCase().includes(value.toLowerCase()) ||
        log.transaction_type.toLowerCase().includes(value.toLowerCase()) ||
        log.status.toLowerCase().includes(value.toLowerCase()) ||
        (log.irn && log.irn.toLowerCase().includes(value.toLowerCase())),
    )
    setFilteredLogs(filtered)
  }

  const handleRetry = async (logId: number) => {
    console.log("Retrying GST transaction:", logId)
    // In production, make API call to retry the transaction
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GST Transaction Logs</CardTitle>
          <CardDescription>Complete history of GST API interactions and responses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Transaction Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IRN</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Error Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold text-slate-900">{log.invoice_no}</div>
                        <div className="text-sm text-slate-500">ID: {log.invoice_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getTransactionTypeColor(log.transaction_type)}>
                        {log.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log.status)}
                        <Badge variant="secondary" className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.irn ? (
                        <div className="font-mono text-xs">
                          <div>{log.irn.substring(0, 20)}...</div>
                          {log.ack_no && <div className="text-slate-500">ACK: {log.ack_no}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(log.created_at).toLocaleDateString()}</div>
                        <div className="text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.error_code ? (
                        <div className="text-sm">
                          <div className="font-mono text-red-600">{log.error_code}</div>
                          <div className="text-slate-600 truncate max-w-xs">{log.error_message}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>GST Transaction Details</DialogTitle>
                                <DialogDescription>
                                  Complete request and response data for {log.invoice_no}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Transaction Info</h4>
                                    <div className="text-sm space-y-1">
                                      <div>
                                        <span className="text-slate-500">Type:</span> {log.transaction_type}
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Status:</span> {log.status}
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Endpoint:</span> {log.api_endpoint}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Response Info</h4>
                                    <div className="text-sm space-y-1">
                                      {log.irn && (
                                        <div>
                                          <span className="text-slate-500">IRN:</span>{" "}
                                          <span className="font-mono text-xs">{log.irn}</span>
                                        </div>
                                      )}
                                      {log.ack_no && (
                                        <div>
                                          <span className="text-slate-500">ACK No:</span> {log.ack_no}
                                        </div>
                                      )}
                                      {log.error_code && (
                                        <div>
                                          <span className="text-slate-500">Error:</span> {log.error_code} -{" "}
                                          {log.error_message}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Request Payload</h4>
                                  <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(
                                      { invoice_no: log.invoice_no, transaction_type: log.transaction_type },
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Response Payload</h4>
                                  <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
                                    {JSON.stringify({ status: log.status, irn: log.irn, ack_no: log.ack_no }, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download JSON
                          </DropdownMenuItem>
                          {log.status === "failed" && (
                            <DropdownMenuItem onClick={() => handleRetry(log.log_id)}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Retry Transaction
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">No GST logs found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
