import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const API_BASE = 'http://localhost:5000';

function Dashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('funds');
    const [buyFund, setBuyFund] = useState(null);
    const [units, setUnits] = useState('');
    const [message, setMessage] = useState('');
    const [funds, setFunds] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [orders, setOrders] = useState([]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return {
            Authorization: `Bearer ${token || ''}`,
        };
    };

    const fetchFunds = async () => {
        const response = await fetch(`${API_BASE}/api/funds`);
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
            setFunds(data);
            return true;
        }
        return false;
    };

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [fundsRes, portfolioRes, ordersRes] = await Promise.all([
                    fetch(`${API_BASE}/api/funds`),
                    fetch(`${API_BASE}/api/portfolio/assets`, {
                        headers: getAuthHeaders(),
                    }),
                    fetch(`${API_BASE}/api/orders`, {
                        headers: getAuthHeaders(),
                    }),
                ]);

                const [fundsData, portfolioData, ordersData] = await Promise.all([
                    fundsRes.json(),
                    portfolioRes.json(),
                    ordersRes.json(),
                ]);

                if (fundsRes.ok && Array.isArray(fundsData)) {
                    setFunds(fundsData);
                }
                if (portfolioRes.ok && Array.isArray(portfolioData)) {
                    setPortfolio(portfolioData);
                }
                if (ordersRes.ok && Array.isArray(ordersData)) {
                    setOrders(ordersData);
                }

                if (!fundsRes.ok || !portfolioRes.ok || !ordersRes.ok) {
                    setMessage('Some dashboard data could not be loaded.');
                }
            } catch (error) {
                setMessage('Unable to load dashboard data right now.');
            }
        };

        loadDashboardData();
    }, []);

    useEffect(() => {
        const syncFunds = async () => {
            try {
                await fetchFunds();
            } catch (error) {
                // Silent sync failure; initial fetch already handles messaging.
            }
        };

        syncFunds();
        const intervalId = setInterval(syncFunds, 15000);
        return () => clearInterval(intervalId);
    }, []);

    const handleBuyClick = (fund) => {
        setBuyFund(fund);
        setUnits('');
        setMessage('');
    };

    const handleBuySubmit = (e) => {
        e.preventDefault();
        const num = parseFloat(units);
        if (!num || num <= 0) {
            setMessage('Enter a valid number of units.');
            return;
        }
        const amount = (num * buyFund.nav).toFixed(2);
        navigate('/payment', {
            state: { fund: buyFund, units: num, amount },
        });
    };

    return (
        <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-4 text-white">
                <h2>Dashboard</h2>
            </div>

            <div className="mb-4 d-flex gap-2 flex-wrap">
                <button
                    type="button"
                    className={`btn ${activeTab === 'funds' ? 'btn-primary' : 'btn-outline-light'}`}
                    onClick={() => setActiveTab('funds')}
                >
                    Funds
                </button>
                <button
                    type="button"
                    className={`btn ${activeTab === 'portfolio' ? 'btn-primary' : 'btn-outline-light'}`}
                    onClick={() => setActiveTab('portfolio')}
                >
                    My Portfolio
                </button>
                <button
                    type="button"
                    className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline-light'}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Orders
                </button>
            </div>

            {message && <div className="alert alert-info">{message}</div>}

            {activeTab === 'funds' && (
                <div className="row g-4">
                    {funds.map((fund) => (
                        <div key={fund.id} className="col-md-6 col-lg-4">
                            <div className="auth-card p-4 h-100 d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 className="mb-1 text-white">{fund.name}</h5>
                                        <span className="badge bg-primary">{fund.symbol}</span>
                                    </div>
                                    <span className={`small ${(fund.change1D || '').startsWith('+') ? 'text-success' : 'text-danger'}`}>
                                        {fund.change1D || '0.00%'}
                                    </span>
                                </div>
                                <p className="text-white-50 small mb-3">{fund.description || 'No description'}</p>

                                <div className="mb-3">
                                    <span className="text-white-50 small">NAV</span>
                                    <p className="h4 mb-0 text-white">${Number(fund.nav || 0).toFixed(2)}</p>
                                    <span className="text-white-50 small">as of {fund.navDate}</span>
                                </div>

                                <div className="mb-3">
                                    <span className="text-white-50 small d-block mb-2">Fund Holdings</span>
                                    <ul className="list-unstyled mb-0">
                                        {(fund.holdings || []).map((h, i) => (
                                            <li key={i} className="d-flex justify-content-between py-1 text-white">
                                                <span>{h.name}</span>
                                                <span className="text-white-50">{h.allocation}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-primary mt-auto"
                                    onClick={() => handleBuyClick(fund)}
                                >
                                    Buy
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'portfolio' && (
                <div className="auth-card p-4 dashboard-panel-card">
                    <h4 className="text-white mb-3">My Portfolio</h4>
                    {!portfolio.length ? (
                        <p className="text-white-50 mb-0">No portfolio holdings yet.</p>
                    ) : (
                        <div className="table-responsive dashboard-table-wrap">
                            <table className="table table-dark table-striped align-middle mb-0 dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Fund</th>
                                        <th>Symbol</th>
                                        <th>Units</th>
                                        <th>Invested</th>
                                        <th>Avg NAV</th>
                                        <th>Current NAV</th>
                                        <th>Current Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.map((item) => {
                                        const matchedFund = funds.find(
                                            (fund) => fund.id === item.fundId || fund.symbol === item.symbol
                                        );
                                        const currentNav = Number(matchedFund?.nav ?? item.averageNav ?? 0);
                                        const units = Number(item.units || 0);
                                        const currentValue = units * currentNav;

                                        return (
                                            <tr key={item.fundId}>
                                                <td>{item.name}</td>
                                                <td>{item.symbol}</td>
                                                <td>{units.toFixed(2)}</td>
                                                <td>${Number(item.investedAmount || 0).toFixed(2)}</td>
                                                <td>${Number(item.averageNav || 0).toFixed(2)}</td>
                                                <td>${currentNav.toFixed(2)}</td>
                                                <td>${currentValue.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="auth-card p-4 dashboard-panel-card">
                    <h4 className="text-white mb-3">Orders</h4>
                    {!orders.length ? (
                        <p className="text-white-50 mb-0">No orders yet.</p>
                    ) : (
                        <div className="table-responsive dashboard-table-wrap">
                            <table className="table table-dark table-striped align-middle mb-0 dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Fund</th>
                                        <th>Symbol</th>
                                        <th>Units</th>
                                        <th>NAV</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order._id}>
                                            <td>{order.fundName}</td>
                                            <td>{order.fundSymbol}</td>
                                            <td>{Number(order.units || 0).toFixed(2)}</td>
                                            <td>${Number(order.navAtPurchase || 0).toFixed(2)}</td>
                                            <td>${Number(order.amount || 0).toFixed(2)}</td>
                                            <td>
                                                <span className={`badge ${order.status === 'completed' ? 'bg-success' : 'bg-secondary'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {buyFund && (
                <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content auth-card border-0">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title text-white">Buy {buyFund.name}</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    aria-label="Close"
                                    onClick={() => setBuyFund(null)}
                                />
                            </div>
                            <div className="modal-body">
                                <p className="text-white-50 mb-2">NAV: ${Number(buyFund.nav || 0).toFixed(2)} per unit</p>
                                <form onSubmit={handleBuySubmit}>
                                    <label className="form-label text-white">Units</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        className="form-control mb-3"
                                        placeholder="0.00"
                                        value={units}
                                        onChange={(e) => setUnits(e.target.value)}
                                    />
                                    {units && parseFloat(units) > 0 && (
                                        <p className="text-white small mb-3">
                                            Total: ${(parseFloat(units) * buyFund.nav).toFixed(2)}
                                        </p>
                                    )}
                                    {message && (
                                        <div className="alert alert-info small mb-3">{message}</div>
                                    )}
                                    <button type="submit" className="btn btn-primary me-2">
                                        Confirm
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-light"
                                        onClick={() => setBuyFund(null)}
                                    >
                                        Cancel
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
