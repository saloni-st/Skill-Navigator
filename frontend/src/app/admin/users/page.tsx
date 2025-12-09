"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Calendar, Settings, RefreshCw, Loader2, Shield, User } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAPI } from "@/lib/api";

function UsersPageContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching real users from API...');
      
      const response = await adminAPI.getUsers(page, 10);
      console.log('📊 Users Response:', response);
      
      if (response?.success && response?.data?.users) {
        console.log('✅ Setting real users:', response.data.users);
        setUsers(response.data.users);
        setPagination({
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalCount: response.data.pagination.totalCount
        });
      } else {
        console.log('⚠️ No users data received:', response);
        setUsers([]);
      }
      
    } catch (error) {
      console.error('💥 Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleUserAction = async (action: string, user: any) => {
    setSelectedUser(user);
    
    switch (action) {
      case 'view':
        setShowUserDetails(true);
        break;
      case 'edit':
        setShowEditUser(true);
        break;
      case 'toggle-status':
        await toggleUserStatus(user);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${user.email}?`)) {
          await deleteUser(user._id);
        }
        break;
    }
  };

  const toggleUserStatus = async (user: any) => {
    try {
      setUpdating(true);
      const response = await adminAPI.updateUser(user._id, {
        isActive: !user.isActive
      });
      
      if (response.success) {
        await fetchUsers(); // Refresh the list
        alert(`User ${user.isActive ? 'deactivated' : 'activated'} successfully!`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    } finally {
      setUpdating(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setUpdating(true);
      const response = await adminAPI.deleteUser(userId);
      
      if (response.success) {
        await fetchUsers(); // Refresh the list
        alert('User deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage platform users and their permissions
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{pagination.totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Shield className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold text-foreground">
                    {users.filter(user => user.role === 'admin').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <User className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Regular Users</p>
                  <p className="text-2xl font-bold text-foreground">
                    {users.filter(user => user.role === 'user').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {users.length > 0 ? (
            users.map((user) => (
              <Card key={user._id} className="border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{user.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role === 'admin' ? "default" : "secondary"}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                      <Badge variant="outline">
                        {user.profile?.education || 'No Education'}
                      </Badge>
                      <Badge variant="outline">
                        {user.profile?.experienceYears || 0} Years Exp
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Last Updated: {new Date(user.updatedAt).toLocaleDateString()}</span>
                      </div>
                      {user.profile?.weeklyHours && (
                        <div className="flex items-center space-x-1">
                          <span>📚 {user.profile.weeklyHours}h/week</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUserAction('view', user)}
                      >
                        View Details
                      </Button>
                      <div className="relative group">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Settings className="h-3 w-3" />
                          <span>Manage</span>
                        </Button>
                        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleUserAction('edit', user)}
                              className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent"
                            >
                              Edit Profile
                            </button>
                            <button
                              onClick={() => handleUserAction('toggle-status', user)}
                              className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent"
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'} User
                            </button>
                            <button
                              onClick={() => handleUserAction('delete', user)}
                              className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete User
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-border/50 border-dashed">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  No users are currently registered on the platform
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={pagination.currentPage === 1}
              onClick={() => fetchUsers(pagination.currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => fetchUsers(pagination.currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">User Details</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowUserDetails(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-foreground">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge variant={selectedUser.isActive ? 'default' : 'destructive'}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Joined</label>
                    <p className="text-foreground">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {selectedUser.profile && (
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-foreground mb-3">Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.profile.education && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Education</label>
                          <p className="text-foreground">{selectedUser.profile.education}</p>
                        </div>
                      )}
                      {selectedUser.profile.experienceLevel && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Experience</label>
                          <p className="text-foreground">{selectedUser.profile.experienceLevel}</p>
                        </div>
                      )}
                      {selectedUser.profile.weeklyHours && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Weekly Hours</label>
                          <p className="text-foreground">{selectedUser.profile.weeklyHours}h/week</p>
                        </div>
                      )}
                      {selectedUser.profile.bio && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Bio</label>
                          <p className="text-foreground">{selectedUser.profile.bio}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {updating && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-foreground">Updating user...</span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <UsersPageContent />
    </ProtectedRoute>
  );
}