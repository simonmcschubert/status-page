import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import StatusPage from './pages/StatusPage'
import './styles/App.css'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Always follow system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      const newTheme = e.matches ? 'dark' : 'light'
      setTheme(newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    }
    
    // Set initial theme
    updateTheme(mediaQuery)
    
    // Listen for system theme changes
    mediaQuery.addEventListener('change', updateTheme)
    
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1>Status Page</h1>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<StatusPage />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>Powered by Status Page</p>
        </div>
      </footer>
    </div>
  )
}

export default App
