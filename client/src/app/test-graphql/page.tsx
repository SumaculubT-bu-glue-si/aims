'use client'

import { useState } from 'react'
import { graphqlQuery, INVENTORY_QUERIES } from '@/lib/graphql-client'

export default function TestGraphQLPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAssetsQuery = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await graphqlQuery(INVENTORY_QUERIES.GET_ASSETS)
      setResult(response)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testEmployeesQuery = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await graphqlQuery(INVENTORY_QUERIES.GET_EMPLOYEES)
      setResult(response)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testLoansQuery = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await graphqlQuery(INVENTORY_QUERIES.GET_LOANS)
      setResult(response)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">GraphQL Test Page</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testAssetsQuery}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Test Assets Query
        </button>
        
        <button 
          onClick={testEmployeesQuery}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          Test Employees Query
        </button>
        
        <button 
          onClick={testLoansQuery}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
        >
          Test Loans Query
        </button>
      </div>

      {loading && <div className="text-blue-500">Loading...</div>}
      
      {error && (
        <div className="text-red-500 p-4 bg-red-50 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="p-4 bg-gray-50 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
