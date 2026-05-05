import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import GoogleAuthButton from './GoogleAuthButton.jsx'

function LoginForm() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [status, setStatus] = useState(null)
    const [isForgotPassword, setIsForgotPassword] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [forgotData, setForgotData] = useState({
        email: '',
        otp: '',
        newPassword: '',
        confirmPassword: '',
    })
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const error = searchParams.get('error')
        if (error === 'auth_failed') {
            setStatus('Google sign-in failed. Please try again.')
        } else if (error === 'google_not_configured') {
            setStatus('Google sign-in is not configured. Please use email and password.')
        }
    }, [searchParams])

    const handleChange = (event) => {
        const { name, value } = event.target
        setFormData((prev) => ({ ...prev, [name]: value }))
        if (status) setStatus(null)
    }

    const handleLoginSubmit = async (event) => {
        event.preventDefault()
        setStatus('Logging in...')
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            const data = await response.json()
            if (response.ok) {
                // Store token for authenticated routes
                if (data.token) {
                    localStorage.setItem('authToken', data.token)
                }
                if (data.userId) {
                    localStorage.setItem('userId', data.userId)
                }
                navigate('/dashboard')
            } else {
                setStatus(data.message || 'Invalid credentials. Please try again.')
            }
        } catch (error) {
            console.error('Error during login:', error)
            setStatus('An error occurred. Please try again later.')
        }
    }

    const handleSendOtp = async (event) => {
        event.preventDefault()
        setStatus('Sending OTP...')
        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: forgotData.email })
            })
            const data = await response.json()
            if (response.ok) {
                setOtpSent(true)
                setStatus(data.message || 'OTP sent successfully.')
            } else {
                setStatus(data.message || 'Unable to send OTP.')
            }
        } catch (error) {
            console.error('Error while sending OTP:', error)
            setStatus('An error occurred. Please try again later.')
        }
    }

    const handleForgotPasswordSubmit = async (event) => {
        event.preventDefault()
        if (forgotData.newPassword !== forgotData.confirmPassword) {
            setStatus('New password and confirm password do not match.')
            return
        }
        setStatus('Resetting password...')
        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(forgotData)
            })
            const data = await response.json()
            if (response.ok) {
                setStatus(data.message || 'Password reset successful. Please login.')
                setIsForgotPassword(false)
                setOtpSent(false)
                setFormData((prev) => ({ ...prev, email: forgotData.email, password: '' }))
                setForgotData({ email: '', otp: '', newPassword: '', confirmPassword: '' })
            } else {
                setStatus(data.message || 'Unable to reset password.')
            }
        } catch (error) {
            console.error('Error during password reset:', error)
            setStatus('An error occurred. Please try again later.')
        }
    }

    return (
        <div className="container">
            <div className="row vh-100 justify-content-center align-items-center">
                <div className="col-12 col-md-8 col-lg-6 col-xl-5">
                    <div className="auth-card">
                        <div className="card-body">
                            <h3 className="card-title text-center mb-4">{isForgotPassword ? 'Forgot Password' : 'Login'}</h3>
                            {isForgotPassword ? (
                                <form onSubmit={otpSent ? handleForgotPasswordSubmit : handleSendOtp} className="needs-validation" noValidate>
                                    <div className="mb-3">
                                        <label htmlFor="forgotEmail" className="form-label">Registered Email</label>
                                        <input
                                            id="forgotEmail"
                                            name="email"
                                            type="email"
                                            className="form-control"
                                            placeholder="you@example.com"
                                            value={forgotData.email}
                                            onChange={(event) =>
                                                setForgotData((prev) => ({ ...prev, email: event.target.value }))
                                            }
                                            required
                                        />
                                    </div>

                                    {otpSent && (
                                        <>
                                            <div className="mb-3">
                                                <label htmlFor="otp" className="form-label">OTP</label>
                                                <input
                                                    id="otp"
                                                    name="otp"
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Enter OTP"
                                                    value={forgotData.otp}
                                                    onChange={(event) =>
                                                        setForgotData((prev) => ({ ...prev, otp: event.target.value }))
                                                    }
                                                    required
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <label htmlFor="newPassword" className="form-label">New Password</label>
                                                <input
                                                    id="newPassword"
                                                    name="newPassword"
                                                    type="password"
                                                    className="form-control"
                                                    placeholder="Enter new password"
                                                    value={forgotData.newPassword}
                                                    onChange={(event) =>
                                                        setForgotData((prev) => ({ ...prev, newPassword: event.target.value }))
                                                    }
                                                    required
                                                    minLength={6}
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                                                <input
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    type="password"
                                                    className="form-control"
                                                    placeholder="Confirm new password"
                                                    value={forgotData.confirmPassword}
                                                    onChange={(event) =>
                                                        setForgotData((prev) => ({ ...prev, confirmPassword: event.target.value }))
                                                    }
                                                    required
                                                    minLength={6}
                                                />
                                            </div>
                                        </>
                                    )}

                                    <button type="submit" className="btn btn-primary w-100">
                                        {otpSent ? 'Verify OTP & Reset Password' : 'Send OTP'}
                                    </button>
                                    {otpSent && (
                                        <button
                                            type="button"
                                            className="btn btn-link w-100 mt-2 text-white-50 text-decoration-none"
                                            onClick={() => setOtpSent(false)}
                                        >
                                            Change email / Resend OTP
                                        </button>
                                    )}
                                </form>
                            ) : (
                                <form onSubmit={handleLoginSubmit} className="needs-validation" noValidate>
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

                                    <div className="mb-2">
                                        <label htmlFor="password" className="form-label">Password</label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            className="form-control"
                                            placeholder="Enter your password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="text-end mb-3">
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 text-white-50 text-decoration-none"
                                            onClick={() => {
                                                setIsForgotPassword(true)
                                                setOtpSent(false)
                                                setStatus(null)
                                                setForgotData((prev) => ({ ...prev, email: formData.email, otp: '', newPassword: '', confirmPassword: '' }))
                                            }}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>

                                    <button type="submit" className="btn btn-primary w-100">
                                        Login
                                    </button>
                                    <div className="my-3 text-center text-muted small">— or —</div>
                                    <GoogleAuthButton label="Login with Google" />
                                </form>
                            )}
                            <div className="text-center mt-3">
                                {isForgotPassword ? (
                                    <p>
                                        Remembered your password?{' '}
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 align-baseline"
                                            onClick={() => {
                                                setIsForgotPassword(false)
                                                setOtpSent(false)
                                                setStatus(null)
                                            }}
                                        >
                                            Back to login
                                        </button>
                                    </p>
                                ) : (
                                    <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
                                )}
                            </div>

                            {status && (
                                <div className={`alert ${status.includes('Invalid') || status.includes('failed') || status.includes('not configured') ? 'alert-danger' : 'alert-info'} mt-3 mb-0`} role="alert">
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

export default LoginForm
