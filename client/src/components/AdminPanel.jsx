import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://localhost:5000'

function AdminPanel() {
  const navigate = useNavigate()
  const [funds, setFunds] = useState([])
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState('')

  const [newFund, setNewFund] = useState({
    name: '',
    symbol: '',
    nav: '',
    navDate: '',
    change1D: '',
    description: '',
  })

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    countryCode: '+91',
    contact: '',
  })
  const [fundUpdates, setFundUpdates] = useState({})
  const [userEdits, setUserEdits] = useState({})
  const [activeSection, setActiveSection] = useState('create-fund')

  const getAdminHeaders = () => {
    const token = localStorage.getItem('adminToken')
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    }
  }

  const navSummary = useMemo(() => {
    if (!funds.length) {
      return { averageNav: '0.00', count: 0 }
    }
    const total = funds.reduce((acc, fund) => acc + Number(fund.nav || 0), 0)
    return {
      averageNav: (total / funds.length).toFixed(2),
      count: funds.length,
    }
  }, [funds])

  const fetchData = async () => {
    try {
      const [fundsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/funds`),
        fetch(`${API_BASE}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
          },
        }),
      ])
      const [fundsData, usersData] = await Promise.all([
        fundsRes.json(),
        usersRes.json(),
      ])

      setFunds(Array.isArray(fundsData) ? fundsData : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      setStatus('Failed to load admin data.')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleFundCreate = async (event) => {
    event.preventDefault()
    setStatus('Creating fund...')
    try {
      const response = await fetch(`${API_BASE}/api/funds`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          ...newFund,
          nav: Number(newFund.nav),
        }),
      })
      const created = await response.json()
      if (!response.ok) throw new Error(created.message || 'Failed to create fund')

      setFunds((prev) => [...prev, created])
      setNewFund({
        name: '',
        symbol: '',
        nav: '',
        navDate: '',
        change1D: '',
        description: '',
      })
      setStatus('Fund created successfully.')
    } catch (error) {
      setStatus(error.message || 'Unable to create fund.')
    }
  }

  const handleNavUpdate = async (fundId, nav) => {
    if (!nav) return
    setStatus('Updating NAV...')
    try {
      const response = await fetch(`${API_BASE}/api/funds/${fundId}/nav`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({ nav: Number(nav) }),
      })
      const updated = await response.json()
      if (!response.ok) throw new Error(updated.message || 'Failed to update NAV')

      setFunds((prev) => prev.map((fund) => (fund.id === fundId ? updated : fund)))
      setStatus('NAV updated.')
    } catch (error) {
      setStatus(error.message || 'Unable to update NAV.')
    }
  }

  const handleFundFieldUpdate = async (fundId) => {
    const update = fundUpdates[fundId]
    if (!update) return
    if (!update.nav && !update.change1D) return

    setStatus('Updating fund...')
    try {
      const response = await fetch(`${API_BASE}/api/funds/${fundId}/nav`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          nav: Number(update.nav),
          change1D: update.change1D,
        }),
      })
      const updated = await response.json()
      if (!response.ok) throw new Error(updated.message || 'Failed to update fund')

      setFunds((prev) => prev.map((fund) => (fund.id === fundId ? updated : fund)))
      setFundUpdates((prev) => ({
        ...prev,
        [fundId]: { nav: '', change1D: '' },
      }))
      setStatus('Fund updated successfully.')
    } catch (error) {
      setStatus(error.message || 'Unable to update fund.')
    }
  }

  const handleDeleteFund = async (fundId) => {
    const confirmed = window.confirm('Are you sure you want to delete this fund?')
    if (!confirmed) return
    setStatus('Deleting fund...')
    try {
      const response = await fetch(`${API_BASE}/api/funds/${fundId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      })
      if (!response.ok) throw new Error('Failed to delete fund')
      setFunds((prev) => prev.filter((fund) => fund.id !== fundId))
      setStatus('Fund deleted.')
    } catch (error) {
      setStatus(error.message || 'Unable to delete fund.')
    }
  }

  const handleUserCreate = async (event) => {
    event.preventDefault()
    setStatus('Creating user...')
    try {
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(newUser),
      })
      const created = await response.json()
      if (!response.ok) throw new Error(created.message || 'Failed to create user')

      setUsers((prev) => [created, ...prev])
      setNewUser({
        name: '',
        email: '',
        password: '',
        countryCode: '+91',
        contact: '',
      })
      setStatus('User created successfully.')
    } catch (error) {
      setStatus(error.message || 'Unable to create user.')
    }
  }

  const handleDeleteUser = async (userId) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?')
    if (!confirmed) return
    setStatus('Deleting user...')
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      })
      if (!response.ok) throw new Error('Failed to delete user')
      setUsers((prev) => prev.filter((user) => user._id !== userId))
      setStatus('User deleted.')
    } catch (error) {
      setStatus(error.message || 'Unable to delete user.')
    }
  }

  const handleUserEditChange = (userId, field, value) => {
    setUserEdits((prev) => {
      const current = prev[userId] || users.find((u) => u._id === userId) || {}
      return {
        ...prev,
        [userId]: {
          name: current.name || '',
          email: current.email || '',
          countryCode: current.countryCode || '+91',
          contact: current.contact || '',
          password: prev[userId]?.password || '',
          ...prev[userId],
          [field]: value,
        },
      }
    })
  }

  const handleSaveUser = async (userId) => {
    if (!userEdits[userId]) return
    const payload = { ...userEdits[userId] }
    if (!payload.password || !payload.password.trim()) {
      delete payload.password
    }

    setStatus('Updating user...')
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      })
      const updated = await response.json()
      if (!response.ok) throw new Error(updated.message || 'Failed to update user')

      setUsers((prev) => prev.map((user) => (user._id === userId ? updated : user)))
      setUserEdits((prev) => ({
        ...prev,
        [userId]: { ...(prev[userId] || {}), password: '' },
      }))
      setStatus('User updated successfully.')
    } catch (error) {
      setStatus(error.message || 'Unable to update user.')
    }
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin-login')
  }

  return (
    <div className="container text-white">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Admin Panel</h2>
        <button type="button" className="btn btn-outline-light btn-sm" onClick={handleAdminLogout}>
          Logout
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="auth-card p-4 h-100">
            <h5>Total Funds</h5>
            <p className="display-6 mb-0">{navSummary.count}</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="auth-card p-4 h-100">
            <h5>Average NAV</h5>
            <p className="display-6 mb-0">${navSummary.averageNav}</p>
          </div>
        </div>
      </div>

      {status && <div className="alert alert-info">{status}</div>}

      <div className="mb-4 d-flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn ${activeSection === 'create-fund' ? 'btn-primary' : 'btn-outline-light'}`}
          onClick={() => setActiveSection('create-fund')}
        >
          Create Fund
        </button>
        <button
          type="button"
          className={`btn ${activeSection === 'manage-nav' ? 'btn-primary' : 'btn-outline-light'}`}
          onClick={() => setActiveSection('manage-nav')}
        >
          Manage NAV
        </button>
        <button
          type="button"
          className={`btn ${activeSection === 'create-user' ? 'btn-primary' : 'btn-outline-light'}`}
          onClick={() => setActiveSection('create-user')}
        >
          Create User
        </button>
        <button
          type="button"
          className={`btn ${activeSection === 'user-data' ? 'btn-primary' : 'btn-outline-light'}`}
          onClick={() => setActiveSection('user-data')}
        >
          User Data
        </button>
      </div>

      {activeSection === 'create-fund' && (
        <div className="auth-card p-4">
            <h4>Create Fund</h4>
            <form onSubmit={handleFundCreate}>
              <input className="form-control mb-2" placeholder="Fund Name" value={newFund.name} onChange={(e) => setNewFund((prev) => ({ ...prev, name: e.target.value }))} required />
              <input className="form-control mb-2" placeholder="Symbol" value={newFund.symbol} onChange={(e) => setNewFund((prev) => ({ ...prev, symbol: e.target.value }))} required />
              <input className="form-control mb-2" type="number" step="0.01" placeholder="NAV" value={newFund.nav} onChange={(e) => setNewFund((prev) => ({ ...prev, nav: e.target.value }))} required />
              <input className="form-control mb-2" type="date" value={newFund.navDate} onChange={(e) => setNewFund((prev) => ({ ...prev, navDate: e.target.value }))} />
              <input className="form-control mb-2" placeholder="1D Change (+1.23%)" value={newFund.change1D} onChange={(e) => setNewFund((prev) => ({ ...prev, change1D: e.target.value }))} />
              <textarea className="form-control mb-3" placeholder="Description" value={newFund.description} onChange={(e) => setNewFund((prev) => ({ ...prev, description: e.target.value }))} />
              <button className="btn btn-primary w-100" type="submit">Create Fund</button>
            </form>
        </div>
      )}

      {activeSection === 'manage-nav' && (
        <div className="auth-card p-4">
            <h4>Manage NAV</h4>
            {funds.map((fund) => (
              <div key={fund.id} className="border rounded p-3 mb-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>{fund.name}</strong>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteFund(fund.id)}>Delete</button>
                </div>
                <p className="small mb-2">Current NAV: ${Number(fund.nav || 0).toFixed(2)}</p>
                <p className="small mb-2">Current 1D Change: {fund.change1D || '0.00%'}</p>
                <input
                  className="form-control mb-2"
                  type="number"
                  step="0.01"
                  placeholder="Enter new NAV"
                  value={fundUpdates[fund.id]?.nav || ''}
                  onChange={(event) =>
                    setFundUpdates((prev) => ({
                      ...prev,
                      [fund.id]: { ...prev[fund.id], nav: event.target.value },
                    }))
                  }
                />
                <input
                  className="form-control mb-2"
                  placeholder="Enter new 1D Change (e.g. +1.20%)"
                  value={fundUpdates[fund.id]?.change1D || ''}
                  onChange={(event) =>
                    setFundUpdates((prev) => ({
                      ...prev,
                      [fund.id]: { ...prev[fund.id], change1D: event.target.value },
                    }))
                  }
                />
                <button className="btn btn-sm btn-primary" onClick={() => handleFundFieldUpdate(fund.id)}>
                  Save NAV & 1D Change
                </button>
              </div>
            ))}
        </div>
      )}

      {activeSection === 'create-user' && (
        <div className="auth-card p-4">
          <h4>Create User</h4>
          <form onSubmit={handleUserCreate}>
            <input className="form-control mb-2" placeholder="Name" value={newUser.name} onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))} required />
            <input className="form-control mb-2" type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))} required />
            <input className="form-control mb-2" type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))} required />
            <input className="form-control mb-2" placeholder="Country Code" value={newUser.countryCode} onChange={(e) => setNewUser((prev) => ({ ...prev, countryCode: e.target.value }))} />
            <input className="form-control mb-3" placeholder="Contact" value={newUser.contact} onChange={(e) => setNewUser((prev) => ({ ...prev, contact: e.target.value }))} />
            <button className="btn btn-primary w-100" type="submit">Create User</button>
          </form>
        </div>
      )}

      {activeSection === 'user-data' && (
        <div className="auth-card p-4">
            <h4>Users Data</h4>
            {users.map((user) => (
              <div key={user._id} className="border rounded p-3 mb-2">
                <div>
                  <input
                    className="form-control mb-2"
                    placeholder="Name"
                    value={userEdits[user._id]?.name ?? user.name ?? ''}
                    onChange={(e) => handleUserEditChange(user._id, 'name', e.target.value)}
                  />
                  <input
                    className="form-control mb-2"
                    type="email"
                    placeholder="Email"
                    value={userEdits[user._id]?.email ?? user.email ?? ''}
                    onChange={(e) => handleUserEditChange(user._id, 'email', e.target.value)}
                  />
                  <div className="row g-2">
                    <div className="col-4">
                      <input
                        className="form-control"
                        placeholder="Code"
                        value={userEdits[user._id]?.countryCode ?? user.countryCode ?? '+91'}
                        onChange={(e) => handleUserEditChange(user._id, 'countryCode', e.target.value)}
                      />
                    </div>
                    <div className="col-8">
                      <input
                        className="form-control"
                        placeholder="Contact"
                        value={userEdits[user._id]?.contact ?? user.contact ?? ''}
                        onChange={(e) => handleUserEditChange(user._id, 'contact', e.target.value)}
                      />
                    </div>
                  </div>
                  <input
                    className="form-control mt-2"
                    type="password"
                    placeholder="New password (optional)"
                    value={userEdits[user._id]?.password ?? ''}
                    onChange={(e) => handleUserEditChange(user._id, 'password', e.target.value)}
                  />
                </div>
                <div className="d-flex gap-2 mt-3">
                  <button className="btn btn-sm btn-primary" onClick={() => handleSaveUser(user._id)}>Save</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUser(user._id)}>Delete</button>
                </div>
              </div>
            ))}
            {!users.length && <p className="text-white-50 mb-0">No users found.</p>}
        </div>
      )}
    </div>
  )
}

export default AdminPanel
