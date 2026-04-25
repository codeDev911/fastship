"use client"

import * as React from "react"
import { Search, Loader2, AlertCircle } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@fastship/ui"
import { Input } from "@fastship/ui"
import { Button } from "@fastship/ui"

// IMPORTANT: Adjust this import to point to where your secureFetch is actually defined
import { secureFetch } from "@fastship/lib" 

// Define the shape of your data
interface ExchangeRate {
  id: string
  pair: string
  from: string
  to: string
  rate: number
  source: string
  updatedAt: string
  createdAt: string
}

export function ExchangeRateModal() {
  const [exchangeRates, setExchangeRates] = React.useState<ExchangeRate[]>([])
  const [filter, setFilter] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch data on mount
  React.useEffect(() => {
    async function loadRates() {
      setIsLoading(true)
      setError(null)
      try {
        // Using your custom secureFetch wrapper
        const response = await secureFetch("/api/currency-exchange")
        
        // Assuming your API returns { "exchangeRates": [...] } or just the array [...]
        // Adjust this depending on exactly how your secureFetch parses the JSON
        const data = await response.json() 
        const ratesArray = data.exchangeRates || data
        
        setExchangeRates(ratesArray)
      } catch (err) {
        console.error("Failed to fetch exchange rates:", err)
        setError("Unable to load exchange rates at this time.")
      } finally {
        setIsLoading(false)
      }
    }

    loadRates()
  }, [])

  // Filter logic based on the user's search query
  const filteredRates = exchangeRates?.filter((rate) =>
    rate.pair.toLowerCase().includes(filter.toLowerCase()) ||
    rate.to.toLowerCase().includes(filter.toLowerCase())
  )

  // Helper to format the date nicely
  const formatLastUpdated = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return "Unknown"
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Exchange Rates</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Currency Exchange Rates</DialogTitle>
          <DialogDescription>
            Live conversion rates based on 1 USD.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Filter Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by currency (e.g. INR or PKR)..."
              className="pl-9"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              disabled={isLoading || !!error}
            />
          </div>

          {/* Dynamic Content Area */}
          <div className="flex flex-col gap-3 min-h-[150px] max-h-[350px] overflow-y-auto pr-2">
            
            {/* State: Loading */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p className="text-sm">Fetching live rates...</p>
              </div>
            )}

            {/* State: Error */}
            {!isLoading && error && (
              <div className="flex flex-col items-center justify-center h-full text-destructive py-8 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="h-6 w-6 mb-2" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* State: Success with Data */}
            {!isLoading && !error && filteredRates.length > 0 && (
              filteredRates.map((rate) => (
                <div 
                  key={rate.id} 
                  className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold tracking-tight">
                        {rate.from} <span className="text-muted-foreground font-normal mx-1">→</span> {rate.to}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {rate.rate.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Source: {rate.source}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-500">
                      Last Updated: {formatLastUpdated(rate.updatedAt)}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* State: No Results Found */}
            {!isLoading && !error && exchangeRates.length > 0 && filteredRates.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-lg">
                No exchange rates match "{filter}".
              </div>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}