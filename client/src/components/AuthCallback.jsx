import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const userId = searchParams.get('userId')
    const error = searchParams.get('error')

    if (error) {
      navigate('/login?error=auth_failed', { replace: true })
      return
    }

    if (token) {
      localStorage.setItem('authToken', token)
      if (userId) localStorage.setItem('userId', userId)
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate])

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Completing sign in...</p>
      </div>
    </div>
  )
}

export default AuthCallback
