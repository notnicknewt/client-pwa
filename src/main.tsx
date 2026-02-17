import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { processPendingMutations } from './lib/api'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

onlineManager.setEventListener((setOnline) => {
  const onOnline = () => setOnline(true)
  const onOffline = () => setOnline(false)
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
})

window.addEventListener('online', () => {
  processPendingMutations()
    .then(() => queryClient.invalidateQueries())
    .catch(() => { /* offline queue drain failed, will retry on next online event */ })
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
