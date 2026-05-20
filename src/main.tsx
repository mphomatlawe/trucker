import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import TruckerDashboard from './TruckerDashboard.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TruckerDashboard />
    <Analytics />
  </React.StrictMode>,
)
