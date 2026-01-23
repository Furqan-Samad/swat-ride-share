import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDeleteRide } from "@/hooks/useRideManagement";

interface DeleteRideDialogProps {
  rideId: string | null;
  hasActiveBookings: boolean;
  activeBookingsCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const DeleteRideDialog = ({
  rideId,
  hasActiveBookings,
  activeBookingsCount,
  open,
  onOpenChange,
  onSuccess,
}: DeleteRideDialogProps) => {
  const deleteRide = useDeleteRide();
  const [forceDelete, setForceDelete] = useState(false);

  const handleDelete = async () => {
    if (!rideId) return;

    try {
      await deleteRide.mutateAsync({ 
        rideId, 
        forceDelete: hasActiveBookings ? forceDelete : true 
      });
      onOpenChange(false);
      setForceDelete(false);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const canDelete = !hasActiveBookings || forceDelete;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Ride
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>Are you sure you want to delete this ride? This action cannot be undone.</p>
              
              {hasActiveBookings && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="font-medium text-destructive mb-2">
                    ⚠️ This ride has {activeBookingsCount} active booking(s)
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Deleting this ride will automatically cancel all pending and confirmed bookings. 
                    Passengers will need to be notified.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="force-delete"
                      checked={forceDelete}
                      onCheckedChange={(checked) => setForceDelete(checked as boolean)}
                    />
                    <label
                      htmlFor="force-delete"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      I understand, cancel all bookings and delete the ride
                    </label>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || deleteRide.isPending}
          >
            {deleteRide.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Ride"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteRideDialog;
