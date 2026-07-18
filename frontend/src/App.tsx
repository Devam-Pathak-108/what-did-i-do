import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/ui/toast-context'
import { ToastViewport } from './components/ui/ToastViewport'
import { DashboardProvider } from './context/DashboardProvider'
import { DashboardLayout } from './layouts/DashboardLayout'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { ChatPage } from './pages/ChatPage'
import { SummaryPage } from './pages/SummaryPage'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <DashboardProvider>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/:conversationId" element={<ChatPage />} />
              <Route path="/summary" element={<SummaryPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </DashboardProvider>
        <ToastViewport />
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
