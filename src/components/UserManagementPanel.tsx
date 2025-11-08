import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, UserPlus, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("user");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast.error("Failed to load users");
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      toast.error("Failed to load user roles");
      return;
    }

    const usersWithRoles = (profiles || []).map(profile => ({
      ...profile,
      user_roles: (roles || []).filter(r => r.user_id === profile.id).map(r => ({ role: r.role }))
    }));

    setUsers(usersWithRoles);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      toast.error(signUpError.message);
      setLoading(false);
      return;
    }

    if (signUpData.user && role === "admin") {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: signUpData.user.id,
          role: "admin",
        });

      if (roleError) {
        toast.error("User created but failed to assign admin role");
      }
    }

    toast.success("User created successfully!");
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("user");
    setShowForm(false);
    fetchUsers();
    setLoading(false);
  };

  const toggleUserRole = async (userId: string, currentRoles: { role: string }[]) => {
    const isAdmin = currentRoles.some(r => r.role === "admin");
    
    if (isAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (error) {
        toast.error("Failed to remove admin role");
      } else {
        toast.success("Admin role removed");
        fetchUsers();
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "admin",
        });

      if (error) {
        toast.error("Failed to assign admin role");
      } else {
        toast.success("Admin role assigned");
        fetchUsers();
      }
    }
  };

  return (
    <Card className="shadow-elevated">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>User Management</CardTitle>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleCreateUser} className="space-y-4 p-4 bg-secondary rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input
                id="user-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@airline.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users found</p>
          ) : (
            users.map((user) => {
              const isAdmin = user.user_roles.some(r => r.role === "admin");
              return (
                <div
                  key={user.id}
                  className="p-4 bg-card border rounded-lg flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {isAdmin ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{user.full_name || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isAdmin ? "default" : "secondary"}>
                      {isAdmin ? "Admin" : "User"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleUserRole(user.id, user.user_roles)}
                    >
                      {isAdmin ? "Remove Admin" : "Make Admin"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
