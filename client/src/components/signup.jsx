import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { countryCodes } from '../data/countries'
import GoogleAuthButton from './GoogleAuthButton.jsx'

function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    countryCode: countryCodes[0]?.code || '',
    contact: '',
    email: '',
    password: '',
    gender: '',
  })
  const [status, setStatus] = useState(null)
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (status) setStatus(null)
  }

  const handleSignupSubmit = async (event) => {
    event.preventDefault()
    setStatus('Submitting...')
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (response.ok) {
        setStatus('Signup successful! Redirecting to login...')
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      } else {
        setStatus(data.message || 'Signup failed. Please try again.')
      }
    } catch (error) {
      console.error('Error during signup:', error)
      setStatus('An error occurred. Please try again later.')
    }
  }

  return (
    <div className="container">
      <div className="row vh-100 justify-content-center align-items-center">
        <div className="col-12 col-md-8 col-lg-6 col-xl-5">
          <div className="auth-card">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">Create Account</h3>
              <form onSubmit={handleSignupSubmit} className="needs-validation" noValidate>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="form-control"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="contact" className="form-label">Contact Number</label>
                  <div className="input-group">
                    <select
                      className="form-select"
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      style={{ maxWidth: '120px' }}
                    >
                      {countryCodes.map((c) => (
                        <option key={c.code + c.country} value={c.code}>
                          {c.code} ({c.country})
                        </option>
                      ))}
                    </select>
                    <input
                      id="contact"
                      name="contact"
                      type="tel"
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={formData.contact}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="form-control"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Sign Up
                </button>
                <div className="my-3 text-center text-muted small">— or —</div>
                <GoogleAuthButton label="Sign up with Google" />
              </form>
              <div className="text-center mt-3">
                <p>Already have an account? <Link to="/">Login</Link></p>
              </div>

              {status && (
                <div className="alert alert-info mt-3 mb-0" role="alert">
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupForm