import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import Navbar from './components/Navbar.jsx'
import Home from './components/Home.jsx'
import Dashboard from './components/Dashboard.jsx'
import SignupForm from './components/signup.jsx'
import LoginForm from './components/login.jsx'
import AuthCallback from './components/AuthCallback.jsx'
import Payment from './components/Payment.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import AdminLogin from './components/AdminLogin.jsx'
import AdminProtectedRoute from './components/AdminProtectedRoute.jsx'

function AppLayout() {
  const location = useLocation()
  const hideNavbar = location.pathname.startsWith('/admin')

  return (
    <div className="main-layout">
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? 'container-fluid py-4' : 'container py-4'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminPanel />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
