import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from './components/Layout'
import LanguageSelectPage from './pages/LanguageSelectPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import FPODashboardPage from './pages/FPODashboardPage'
import BuyerDashboardPage from './pages/BuyerDashboardPage'
import MandiPricesPage from './pages/MandiPricesPage'
import PriceDetailPage from './pages/PriceDetailPage'
import BuyerMarketPage from './pages/BuyerMarketPage'
import MyLotsPage from './pages/MyLotsPage'
import LogisticsPage from './pages/LogisticsPage'
import PaymentsPage from './pages/PaymentsPage'
import DisputePage from './pages/DisputePage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const { i18n } = useTranslation()
  const [isFirstVisit, setIsFirstVisit] = useState(!localStorage.getItem('bf_lang_selected'))
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('bf_logged_in') === 'true')
  const [userRole, setUserRole] = useState(localStorage.getItem('bf_user_role') || 'farmer')

  useEffect(() => {
    const lang = i18n.language
    const dir = lang === 'ur' ? 'rtl' : 'ltr'
    document.documentElement.setAttribute('dir', dir)
    document.documentElement.setAttribute('lang', lang)
  }, [i18n.language])

  const handleLanguageSelected = () => {
    localStorage.setItem('bf_lang_selected', 'true')
    setIsFirstVisit(false)
  }

  const handleLogin = (role = 'farmer') => {
    localStorage.setItem('bf_logged_in', 'true')
    localStorage.setItem('bf_user_role', role)
    setUserRole(role)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('bf_logged_in')
    localStorage.removeItem('bf_user_role')
    setIsLoggedIn(false)
    setUserRole('farmer')
  }

  if (isFirstVisit) {
    return <LanguageSelectPage onComplete={handleLanguageSelected} />
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  const getDashboard = () => {
    switch (userRole) {
      case 'admin': return <AdminDashboardPage />
      case 'fpo': return <FPODashboardPage />
      case 'buyer': return <BuyerDashboardPage />
      default: return <DashboardPage />
    }
  }

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={getDashboard()} />
        <Route path="/prices" element={<MandiPricesPage />} />
        <Route path="/prices/:commodityId" element={<PriceDetailPage />} />
        <Route path="/buyers" element={<BuyerMarketPage />} />
        <Route path="/lots" element={<MyLotsPage />} />
        <Route path="/logistics" element={<LogisticsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/disputes" element={<DisputePage />} />
        <Route path="/settings" element={<SettingsPage onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
