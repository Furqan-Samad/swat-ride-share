import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  bookingDetails: {
    origin?: string;
    destination?: string;
    seats?: number;
  };
}

const CANCELLATION_REASONS = [
  { value: "emergency", label: "Emergency situation" },
  { value: "schedule_change", label: "Schedule change" },
  { value: "found_alternative", label: "Found alternative transport" },
  { value: "health_issue", label: "Health issues" },
  { value: "other", label: "Other reason" },
];

export const CancelBookingDialog = ({
  open,
  onOpenChange,
  onConfirm,
  bookingDetails,
}: CancelBookingDialogProps) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    const reason = selectedReason === "other" 
      ? customReason 
      : CANCELLATION_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
    
    if (!reason.trim()) return;
    
    setIsLoading(true);
    try {
      await onConfirm(reason);
      onOpenChange(false);
      setSelectedReason("");
      setCustomReason("");
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = selectedReason && (selectedReason !== "other" || customReason.trim().length > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancel Booking
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to cancel your booking for{" "}
            <strong>{bookingDetails.origin}</strong> →{" "}
            <strong>{bookingDetails.destination}</strong>
            {bookingDetails.seats && ` (${bookingDetails.seats} seat(s))`}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Please select a reason for cancellation:</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {CANCELLATION_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Please specify:</Label>
              <Textarea
                id="customReason"
                placeholder="Describe your reason for cancellation..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="min-h-[80px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {customReason.length}/500
              </p>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> The driver will be notified of your cancellation
              and the reason you provide. Your seat(s) will be made available again.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Keep Booking</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Yes, Cancel Booking"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
