import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, NavigationProvider } from './components/providers';
import { QueryProvider } from './components/providers/QueryProvider';
import { App } from './App';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <QueryProvider>
        <NavigationProvider>
          <App />
        </NavigationProvider>
      </QueryProvider>
    </AuthProvider>
  </StrictMode>
);
