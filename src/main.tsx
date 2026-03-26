import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// 1. Create a client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // This tells React Query: "Don't refetch data unless it's older than 5 minutes"
      // Prevents spamming the Kotlin backend during development.
      staleTime: 1000 * 60 * 5, 
      retry: 1, // If the backend is down, try once more before failing
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. Wrap the app so every component can use useQuery() */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
