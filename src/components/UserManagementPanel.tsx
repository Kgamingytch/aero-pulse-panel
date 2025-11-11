import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Trash2, RefreshCw, Loader2, Edit, Save, X, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { z } from "zod";
import { SuccessCheckmark } from "@/components/ui/success-checkmark";
import { cn } from "@/lib/utils";

const userSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
  full_name: z.string().trim().min(1, "Name is required").max(100, "Name too long")
});

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  user_roles: { role: string }[];
}

export const UserManagementPanel = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [roleChangeDialog, setRoleChangeDialog] = useState(false);
  const [roleChangeUser, setRoleChangeUser] = useState<UserProfile | null>(null);
  const [successCheckmark, setSuccessCheckmark] = useState(false);

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [successUserId, setSuccessUserId] = useState<string | null>(null);

  // ---------- Helpers (hoisted so useEffect can call them) ----------
  const getCurrentUser = async () => {
    try {
      const res = await supabase.auth.getUser();
      // supabase-js v2: { data, error }
      const user = (res as any)?.data?.user ?? null;
      setCurrentUserId(user?.id || null);
    } catch (err) {
      console.error("getCurrentUser error:", err);
      setCurrentUserId(null);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        user_roles: (roles || [])
          .filter(role => role.user_id === profile.id)
          .map(role => ({ role: role.role }))
      }));

      setUsers(usersWithRoles);
    } catch (err: any) {
      console.error("fetchUsers error:", err);
      toast.error("Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    try {
      userSchema.parse({
        email: newUserEmail,
        password: newUserPassword,
        full_name: newUserFullName
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // ---------- Lifecycle ----------
  useEffect(() => {
    fetchUsers();
    getCurrentUser();

    // Subscribe to profile changes to update UI in real-time if supported.
    const channel = supabase
      .channel("profiles-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Actions ----------
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: { full_name: newUserFullName },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast.error(error.message);
        console.error(error);
        return;
      }

      const createdUser = (data as any)?.user ?? null;

      if (createdUser && newUserIsAdmin) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: createdUser.id, role: "admin" });

        if (roleError) {
          toast.error("User created but failed to assign admin role");
          console.error(roleError);
        }
      }

      toast.success("✓ User created successfully!");
      
      // Show success animations
      setSuccessCheckmark(true);
      setTimeout(() => setSuccessCheckmark(false), 1500);
      
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserFullName("");
      setNewUserIsAdmin(false);
      setShowForm(false);
      setErrors({});
      fetchUsers();
    } catch (error) {
      toast.error("Failed to create user");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const confirmToggleRole = (user: UserProfile) => {
    setRoleChangeUser(user);
    setRoleChangeDialog(true);
  };

  const toggleUserRole = async () => {
    if (!roleChangeUser) return;

    const isCurrentlyAdmin = Array.isArray(roleChangeUser.user_roles) && roleChangeUser.user_roles.some((r) => r.role === "admin");

    if (roleChangeUser.id === currentUserId && isCurrentlyAdmin) {
      toast.error("You cannot remove your own admin role");
      setRoleChangeDialog(false);
      setRoleChangeUser(null);
      return;
    }

    setLoading(true);
    try {
      if (isCurrentlyAdmin) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", roleChangeUser.id)
          .eq("role", "admin");

        if (error) throw error;
        toast.success("✓ Admin role removed");
        
        // Show success animation
        setSuccessUserId(roleChangeUser.id);
        setTimeout(() => setSuccessUserId(null), 2000);
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: roleChangeUser.id, role: "admin" });

        if (error) throw error;
        toast.success("✓ Admin role granted");
        
        // Show success animation
        setSuccessUserId(roleChangeUser.id);
        setTimeout(() => setSuccessUserId(null), 2000);
      }

      await fetchUsers();
    } catch (error) {
      toast.error("Failed to update role");
      console.error(error);
    } finally {
      setLoading(false);
      setRoleChangeDialog(false);
      setRoleChangeUser(null);
    }
  };

  const confirmDeleteUser = (user: UserProfile) => {
    if (user.id === currentUserId) {
      toast.error("You cannot delete your own account");
      return;
    }
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setLoading(true);
    try {
      // Delete user roles first
      const { error: rolesError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userToDelete.id);

      if (rolesError) throw rolesError;

      // Delete profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userToDelete.id);

      if (profileError) throw profileError;

      toast.success("✓ User deleted successfully");
      await fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
      console.error(error);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`
      });

      if (error) throw error;
      toast.success("✓ Password reset email sent to " + email);
    } catch (error) {
      toast.error("Failed to send reset email");
      console.error(error);
    }
  };

  const startEditing = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditFullName(user.full_name || "");
    setEditEmail(user.email);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditFullName("");
    setEditEmail("");
  };

  const handleUpdateUser = async (userId: string) => {
    const nameSchema = z.string().trim().min(1, "Name is required").max(100, "Name too long");
    const emailSchema = z.string().email("Invalid email").max(255, "Email too long");

    try {
      nameSchema.parse(editFullName);
      emailSchema.parse(editEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return;
    }

    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editFullName.trim(),
          email: editEmail.trim()
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      toast.success("✓ User profile updated successfully");
      setSuccessUserId(userId);
      setTimeout(() => setSuccessUserId(null), 2000);
      
      setEditingUserId(null);
      await fetchUsers();
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error";
      if (typeof errorMessage === "string" && errorMessage.toLowerCase().includes("duplicate")) {
        toast.error("This email is already in use");
      } else {
        toast.error("Failed to update profile");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Render ----------
  return (
    <>
      <SuccessCheckmark show={successCheckmark} />
      
      <Card className="border-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
          <CardTitle className="text-foreground">User Management</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            {showForm ? "Cancel" : "New User"}
          </Button>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {showForm && (
            <form onSubmit={handleCreateUser} className="space-y-4 mb-6 p-4 bg-muted rounded-lg animate-scale-in">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  placeholder="John Doe"
                  disabled={loading}
                  required
                />
                {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={loading}
                  required
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                <p className="text-xs text-muted-foreground">
                  Must be 8+ characters with uppercase, lowercase, and number
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-admin"
                  checked={newUserIsAdmin}
                  onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                  disabled={loading}
                  className="rounded border-input"
                />
                <Label htmlFor="is-admin" className="cursor-pointer">
                  Grant Admin Role
                </Label>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </form>
          )}

          <div className="space-y-3">
            {loading && users.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="p-4 bg-muted rounded-lg animate-pulse-subtle"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="space-y-2">
                      <div className="h-5 bg-muted-foreground/20 rounded w-1/3" />
                      <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
                      <div className="h-3 bg-muted-foreground/20 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground">No users yet</p>
                <p className="text-sm text-muted-foreground">
                  Create your first user to get started
                </p>
              </div>
            ) : (
              users.map((user, index) => {
                const isEditing = editingUserId === user.id;
                const isSuccess = successUserId === user.id;
                
                return (
                  <div
                    key={user.id}
                    className={cn(
                      "p-4 bg-muted rounded-lg transition-all duration-200",
                      "hover:shadow-md hover:scale-[1.01]",
                      "animate-fade-in",
                      isSuccess && "animate-success-flash ring-2 ring-green-500/50"
                    )}
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'backwards'
                    }}
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-name-${user.id}`}>Full Name</Label>
                          <Input
                            id={`edit-name-${user.id}`}
                            value={editFullName}
                            onChange={(e) => setEditFullName(e.target.value)}
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-email-${user.id}`}>Email</Label>
                          <Input
                            id={`edit-email-${user.id}`}
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            disabled={loading}
                          />
                          <p className="text-xs text-muted-foreground">
                            Note: Email changes in profiles table only. Auth email requires user confirmation.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          {Array.isArray(user.user_roles) && user.user_roles.map((r) => (
                            <Badge key={r.role} variant={r.role === "admin" ? "default" : "secondary"}>
                              {r.role}
                            </Badge>
                          ))}
                          {user.id === currentUserId && (
                            <Badge variant="outline">You</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateUser(user.id)}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            disabled={loading}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-medium text-foreground">
                                {user.full_name || "No name"}
                              </p>
                              {Array.isArray(user.user_roles) && user.user_roles.map((r) => (
                                <Badge key={r.role} variant={r.role === "admin" ? "default" : "secondary"}>
                                  {r.role}
                                </Badge>
                              ))}
                              {user.id === currentUserId && (
                                <Badge variant="outline">You</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(user.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(user)}
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResetPassword(user.email)}
                            disabled={loading}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset Password
                          </Button>

                          <Button
                            size="sm"
                            variant={Array.isArray(user.user_roles) && user.user_roles.some((r) => r.role === "admin") ? "destructive" : "default"}
                            onClick={() => confirmToggleRole(user)}
                            disabled={loading}
                          >
                            {Array.isArray(user.user_roles) && user.user_roles.some((r) => r.role === "admin") ? "Remove Admin" : "Make Admin"}
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => confirmDeleteUser(user)}
                            disabled={loading || user.id === currentUserId}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to delete <strong>{userToDelete?.full_name}</strong> ({userToDelete?.email})?
              </p>
              <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-semibold mb-2">This will permanently remove:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>User profile and account data</li>
                  <li>All assigned roles and permissions</li>
                  <li>Access to the FlyPrague system</li>
                </ul>
              </div>
              <p className="font-semibold text-destructive">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={roleChangeDialog} onOpenChange={setRoleChangeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              {Array.isArray(roleChangeUser?.user_roles) && roleChangeUser?.user_roles.some((r) => r.role === "admin")
                ? `Remove admin privileges from ${roleChangeUser?.full_name || roleChangeUser?.email}?`
                : `Grant admin privileges to ${roleChangeUser?.full_name || roleChangeUser?.email}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={toggleUserRole}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
