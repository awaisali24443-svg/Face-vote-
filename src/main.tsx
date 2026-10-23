import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { installLocalApiInterceptor, removeCachedDummyVoters } from './services/deviceMode.ts';
// Self-hosted fonts — bundled with the app so the visuals are identical
// with no internet (no Google Fonts CDN at run time).
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import '@fontsource/jetbrains-mono/latin-800.css';
import '@fontsource/noto-nastaliq-urdu/arabic-500.css';
import '@fontsource/noto-nastaliq-urdu/arabic-700.css';
import '@fontsource/noto-nastaliq-urdu/latin-500.css';
import '@fontsource/noto-nastaliq-urdu/latin-700.css';
import './index.css';

// Device Mode (default): /api/* is answered on this device — fully offline demo.
installLocalApiInterceptor();
removeCachedDummyVoters();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);

