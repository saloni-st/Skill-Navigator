'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface UseAsyncStateOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
}

export function useAsyncState<T = any>(options: UseAsyncStateOptions = {}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    try {
      setLoading(true)
      setError(null)
      const result = await asyncFunction()
      setData(result)
      
      if (options.successMessage) {
        toast.success(options.successMessage)
      }
      
      if (options.onSuccess) {
        options.onSuccess(result)
      }
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred')
      setError(error)
      
      const errorMessage = options.errorMessage || error.message || 'Something went wrong'
      toast.error(errorMessage)
      
      if (options.onError) {
        options.onError(error)
      }
      
      throw error
    } finally {
      setLoading(false)
    }
  }, [options])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}