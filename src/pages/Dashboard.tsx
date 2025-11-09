import { useState } from "react";
import { Trash2 } from "lucide-react"; // Assuming you're using Lucide for icons

interface Announcement {
  id: string;
  title: string;
  content: string;
  // Add other fields as needed
}

interface AnnouncementsPanelProps {
  isAdmin: boolean;
  onCreate: (title: string, content: string, priority: number) => void;
  data: Announcement[];
}

const AnnouncementsPanel = ({ isAdmin, onCreate, data }: AnnouncementsPanelProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    // Simulate delete API call (replace with your actual delete logic)
    setTimeout(() => {
      // Remove from data or call parent handler
      setDeletingId(null);
      // e.g., onDelete(id);
    }, 500); // Match animation duration
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Announcements</h2>
      <ul className="space-y-4">
        {data.map((announcement) => (
          <li
            key={announcement.id}
            className={`p-4 border rounded-lg transition-all duration-300 ease-in-out ${
              deletingId === announcement.id ? "animate-fade-out-up" : ""
            }`}
          >
            <div className="flex justify-between items-start group">
              <div className="flex-1">
                <h3 className="font-medium">{announcement.title}</h3>
                <p className="text-sm text-muted-foreground">{announcement.content}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="text-red-500 hover:text-red-700 transition-colors duration-200"
                  onMouseEnter={(e) => {
                    const item = e.currentTarget.closest("li");
                    if (item) {
                      item.classList.add("bg-red-500", "text-white");
                    }
                  }}
                  onMouseLeave={(e) => {
                    const item = e.currentTarget.closest("li");
                    if (item) {
                      item.classList.remove("bg-red-500", "text-white");
                    }
                  }}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {/* Add create form if needed */}
    </div>
  );
};

export { AnnouncementsPanel };
