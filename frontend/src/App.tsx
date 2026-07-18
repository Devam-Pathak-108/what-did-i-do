import { DashboardPage } from './pages/DashboardPage'
import { ToastProvider } from './components/ui/toast-context'
import { ToastViewport } from './components/ui/ToastViewport'

function App() {
  return (
    <ToastProvider>
      <DashboardPage />
      <ToastViewport />
    </ToastProvider>
  )
}

export default App
