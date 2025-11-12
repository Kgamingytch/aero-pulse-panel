import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, AlertCircle, Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SuccessCheckmark } from "@/components/ui/success-checkmark";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
  created_by: string | null;
}

interface AnnouncementsPanelProps {
  isAdmin: boolean;
}

export const AnnouncementsPanel = ({ isAdmin }: AnnouncementsPanelProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [successCheckmark, setSuccessCheckmark] = useState(false);
  const [recentlyCreatedId, setRecentlyCreatedId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "normal" | "high">("normal");

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel("announcements-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("⚠ Failed to load announcements");
      return;
    }

    setAnnouncements(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("⚠ Title and content are required");
      return;
    }

    if (newTitle.length > 200) {
      toast.error("⚠ Title must be less than 200 characters");
      return;
    }

    if (newContent.length > 2000) {
      toast.error("⚠ Content must be less than 2000 characters");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.from("announcements").insert({
      title: newTitle.trim(),
      content: newContent.trim(),
      priority: newPriority,
    }).select().single();

    if (error) {
      toast.error("⚠ Failed to create announcement");
      console.error(error);
    } else {
      toast.success("✓ Announcement created!");
      
      // Show success animations
      setRecentlyCreatedId(data.id);
      setSuccessCheckmark(true);
      setTimeout(() => {
        setSuccessCheckmark(false);
        setRecentlyCreatedId(null);
      }, 2000);
      
      setNewTitle("");
      setNewContent("");
      setNewPriority("normal");
      setShowForm(false);
    }
    setLoading(false);
  };

  const confirmDelete = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!announcementToDelete) return;

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementToDelete.id);

    if (error) {
      toast.error("⚠ Failed to delete announcement");
      console.error(error);
    } else {
      toast.success("✓ Announcement deleted");
    }

    setDeleteDialogOpen(false);
    setAnnouncementToDelete(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <>
      <SuccessCheckmark show={successCheckmark} />
      
      <Card className="border-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
          <CardTitle className="text-foreground">Announcements</CardTitle>
          {isAdmin && (
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? "Cancel" : "New"}
            </Button>
          )}
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {isAdmin && showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-muted rounded-lg animate-scale-in">
              <div className="space-y-2">
                <Label htmlFor="title">Title ({newTitle.length}/200)</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Announcement title"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content ({newContent.length}/2000)</Label>
                <Textarea
                  id="content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Announcement details..."
                  rows={4}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newPriority} onValueChange={(value: any) => setNewPriority(value)} disabled={loading}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Announcement
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="space-y-3">
            {loading && announcements.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="p-4 bg-muted rounded-lg animate-pulse-subtle"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="space-y-2">
                      <div className="h-5 bg-muted-foreground/20 rounded w-2/3" />
                      <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
                      <div className="h-3 bg-muted-foreground/20 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No announcements yet</p>
            ) : (
              announcements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  onClick={() => {
                    setSelectedAnnouncement(announcement);
                    setDetailsOpen(true);
                  }}
                  className={cn(
                    "relative p-4 rounded-lg space-y-2 cursor-pointer",
                    "transition-all duration-200",
                    "hover:scale-[1.02] hover:shadow-md",
                    "active:scale-[0.98]",
                    "animate-fade-in",
                    recentlyCreatedId === announcement.id && 
                      "animate-success-flash ring-2 ring-green-500/50 bg-green-50",
                    announcement.priority === "high"
                      ? "bg-gradient-to-br from-red-50 via-red-50/80 to-orange-50 border-2 border-red-300 animate-glow-pulse"
                      : "bg-muted hover:bg-muted/80"
                  )}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn(
                          "font-semibold truncate",
                          announcement.priority === "high" ? "text-red-900" : "text-foreground"
                        )}>
                          {announcement.title}
                        </h3>

                        <Badge
                          variant={getPriorityColor(announcement.priority)}
                          className="uppercase text-[10px] tracking-wide"
                        >
                          {announcement.priority}
                        </Badge>
                        
                        {announcement.priority === "high" && (
                          <Maximize2 className="h-3 w-3 text-red-600 animate-bounce-subtle" />
                        )}
                      </div>

                      <p className={cn(
                        "text-sm line-clamp-2",
                        announcement.priority === "high" ? "text-red-800" : "text-muted-foreground"
                      )}>
                        {announcement.content}
                      </p>

                      <p className={cn(
                        "text-xs mt-2",
                        announcement.priority === "high" ? "text-red-700" : "text-muted-foreground"
                      )}>
                        {new Date(announcement.created_at).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>

                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(announcement);
                        }}
                        className="shrink-0 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-height-[85vh] overflow-y-auto animate-scale-in">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-3xl font-bold text-foreground">
              {selectedAnnouncement?.title}
            </DialogTitle>
          </DialogHeader>

          <Separator className="my-4" />

          <div className="space-y-6">
            <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
              {selectedAnnouncement?.content}
            </p>

            <Separator />

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Posted On
              </p>
              <p className="text-base font-medium text-foreground">
                {selectedAnnouncement?.created_at
                  ? new Date(selectedAnnouncement.created_at).toLocaleString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Unknown"}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Announcement
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{announcementToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
