import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import 'bootstrap/dist/css/bootstrap.css';
import { ThemeProvider } from './shared/context/ThemeContext';

import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode >,
)
