import { useState } from "react";
import { Phone, AlertTriangle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface EmergencyContact {
  emergency_contact: string | null;
  emergency_contact_name: string | null;
}

export const EmergencyContactButton = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [setupOpen, setSetupOpen] = useState(false);
  const [callConfirmOpen, setCallConfirmOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // Fetch emergency contact
  const { data: emergencyContact } = useQuery({
    queryKey: ["emergencyContact"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("emergency_contact, emergency_contact_name")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data as EmergencyContact;
    },
  });

  // Save emergency contact
  const saveContact = useMutation({
    mutationFn: async ({ name, number }: { name: string; number: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          emergency_contact: number,
          emergency_contact_name: name,
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergencyContact"] });
      setSetupOpen(false);
      toast({
        title: "Emergency Contact Saved",
        description: "Your emergency contact has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEmergencyCall = () => {
    if (emergencyContact?.emergency_contact) {
      window.location.href = `tel:${emergencyContact.emergency_contact}`;
      setCallConfirmOpen(false);
    }
  };

  const hasEmergencyContact = emergencyContact?.emergency_contact;

  return (
    <>
      {hasEmergencyContact ? (
        <Button
          variant="destructive"
          size="lg"
          className="fixed bottom-20 right-4 z-50 rounded-full shadow-lg h-14 w-14 p-0"
          onClick={() => setCallConfirmOpen(true)}
        >
          <Phone className="h-6 w-6" />
        </Button>
      ) : (
        <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="fixed bottom-20 right-4 z-50 rounded-full shadow-lg h-14 w-14 p-0 border-destructive text-destructive hover:bg-destructive/10"
            >
              <Settings className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Set Emergency Contact
              </DialogTitle>
              <DialogDescription>
                Add an emergency contact that can be called with one tap during emergencies.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  placeholder="e.g., Mom, Dad, Spouse"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Phone Number</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSetupOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => saveContact.mutate({ name: contactName, number: contactNumber })}
                disabled={!contactName || !contactNumber || saveContact.isPending}
              >
                Save Contact
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Call Confirmation Dialog */}
      <AlertDialog open={callConfirmOpen} onOpenChange={setCallConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Emergency Call
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to call your emergency contact{" "}
              <strong>{emergencyContact?.emergency_contact_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmergencyCall}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
