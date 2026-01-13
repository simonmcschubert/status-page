import { Routes, Route, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Activity } from 'lucide-react'
import StatusPage from './pages/StatusPage'
import { MonitorDetailPage } from './pages/MonitorDetailPage'

function App() {
  useEffect(() => {
    // Always follow system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      const newTheme = e.matches ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', newTheme)
    }
    
    // Set initial theme
    updateTheme(mediaQuery)
    
    // Listen for system theme changes
    mediaQuery.addEventListener('change', updateTheme)
    
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
          >
            <Activity className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Status Page</h1>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<StatusPage />} />
          <Route path="/monitor/:id" element={<MonitorDetailPage />} />
        </Routes>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Powered by Status Page
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
