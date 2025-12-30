import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load pages for better performance
const DemoPage = lazy(() => import('./pages/DemoPage'));
const InspectorPage = lazy(() => import('./pages/InspectorPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));

function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="/demo" replace />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/inspector" element={<InspectorPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<Navigate to="/demo" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
