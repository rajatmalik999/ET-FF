import { Link } from 'react-router-dom'

function Home() {
    return (
        <div className="text-center text-white">
            <div className="py-5 mt-5">
                <h1 className="display-3 fw-bold mb-3">
                    Invest in the <span className="text-gradient">Future of Money</span>
                </h1>
                <p className="lead text-white-50 mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                    Secure your financial freedom with our premier Crypto & Forex mutual funds.
                    Expertly managed portfolios delivering consistent returns.
                </p>
                <div className="d-flex justify-content-center gap-3">
                    <Link to="/signup" className="btn btn-primary btn-lg px-5">
                        Start Investing
                    </Link>
                    <Link to="/login" className="btn btn-outline-light btn-lg px-5">
                        Login
                    </Link>
                </div>
            </div>

            <div className="row mt-5 pt-5 text-start">
                <div className="col-md-4 mb-4">
                    <div className="auth-card h-100 p-4">
                        <h3>🚀 High Growth</h3>
                        <p className="text-white-50">Exposure to top-tier cryptocurrencies including Bitcoin, Ethereum, and Solana.</p>
                    </div>
                </div>
                <div className="col-md-4 mb-4">
                    <div className="auth-card h-100 p-4">
                        <h3>💱 Forex Stability</h3>
                        <p className="text-white-50">Hedged positions in major currency pairs (EUR/USD, GBP/JPY) to minimize risk.</p>
                    </div>
                </div>
                <div className="col-md-4 mb-4">
                    <div className="auth-card h-100 p-4">
                        <h3>🛡️ Secure Storage</h3>
                        <p className="text-white-50">Assets held in institutional-grade cold storage with full insurance coverage.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home
