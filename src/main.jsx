import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import PracticeSession from './PracticeSession.jsx'
import Timer from './Timer.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/practice" element={<PracticeSession />} />
        <Route path="/timer" element={<Timer />} />
      </Routes>
          </HashRouter>
  </StrictMode>,
)
