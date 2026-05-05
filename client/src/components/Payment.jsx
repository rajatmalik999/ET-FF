import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Payment() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!state?.fund || !state?.units || !state?.amount) {
        return (
            <div className="container text-center text-white py-5">
                <p>No order details found.</p>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const { fund, units, amount } = state;

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    fundId: fund.id,
                    fundName: fund.name,
                    fundSymbol: fund.symbol,
                    nav: fund.nav,
                    units,
                    amount: parseFloat(amount),
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Payment failed');
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="auth-card p-4">
                        <h4 className="text-white mb-4">Payment</h4>

                        <div className="mb-4 p-3 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <p className="text-white-50 small mb-1">Order Summary</p>
                            <p className="text-white mb-1">{fund.name} ({fund.symbol})</p>
                            <p className="text-white mb-0">{units} units × ${fund.nav.toFixed(2)} = <strong>${amount}</strong></p>
                        </div>

                        <form onSubmit={handlePaymentSubmit}>
                            <div className="mb-3">
                                <label className="form-label text-white">Card Number</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="4242 4242 4242 4242"
                                    maxLength="19"
                                />
                            </div>
                            <div className="row mb-3">
                                <div className="col-6">
                                    <label className="form-label text-white">Expiry</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="MM/YY"
                                        maxLength="5"
                                    />
                                </div>
                                <div className="col-6">
                                    <label className="form-label text-white">CVV</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="123"
                                        maxLength="4"
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="form-label text-white">Name on Card</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="John Doe"
                                />
                            </div>
                            {error && (
                                <div className="alert alert-danger small mb-3">{error}</div>
                            )}
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Processing...' : `Pay $${amount}`}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-light"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Payment;
