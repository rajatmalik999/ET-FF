import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://localhost:5000'

function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      navigate('/admin')
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('Signing in as admin...')

    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Invalid admin credentials')
      }

      localStorage.setItem('adminToken', data.token)
      navigate('/admin')
    } catch (error) {
      setStatus(error.message || 'Unable to login')
    }
  }

  return (
    <div className="container">
      <div className="row vh-100 justify-content-center align-items-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="auth-card p-4">
            <h3 className="text-white mb-3 text-center">Admin Login</h3>
            <p className="text-white-50 small mb-3 text-center">
              Demo ID: <strong>admin@demo.com</strong> | Password: <strong>Admin@123</strong>
            </p>
            <form onSubmit={handleSubmit}>
              <input
                className="form-control mb-2"
                type="email"
                placeholder="Admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="form-control mb-3"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button className="btn btn-primary w-100" type="submit">
                Login as Admin
              </button>
            </form>z
            {status && <div className="alert alert-info mt-3 mb-0">{status}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
