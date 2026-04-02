'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  role: 'admin' | 'operator'
  full_name: string | null
  created_at: string
  last_sign_in_at: string | null
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'operator'>('operator')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  
  // Form state
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserFullName, setNewUserFullName] = useState('')
  const [newUserRole, setNewUserRole] = useState<'admin' | 'operator'>('operator')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [addingUser, setAddingUser] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    fetchUsers()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      // Only admins can access user management
      router.push('/dashboard')
      return
    }
    
    setUserRole('admin')
  }

  const fetchUsers = async () => {
    setLoading(true)
    
    // Get all users from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching users:', authError)
      setLoading(false)
      return
    }
    
    // Get user profiles
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
    
    const usersList: User[] = (authUsers?.users || []).map((authUser: any) => {
      const profile = profiles?.find(p => p.id === authUser.id)
      return {
        id: authUser.id,
        email: authUser.email || '',
        role: profile?.role || 'operator',
        full_name: profile?.full_name || null,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at
      }
    })
    
    setUsers(usersList)
    setLoading(false)
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingUser(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
        user_metadata: {
          full_name: newUserFullName
        }
      })
      
      if (authError) throw authError
      
      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            role: newUserRole,
            full_name: newUserFullName
          })
        
        if (profileError) throw profileError
        
        setSuccess(`User ${newUserEmail} created successfully!`)
        setNewUserEmail('')
        setNewUserFullName('')
        setNewUserPassword('')
        setNewUserRole('operator')
        setShowAddModal(false)
        fetchUsers() // Refresh list
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create user')
    } finally {
      setAddingUser(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return
    
    setResettingPassword(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Reset password using admin API
      const { error } = await supabase.auth.admin.updateUserById(
        selectedUserId,
        { password: resetPassword }
      )
      
      if (error) throw error
      
      setSuccess('Password reset successfully!')
      setResetPassword('')
      setShowResetModal(false)
      setSelectedUserId(null)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete ${userEmail}? This action cannot be undone.`)) {
      return
    }
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      
      if (error) throw error
      
      // Also delete from user_profiles (cascade will handle, but we do manually)
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId)
      
      setSuccess(`User ${userEmail} deleted successfully!`)
      fetchUsers() // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to delete user')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage system users and permissions</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Add New User
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <span className="text-2xl mr-3">❌</span>
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <p className="font-medium text-green-800">Success</p>
                <p className="text-green-600 text-sm mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-gray-700 font-medium">No users found</p>
              <p className="text-gray-500 text-sm mt-2">Add your first user to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">User</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">Role</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">Created</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">Last Sign In</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{user.full_name || user.email}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(user.last_sign_in_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUserId(user.id)
                              setShowResetModal(true)
                            }}
                            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                          >
                            Reset Password
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="font-semibold text-blue-800 mb-2">💡 About User Management</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Admins</strong> have full system access and can manage users</li>
            <li>• <strong>Operators</strong> can add entries, manage customers, and generate reports</li>
            <li>• New users will receive a welcome email with setup instructions</li>
            <li>• Passwords can be reset by admin at any time</li>
          </ul>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'operator')}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800 bg-white"
                  >
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {newUserRole === 'admin' ? 'Full system access' : 'Data entry and reporting only'}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={addingUser}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser || !newUserEmail || !newUserPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reset Password</h2>
            <form onSubmit={handleResetPassword}>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  New Password *
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-800"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false)
                    setSelectedUserId(null)
                    setResetPassword('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={resettingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword || !resetPassword}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resettingPassword ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}