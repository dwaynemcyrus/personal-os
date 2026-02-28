import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, NavigationProvider } from './components/providers';
import { App } from './App';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </AuthProvider>
  </StrictMode>
);
