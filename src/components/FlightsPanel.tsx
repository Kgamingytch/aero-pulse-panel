import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plane, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Flight {
  id: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  status: string;
  gate: string | null;
  aircraft_type: string | null;
}

interface FlightsPanelProps {
  isAdmin: boolean;
}

export const FlightsPanel = ({ isAdmin }: FlightsPanelProps) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    flight_number: "",
    departure_airport: "",
    arrival_airport: "",
    departure_time: "",
    arrival_time: "",
    status: "scheduled",
    gate: "",
    aircraft_type: "",
  });

  useEffect(() => {
    fetchFlights();

    const channel = supabase
      .channel("flights-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flights" },
        () => {
          fetchFlights();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFlights = async () => {
    const { data, error } = await supabase
      .from("flights")
      .select("*")
      .gte("departure_time", new Date().toISOString())
      .order("departure_time", { ascending: true })
      .limit(10);

    if (error) {
      toast.error("Failed to load flights");
      return;
    }

    setFlights(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.flight_number || !formData.departure_airport || !formData.arrival_airport || !formData.departure_time || !formData.arrival_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("flights").insert({
      ...formData,
      gate: formData.gate || null,
      aircraft_type: formData.aircraft_type || null,
    });

    if (error) {
      toast.error("Failed to create flight");
    } else {
      toast.success("Flight created!");
      setFormData({
        flight_number: "",
        departure_airport: "",
        arrival_airport: "",
        departure_time: "",
        arrival_time: "",
        status: "scheduled",
        gate: "",
        aircraft_type: "",
      });
      setShowForm(false);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("flights").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete flight");
    } else {
      toast.success("Flight deleted");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "departed":
        return "bg-primary";
      case "boarding":
        return "bg-accent";
      case "delayed":
        return "bg-destructive";
      case "cancelled":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-primary" />
          <CardTitle>Next Flights</CardTitle>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && isAdmin && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-secondary rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flight_number">Flight Number</Label>
                <Input
                  id="flight_number"
                  value={formData.flight_number}
                  onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                  placeholder="AA1234"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="boarding">Boarding</SelectItem>
                    <SelectItem value="departed">Departed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure_airport">Departure</Label>
                <Input
                  id="departure_airport"
                  value={formData.departure_airport}
                  onChange={(e) => setFormData({ ...formData, departure_airport: e.target.value })}
                  placeholder="JFK"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrival_airport">Arrival</Label>
                <Input
                  id="arrival_airport"
                  value={formData.arrival_airport}
                  onChange={(e) => setFormData({ ...formData, arrival_airport: e.target.value })}
                  placeholder="LAX"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure_time">Departure Time</Label>
                <Input
                  id="departure_time"
                  type="datetime-local"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrival_time">Arrival Time</Label>
                <Input
                  id="arrival_time"
                  type="datetime-local"
                  value={formData.arrival_time}
                  onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gate">Gate (Optional)</Label>
                <Input
                  id="gate"
                  value={formData.gate}
                  onChange={(e) => setFormData({ ...formData, gate: e.target.value })}
                  placeholder="A12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aircraft_type">Aircraft (Optional)</Label>
                <Input
                  id="aircraft_type"
                  value={formData.aircraft_type}
                  onChange={(e) => setFormData({ ...formData, aircraft_type: e.target.value })}
                  placeholder="Boeing 737"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {flights.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming flights</p>
          ) : (
            flights.map((flight) => (
              <div
                key={flight.id}
                className="p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{flight.flight_number}</h3>
                      <Badge className={getStatusColor(flight.status)}>
                        {flight.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">From</p>
                        <p className="font-semibold">{flight.departure_airport}</p>
                        <p className="text-xs">{new Date(flight.departure_time).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">To</p>
                        <p className="font-semibold">{flight.arrival_airport}</p>
                        <p className="text-xs">{new Date(flight.arrival_time).toLocaleString()}</p>
                      </div>
                    </div>
                    {(flight.gate || flight.aircraft_type) && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {flight.gate && <span>Gate: {flight.gate}</span>}
                        {flight.aircraft_type && <span>Aircraft: {flight.aircraft_type}</span>}
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(flight.id)}
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
  );
};
