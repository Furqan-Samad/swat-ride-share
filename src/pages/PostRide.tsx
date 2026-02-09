import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, DollarSign, Loader2, Armchair, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCreateRide } from "@/hooks/useRides";
import { LocationPicker } from "@/components/LocationPicker";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FormErrors {
  from?: string;
  to?: string;
  date?: string;
  time?: string;
  frontSeats?: string;
  backSeats?: string;
  frontPrice?: string;
  backPrice?: string;
  seats?: string;
}

const PostRide = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const createRide = useCreateRide();

  const [from, setFrom] = useState("Swat");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [frontSeats, setFrontSeats] = useState("1");
  const [backSeats, setBackSeats] = useState("3");
  const [frontPrice, setFrontPrice] = useState("");
  const [backPrice, setBackPrice] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store coordinates for validation
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Auto-calculate front price when back price changes (50% more)
  useEffect(() => {
    if (backPrice && !frontPrice) {
      setFrontPrice(String(Math.round(parseInt(backPrice) * 1.5)));
    }
  }, [backPrice]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to post a ride",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, authLoading, navigate, toast]);

  // Clear specific field error when value changes
  const clearError = useCallback((field: keyof FormErrors) => {
    setErrors((prev) => {
      if (prev[field]) {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  }, []);

  // Validate form and return errors
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pickup location validation
    if (!from || from.trim().length < 2) {
      newErrors.from = "Pickup location is required (min 2 characters)";
    }

    // Drop-off location validation
    if (!to || to.trim().length < 2) {
      newErrors.to = "Drop-off location is required (min 2 characters)";
    }

    // Same location check
    if (from && to && from.trim().toLowerCase() === to.trim().toLowerCase()) {
      newErrors.to = "Drop-off location must be different from pickup";
    }

    // Date validation
    if (!date) {
      newErrors.date = "Please select a departure date";
    } else {
      const selectedDate = new Date(date);
      if (selectedDate < today) {
        newErrors.date = "Date cannot be in the past";
      }
    }

    // Time validation
    if (!time) {
      newErrors.time = "Please select departure time";
    }

    // Seat validation
    const frontSeatsNum = parseInt(frontSeats) || 0;
    const backSeatsNum = parseInt(backSeats) || 0;
    const totalSeats = frontSeatsNum + backSeatsNum;

    if (frontSeatsNum < 0) {
      newErrors.frontSeats = "Front seats cannot be negative";
    }
    if (backSeatsNum < 0) {
      newErrors.backSeats = "Back seats cannot be negative";
    }
    if (totalSeats < 1) {
      newErrors.seats = "At least 1 seat must be available";
    }

    // Price validation
    const backPriceNum = parseInt(backPrice);
    if (!backPrice || isNaN(backPriceNum) || backPriceNum < 1) {
      newErrors.backPrice = "Back seat price is required (min ₨1)";
    } else if (backPriceNum > 100000) {
      newErrors.backPrice = "Price cannot exceed ₨100,000";
    }

    const frontPriceNum = parseInt(frontPrice);
    if (frontSeatsNum > 0 && frontPrice && !isNaN(frontPriceNum)) {
      if (frontPriceNum < 1) {
        newErrors.frontPrice = "Front seat price must be at least ₨1";
      } else if (frontPriceNum > 100000) {
        newErrors.frontPrice = "Price cannot exceed ₨100,000";
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting || createRide.isPending) return;

    // Validate form
    const formErrors = validateForm();
    setErrors(formErrors);

    // If there are errors, show toast and focus first error field
    if (Object.keys(formErrors).length > 0) {
      const firstError = Object.values(formErrors)[0];
      toast({
        title: "Please fix the errors",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const totalSeats = parseInt(frontSeats || "0") + parseInt(backSeats || "0");
      const calculatedFrontPrice = parseInt(frontPrice) || Math.round(parseInt(backPrice) * 1.5);

      // Log data for debugging
      console.log("Submitting ride data:", {
        origin: from,
        destination: to,
        departure_date: date,
        departure_time: time,
        available_seats: totalSeats,
        price_per_seat: parseInt(backPrice),
        front_seat_price: calculatedFrontPrice,
        back_seat_price: parseInt(backPrice),
        front_seats_available: parseInt(frontSeats) || 0,
        back_seats_available: parseInt(backSeats) || 0,
        description: description || undefined,
        status: "active",
      });

      await createRide.mutateAsync({
        origin: from.trim(),
        destination: to.trim(),
        departure_date: date,
        departure_time: time,
        available_seats: totalSeats,
        price_per_seat: parseInt(backPrice),
        front_seat_price: calculatedFrontPrice,
        back_seat_price: parseInt(backPrice),
        front_seats_available: parseInt(frontSeats) || 0,
        back_seats_available: parseInt(backSeats) || 0,
        description: description.trim() || undefined,
        status: "active",
      });

      toast({
        title: "Ride Published!",
        description: "Your ride is now visible to passengers.",
      });

      // Navigate after successful creation
      navigate("/search");
    } catch (error) {
      console.error("Error creating ride:", error);
      toast({
        title: "Failed to create ride",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFromChange = (value: string, coords?: { lat: number; lng: number }) => {
    setFrom(value);
    setFromCoords(coords || null);
    clearError("from");
  };

  const handleToChange = (value: string, coords?: { lat: number; lng: number }) => {
    setTo(value);
    setToCoords(coords || null);
    clearError("to");
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 px-4 max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold">Offer a Ride</h1>

        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent>
            {hasErrors && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please fix the highlighted errors below before submitting.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Route with Google Maps */}
              <div className="space-y-4">
                <div>
                  <LocationPicker
                    value={from}
                    onChange={handleFromChange}
                    placeholder="From (e.g., Swat, Mingora)"
                    label="Pickup Location *"
                    error={errors.from}
                  />
                </div>
                <div>
                  <LocationPicker
                    value={to}
                    onChange={handleToChange}
                    placeholder="To (e.g., Islamabad, Peshawar, Lahore)"
                    label="Drop-off Location *"
                    error={errors.to}
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium">
                    Departure Date *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        clearError("date");
                      }}
                      className={`pl-10 ${errors.date ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      min={getMinDate()}
                      required
                    />
                  </div>
                  {errors.date && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.date}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-sm font-medium">
                    Departure Time *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => {
                      setTime(e.target.value);
                      clearError("time");
                    }}
                    className={errors.time ? "border-destructive focus-visible:ring-destructive" : ""}
                    required
                  />
                  {errors.time && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.time}
                    </p>
                  )}
                </div>
              </div>

              {/* Seat Availability Section */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Armchair className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Seat Availability & Pricing</h3>
                </div>

                {errors.seats && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.seats}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Front Seats */}
                  <div className="space-y-2 p-3 bg-background rounded-lg border">
                    <Label className="text-sm font-medium">Front Seats</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Count"
                        value={frontSeats}
                        onChange={(e) => {
                          setFrontSeats(e.target.value);
                          clearError("frontSeats");
                          clearError("seats");
                        }}
                        className={`pl-10 ${errors.frontSeats ? "border-destructive" : ""}`}
                        min="0"
                        max="2"
                      />
                    </div>
                    {errors.frontSeats && (
                      <p className="text-sm text-destructive">{errors.frontSeats}</p>
                    )}
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Price (₨)"
                        value={frontPrice}
                        onChange={(e) => {
                          setFrontPrice(e.target.value);
                          clearError("frontPrice");
                        }}
                        className={`pl-10 ${errors.frontPrice ? "border-destructive" : ""}`}
                        min="0"
                      />
                    </div>
                    {errors.frontPrice && (
                      <p className="text-sm text-destructive">{errors.frontPrice}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Premium seat with more space</p>
                  </div>

                  {/* Back Seats */}
                  <div className="space-y-2 p-3 bg-background rounded-lg border">
                    <Label className="text-sm font-medium">Back Seats *</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Count"
                        value={backSeats}
                        onChange={(e) => {
                          setBackSeats(e.target.value);
                          clearError("backSeats");
                          clearError("seats");
                        }}
                        className={`pl-10 ${errors.backSeats ? "border-destructive" : ""}`}
                        min="0"
                        max="4"
                      />
                    </div>
                    {errors.backSeats && (
                      <p className="text-sm text-destructive">{errors.backSeats}</p>
                    )}
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Price (₨) *"
                        value={backPrice}
                        onChange={(e) => {
                          setBackPrice(e.target.value);
                          clearError("backPrice");
                        }}
                        className={`pl-10 ${errors.backPrice ? "border-destructive" : ""}`}
                        min="0"
                        required
                      />
                    </div>
                    {errors.backPrice && (
                      <p className="text-sm text-destructive">{errors.backPrice}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Standard seat pricing (required)</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Total seats: <span className="font-semibold">{(parseInt(frontSeats) || 0) + (parseInt(backSeats) || 0)}</span>
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Trip Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add trip details (e.g., pickup points, stops, vehicle type...)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/500 characters
                </p>
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
                disabled={isSubmitting || createRide.isPending}
              >
                {isSubmitting || createRide.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Publishing...
                  </>
                ) : (
                  "Publish Ride"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <div className="mt-8 rounded-xl bg-muted p-6">
          <h3 className="font-semibold mb-3">Tips for a successful trip</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Set a fair price that covers your fuel costs</li>
            <li>• Front seats typically cost 50% more than back seats</li>
            <li>• Be clear about pickup points and any stops</li>
            <li>• Respond quickly to booking requests</li>
            <li>• Keep your phone accessible on the day of travel</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PostRide;