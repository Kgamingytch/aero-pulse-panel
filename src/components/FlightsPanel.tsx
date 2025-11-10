import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flightToDelete, setFlightToDelete] = useState<Flight | null>(null);

  const [newFlightNumber, setNewFlightNumber] = useState("");
  const [newDepartureAirport, setNewDepartureAirport] = useState("");
  const [newArrivalAirport, setNewArrivalAirport] = useState("");
  const [newDepartureTime, setNewDepartureTime] = useState("");
  const [newArrivalTime, setNewArrivalTime] = useState("");
  const [newStatus, setNewStatus] = useState("scheduled");
  const [newGate, setNewGate] = useState("");
  const [newAircraftType, setNewAircraftType] = useState("");

  useEffect(() => {
    fetchFlights();

    const channel = supabase
      .channel("flights-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "flights" }, () => {
        fetchFlights();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFlights = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("flights").select("*").order("departure_time", { ascending: true });

    if (error) {
      toast.error("Failed to fetch flights");
      console.error(error);
    } else {
      setFlights(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(newArrivalTime) <= new Date(newDepartureTime)) {
      toast.error("Arrival time must be after departure time");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("flights").insert({
      flight_number: newFlightNumber.trim().toUpperCase(),
      departure_airport: newDepartureAirport.trim().toUpperCase(),
      arrival_airport: newArrivalAirport.trim().toUpperCase(),
      departure_time: newDepartureTime,
      arrival_time: newArrivalTime,
      status: newStatus,
      gate: newGate.trim() || null,
      aircraft_type: newAircraftType.trim() || null
    });

    if (error) {
      toast.error("Failed to create flight");
      console.error(error);
    } else {
      toast.success("Flight created!");
      setNewFlightNumber("");
      setNewDepartureAirport("");
      setNewArrivalAirport("");
      setNewDepartureTime("");
      setNewArrivalTime("");
      setNewStatus("scheduled");
      setNewGate("");
      setNewAircraftType("");
      setShowForm(false);
    }
    setLoading(false);
  };

  const confirmDelete = (flight: Flight) => {
    setFlightToDelete(flight);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!flightToDelete) return;

    const { error } = await supabase.from("flights").delete().eq("id", flightToDelete.id);

    if (error) {
      toast.error("Failed to delete flight");
      console.error(error);
    } else {
      toast.success("Flight deleted");
    }

    setDeleteDialogOpen(false);
    setFlightToDelete(null);
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case "boarding":
        return "border-l-blue-500";
      case "delayed":
        return "border-l-red-500";
      case "cancelled":
        return "border-l-red-600";
      case "departed":
        return "border-l-green-500";
      default:
        return "border-l-muted-foreground/40";
    }
  };

  return (
    <>
      <Card className="border-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between px-0 pt-0">
          <CardTitle className="text-foreground">Flights</CardTitle>
          {isAdmin && (
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? "Cancel" : "New"}
            </Button>
          )}
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {isAdmin && showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flight-number">Flight Number</Label>
                  <Input id="flight-number" value={newFlightNumber} onChange={(e) => setNewFlightNumber(e.target.value)} placeholder="AA1234" disabled={loading} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus} disabled={loading}>
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
                  <Label htmlFor="departure-airport">From (IATA)</Label>
                  <Input id="departure-airport" value={newDepartureAirport} onChange={(e) => setNewDepartureAirport(e.target.value)} placeholder="PRG" maxLength={3} disabled={loading} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival-airport">To (IATA)</Label>
                  <Input id="arrival-airport" value={newArrivalAirport} onChange={(e) => setNewArrivalAirport(e.target.value)} placeholder="LHR" maxLength={3} disabled={loading} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departure-time">Departure</Label>
                  <Input id="departure-time" type="datetime-local" value={newDepartureTime} onChange={(e) => setNewDepartureTime(e.target.value)} disabled={loading} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival-time">Arrival</Label>
                  <Input id="arrival-time" type="datetime-local" value={newArrivalTime} onChange={(e) => setNewArrivalTime(e.target.value)} disabled={loading} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gate">Gate (Optional)</Label>
                  <Input id="gate" value={newGate} onChange={(e) => setNewGate(e.target.value)} placeholder="A12" disabled={loading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aircraft">Aircraft (Optional)</Label>
                  <Input id="aircraft" value={newAircraftType} onChange={(e) => setNewAircraftType(e.target.value)} placeholder="Boeing 737" disabled={loading} />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create Flight"}
              </Button>
            </form>
          )}

          <div className="space-y-3">
            {loading && flights.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Loading...</p>
            ) : flights.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No flights yet</p>
            ) : (
              flights.map((flight) => (
                <div
                  key={flight.id}
                  className={`
                    group p-4 rounded-lg border bg-background transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]
                    border-l-4 ${getStatusBorder(flight.status)}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{flight.flight_number}</h3>
                        <Badge variant="outline" className="uppercase text-[10px] tracking-wide">
                          {flight.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {flight.departure_airport} → {flight.arrival_airport}
                      </p>

                      <p className="text-xs text-muted-foreground mt-2">
                        Departs: {new Date(flight.departure_time).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Arrives: {new Date(flight.arrival_time).toLocaleString()}
                      </p>
                      {flight.gate && <p className="text-xs text-muted-foreground">Gate: {flight.gate}</p>}
                      {flight.aircraft_type && <p className="text-xs text-muted-foreground">Aircraft: {flight.aircraft_type}</p>}
                    </div>

                    {isAdmin && (
                      <Button size="sm" variant="ghost" onClick={() => confirmDelete(flight)} className="shrink-0 hover:bg-destructive/10">
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flight</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete flight {flightToDelete?.flight_number}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
