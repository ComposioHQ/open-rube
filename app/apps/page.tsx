'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function AppsCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const status = searchParams.get('status')
    const connectedAccountId = searchParams.get('connected_account_id')

    if (status === 'success' && connectedAccountId) {
      // Trigger a refresh event for any listening components
      window.dispatchEvent(new CustomEvent('connectionSuccess', {
        detail: { connectedAccountId }
      }))
      
      // Show success message and redirect to main page apps tab
      setTimeout(() => {
        router.push('/?tab=apps')
      }, 2000)
    } else if (status === 'error') {
      // Show error message and redirect
      setTimeout(() => {
        router.push('/?tab=apps')
      }, 3000)
    } else {
      // Default redirect
      router.push('/?tab=apps')
    }
  }, [searchParams, router])

  const status = searchParams.get('status')
  const error = searchParams.get('error')

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcfaf9' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-orange-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Successful!</h1>
          <p className="text-gray-600 mb-4">Your app has been connected successfully.</p>
          <p className="text-sm text-gray-500">Redirecting you back to apps...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcfaf9' }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h1>
          <p className="text-gray-600 mb-4">
            {error || 'There was an error connecting your app. Please try again.'}
          </p>
          <p className="text-sm text-gray-500">Redirecting you back to apps...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcfaf9' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing connection...</p>
      </div>
    </div>
  )
}

export default function AppsCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcfaf9' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AppsCallbackContent />
    </Suspense>
  )
}