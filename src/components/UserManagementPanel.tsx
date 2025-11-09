import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Trash2, RefreshCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { z } from "zod";

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

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsers();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(`
        *,
        user_roles (
          role
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    } else {
      setUsers((profiles as any) || []);
    }
    setLoading(false);
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: { full_name: newUserFullName },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      if (authData.user && newUserIsAdmin) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: authData.user.id, role: "admin" });

        if (roleError) {
          toast.error("User created but failed to assign admin role");
          console.error(roleError);
        }
      }

      toast.success("User created successfully!");
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

    const isCurrentlyAdmin = roleChangeUser.user_roles.some((r) => r.role === "admin");

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
        toast.success("Admin role removed");
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: roleChangeUser.id, role: "admin" });

        if (error) throw error;
        toast.success("Admin role granted");
      }

      fetchUsers();
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

      toast.success("User deleted successfully");
      fetchUsers();
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
      toast.success(`Password reset email sent to ${email}`);
    } catch (error) {
      toast.error("Failed to send reset email");
      console.error(error);
    }
  };

  return (
    <>
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
            <form onSubmit={handleCreateUser} className="space-y-4 mb-6 p-4 bg-muted rounded-lg">
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
                {loading ? "Creating..." : "Create User"}
              </Button>
            </form>
          )}

          <div className="space-y-3">
            {loading && users.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No users yet</p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground truncate">
                        {user.full_name || "No name"}
                      </p>
                      {user.user_roles.map((r) => (
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
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetPassword(user.email)}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant={user.user_roles.some((r) => r.role === "admin") ? "destructive" : "default"}
                      onClick={() => confirmToggleRole(user)}
                      disabled={loading}
                    >
                      {user.user_roles.some((r) => r.role === "admin") ? "Remove Admin" : "Make Admin"}
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
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.full_name || userToDelete?.email}? 
              This action cannot be undone and will remove all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={roleChangeDialog} onOpenChange={setRoleChangeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              {roleChangeUser?.user_roles.some((r) => r.role === "admin")
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