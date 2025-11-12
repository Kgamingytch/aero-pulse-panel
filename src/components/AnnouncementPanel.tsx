import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Announcement shape - adapt to your DB schema if different
 */
interface Announcement {
  id: string;
  title: string;
  body: string | null;
  priority: "normal" | "high" | string;
  created_at: string;
  read: boolean;
}

export const AnnouncementPanel = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel("announcements-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to retrieve announcements. Please try again.");
      console.error(error);
    } else {
      setAnnouncements((data || []) as Announcement[]);
    }
    setLoading(false);
  };

  // Keep the same simple capitalization helper used in FlightsPanel
  const formatTitle = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  // Mark announcement as read (stops the flashing visual for high priority)
  const markAsRead = async (announcement: Announcement) => {
    if (announcement.read) return; // already read

    setUpdatingId(announcement.id);
    const { error } = await supabase.from("announcements").update({ read: true }).eq("id", announcement.id);

    if (error) {
      toast.error("Failed to mark announcement as read. Please try again.");
      console.error(error);
    } else {
      setAnnouncements((prev) => prev.map((a) => (a.id === announcement.id ? { ...a, read: true } : a)));
      toast.success("Announcement marked as read.");
    }
    setUpdatingId(null);
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      default:
        return "border-l-muted-foreground/40";
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
        <CardTitle className="text-foreground">Announcements</CardTitle>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {loading ? (
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading announcements…</span>
            </div>
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No announcements available.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement, idx) => {
              const isHighUnseen = announcement.priority === "high" && !announcement.read;
              return (
                <div
                  key={announcement.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => markAsRead(announcement)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      markAsRead(announcement);
                    }
                  }}
                  className={cn(
                    "group p-4 rounded-lg border bg-background transition-all duration-200 hover:shadow-md hover:-translate-y-[1px] animate-fade-in",
                    `border-l-4 ${getPriorityBorder(announcement.priority)}`,
                    isHighUnseen && "animate-flash-red",
                    announcement.read && "opacity-80",
                  )}
                  style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "backwards" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{formatTitle(announcement.title)}</h3>
                        <Badge variant={announcement.priority === "high" ? "destructive" : "outline"} className="uppercase text-[10px] tracking-wide">
                          {formatTitle(announcement.priority)}
                        </Badge>
                      </div>

                      {announcement.body && <p className="text-sm text-muted-foreground truncate">{announcement.body}</p>}

                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(announcement.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {updatingId === announcement.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Button size="sm" variant="ghost" className="opacity-80">
                          Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
