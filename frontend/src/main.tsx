import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import '@/index.css'
// Page Imports
import { HomePage } from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import NetworkPage from '@/pages/NetworkPage'
import BrainPage from '@/pages/BrainPage'
import KeysPage from '@/pages/KeysPage'
import PoliciesPage from '@/pages/PoliciesPage'
import LogsPage from '@/pages/LogsPage'
import MemoryPage from '@/pages/MemoryPage'
import OperatorsPage from '@/pages/OperatorsPage'
import DiscoveryPage from '@/pages/DiscoveryPage'
import SettingsPage from '@/pages/SettingsPage'
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/network",
    element: <NetworkPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/brain",
    element: <BrainPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/keys",
    element: <KeysPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/policies",
    element: <PoliciesPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/logs",
    element: <LogsPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/memory",
    element: <MemoryPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/operators",
    element: <OperatorsPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/discovery",
    element: <DiscoveryPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
    errorElement: <RouteErrorBoundary />,
  }
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider attribute='class' defaultTheme='system' enableSystem>
        <ErrorBoundary>
          <Toaster position="top-right" />
          <RouterProvider router={router} />
        </ErrorBoundary>
      </NextThemesProvider>
    </QueryClientProvider>
  </StrictMode>,
)