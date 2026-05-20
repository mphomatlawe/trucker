import { Analytics } from '@vercel/analytics/react';
import TruckerDashboard from './trucker-dashboard-improved.tsx';

export default function App() {
  return (
    <>
      <TruckerDashboard />
      <Analytics />
    </>
  );
}
