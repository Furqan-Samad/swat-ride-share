import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateRide } from "@/hooks/useRideManagement";

interface Ride {
  id: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  price_per_seat: number;
  front_seat_price?: number | null;
  back_seat_price?: number | null;
  front_seats_available?: number | null;
  back_seats_available?: number | null;
  available_seats: number;
  description?: string | null;
}

interface EditRideDialogProps {
  ride: Ride | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditRideDialog = ({ ride, open, onOpenChange }: EditRideDialogProps) => {
  const updateRide = useUpdateRide();
  
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departure_date: "",
    departure_time: "",
    front_seat_price: 0,
    back_seat_price: 0,
    front_seats_available: 1,
    back_seats_available: 3,
    description: "",
  });

  useEffect(() => {
    if (ride) {
      setFormData({
        origin: ride.origin,
        destination: ride.destination,
        departure_date: ride.departure_date,
        departure_time: ride.departure_time,
        front_seat_price: ride.front_seat_price ?? Math.round(ride.price_per_seat * 1.5),
        back_seat_price: ride.back_seat_price ?? ride.price_per_seat,
        front_seats_available: ride.front_seats_available ?? 1,
        back_seats_available: ride.back_seats_available ?? 3,
        description: ride.description ?? "",
      });
    }
  }, [ride]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ride) return;

    await updateRide.mutateAsync({
      id: ride.id,
      ...formData,
      price_per_seat: formData.back_seat_price,
      available_seats: formData.front_seats_available + formData.back_seats_available,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Ride</DialogTitle>
          <DialogDescription>
            Update your ride details. Changes will be visible immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure_date">Date</Label>
              <Input
                id="departure_date"
                type="date"
                value={formData.departure_date}
                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure_time">Time</Label>
              <Input
                id="departure_time"
                type="time"
                value={formData.departure_time}
                onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="front_seat_price">Front Seat Price (₨)</Label>
              <Input
                id="front_seat_price"
                type="number"
                min="0"
                value={formData.front_seat_price}
                onChange={(e) => setFormData({ ...formData, front_seat_price: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="back_seat_price">Back Seat Price (₨)</Label>
              <Input
                id="back_seat_price"
                type="number"
                min="0"
                value={formData.back_seat_price}
                onChange={(e) => setFormData({ ...formData, back_seat_price: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="front_seats">Front Seats Available</Label>
              <Input
                id="front_seats"
                type="number"
                min="0"
                max="2"
                value={formData.front_seats_available}
                onChange={(e) => setFormData({ ...formData, front_seats_available: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="back_seats">Back Seats Available</Label>
              <Input
                id="back_seats"
                type="number"
                min="0"
                max="4"
                value={formData.back_seats_available}
                onChange={(e) => setFormData({ ...formData, back_seats_available: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any additional details about your ride..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateRide.isPending}>
              {updateRide.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRideDialog;
