import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Shield, UserCog, Check, X, Plus, Users as UsersIcon, Trash2, Pencil } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface User {
  id: string
  username: string
  full_name: string
  role: string
  active: boolean
  permissions: string[]
}

interface Permission {
  id: string
  name: string
  description: string
}

interface UserForm {
  username: string
  full_name: string
  password: string
  role: 'admin' | 'customer'
  permissions: string[]
}

const initialUserForm: UserForm = {
  username: '',
  full_name: '',
  password: '',
  role: 'customer',
  permissions: []
}

// Mapeamento de permissões para português
const permissionTranslations: Record<string, string> = {
  'view_products': 'Visualizar Produtos',
  'manage_cart': 'Gerenciar Carrinho',
  'view_orders': 'Visualizar Pedidos',
  'manage_products': 'Gerenciar Produtos',
  'manage_categories': 'Gerenciar Categorias',
  'manage_users': 'Gerenciar Usuários',
  'view_analytics': 'Visualizar Análises'
}

export function Users() {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState<UserForm>(initialUserForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAdmin()) {
      setError('Acesso não autorizado')
      return
    }
    loadUsers()
    loadPermissions()
  }, [isAdmin])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, role, active')
        .order('created_at')

      if (profilesError) throw profilesError

      const usersWithPermissions = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: userPermissions } = await supabase
            .from('user_permissions')
            .select('permissions (name)')
            .eq('user_id', profile.id)

          return {
            ...profile,
            permissions: (userPermissions || []).map(up => up.permissions.name)
          }
        })
      )

      setUsers(usersWithPermissions)
    } catch (error: any) {
      console.error('Error loading users:', error)
      setError('Erro ao carregar usuários. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('name')
      
      if (error) throw error
      setPermissions(data || [])
    } catch (error: any) {
      console.error('Error loading permissions:', error)
      setError('Erro ao carregar permissões. Por favor, tente novamente.')
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      username: user.username || '',
      full_name: user.full_name || '',
      password: '',
      role: user.role as 'admin' | 'customer',
      permissions: user.permissions || []
    })
    setShowUserForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin()) {
      setError('Operação não permitida')
      return
    }

    setError('')
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: userForm.full_name,
            role: userForm.role
          })
          .eq('id', editingUser.id)

        if (error) throw error

        // Update user permissions
        await updateUserPermissions(editingUser.id, userForm.permissions)
      } else {
        // Create new user
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email: userForm.username,
          password: userForm.password,
          options: {
            data: {
              full_name: userForm.full_name,
              role: userForm.role
            }
          }
        })

        if (signUpError) throw signUpError
        if (!user) throw new Error('Falha ao criar usuário')

        // Add user permissions
        await updateUserPermissions(user.id, userForm.permissions)
      }

      setUserForm(initialUserForm)
      setShowUserForm(false)
      setEditingUser(null)
      await loadUsers()
    } catch (error: any) {
      console.error('Error saving user:', error)
      setError(error.message || 'Erro ao salvar usuário')
    }
  }

  const updateUserPermissions = async (userId: string, newPermissions: string[]) => {
    try {
      // First, remove all existing permissions
      const { error: deleteError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      // Then add new permissions if any are selected
      if (newPermissions.length > 0) {
        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No authenticated user')

        // Create permission records
        const permissionsToAdd = permissions
          .filter(p => newPermissions.includes(p.name))
          .map(p => ({
            user_id: userId,
            permission_id: p.id,
            granted_by: user.id
          }))

        // Insert all permissions
        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(permissionsToAdd)

        if (insertError) throw insertError
      }
    } catch (error: any) {
      throw new Error('Erro ao atualizar permissões: ' + error.message)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!isAdmin()) {
      setError('Operação não permitida')
      return
    }

    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      setUsers(users.filter(user => user.id !== userId))
    } catch (error: any) {
      console.error('Error deleting user:', error)
      setError(error.message || 'Erro ao excluir usuário')
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !currentStatus })
        .eq('id', userId)

      if (error) throw error
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, active: !currentStatus }
          : user
      ))
    } catch (error: any) {
      console.error('Error toggling user status:', error)
      setError(error.message || 'Erro ao alterar status do usuário')
    }
  }

  const toggleUserRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'customer' : 'admin'
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ))
    } catch (error: any) {
      console.error('Error toggling user role:', error)
      setError(error.message || 'Erro ao alterar função do usuário')
    }
  }

  const handlePermissionChange = (permissionName: string) => {
    setUserForm(prev => {
      const permissions = prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName]
      return { ...prev, permissions }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie usuários, funções e permissões do sistema
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null)
            setUserForm(initialUserForm)
            setShowUserForm(true)
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Usuário
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {showUserForm && (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="username"
                required={!editingUser}
                disabled={!!editingUser}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <input
                type="text"
                id="full_name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha {editingUser && '(deixe em branco para manter a atual)'}
              </label>
              <input
                type="password"
                id="password"
                required={!editingUser}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Função
              </label>
              <select
                id="role"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'customer' })}
              >
                <option value="customer">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissões
              </label>
              <div className="space-y-2">
                {permissions.map(permission => (
                  <label
                    key={permission.id}
                    className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={userForm.permissions.includes(permission.name)}
                      onChange={() => handlePermissionChange(permission.name)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {permissionTranslations[permission.name] || permission.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {permission.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowUserForm(false)
                  setEditingUser(null)
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {editingUser ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <UsersIcon className="h-6 w-6 text-gray-600" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sem Usuários</h3>
            <p className="mt-1 text-sm text-gray-500">
              Não há usuários cadastrados no sistema.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowUserForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Usuário
              </button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissões
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCog className="h-6 w-6 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserRole(user.id, user.role)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.active)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {user.active ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {permissions.map(permission => (
                        <label
                          key={permission.id}
                          className="inline-flex items-center px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={user.permissions.includes(permission.name)}
                            onChange={() => togglePermission(
                              user.id,
                              permission.id,
                              user.permissions.includes(permission.name)
                            )}
                            className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {permissionTranslations[permission.name] || permission.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}