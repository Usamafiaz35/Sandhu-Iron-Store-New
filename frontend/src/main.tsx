import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Footer } from './components/Footer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="site-layout">
      <div className="site-layout__main">
        <App />
      </div>
      <Footer />
    </div>
  </StrictMode>,
)
