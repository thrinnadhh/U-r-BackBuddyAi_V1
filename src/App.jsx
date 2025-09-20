import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [users, setUsers] = useState([])
  const [newUser, setNewUser] = useState({ name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch initial data from backend
  useEffect(() => {
    fetchMessage()
    fetchUsers()
  }, [])

  const fetchMessage = async () => {
    try {
      const response = await fetch('/api/message')
      const data = await response.json()
      setMessage(data.message)
    } catch (err) {
      setError('Failed to fetch message from server')
      console.error('Error fetching message:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError('Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const addUser = async (e) => {
    e.preventDefault()
    if (!newUser.name || !newUser.email) {
      setError('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })
      
      if (response.ok) {
        const user = await response.json()
        setUsers([...users, user])
        setNewUser({ name: '', email: '' })
        setError('')
      } else {
        setError('Failed to add user')
      }
    } catch (err) {
      setError('Failed to add user')
      console.error('Error adding user:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== id))
      } else {
        setError('Failed to delete user')
      }
    } catch (err) {
      setError('Failed to delete user')
      console.error('Error deleting user:', err)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Full-Stack Application</h1>
        <p className="server-message">{message || 'Connecting to server...'}</p>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError('')} className="close-btn">×</button>
          </div>
        )}

        <section className="user-form-section">
          <h2>Add New User</h2>
          <form onSubmit={addUser} className="user-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="form-input"
              />
            </div>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Adding...' : 'Add User'}
            </button>
          </form>
        </section>

        <section className="users-section">
          <h2>Users ({users.length})</h2>
          {loading && users.length === 0 ? (
            <div className="loading">Loading users...</div>
          ) : (
            <div className="users-grid">
              {users.map((user) => (
                <div key={user.id} className="user-card">
                  <div className="user-info">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    <small>Added: {new Date(user.createdAt).toLocaleDateString()}</small>
                  </div>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="delete-btn"
                    title="Delete user"
                  >
                    🗑️
                  </button>
                </div>
              ))}
              {users.length === 0 && !loading && (
                <div className="empty-state">
                  <p>No users yet. Add your first user above!</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App