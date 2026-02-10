import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BookingData {
  id: string;
  seats_booked: number;
  seat_type: string;
  status: string;
  created_at: string;
  cancellation_reason: string | null;
  passenger_id: string;
  passenger: {
    full_name: string | null;
    phone_number: string | null;
  } | null;
  ride: {
    origin: string;
    destination: string;
    departure_date: string;
    departure_time: string;
    front_seat_price: number | null;
    back_seat_price: number | null;
    driver_id: string;
    driver: {
      full_name: string | null;
      phone_number: string | null;
    } | null;
  } | null;
}

async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    console.error("WhatsApp API credentials not configured");
    return { success: false, error: "WhatsApp API not configured" };
  }

  const formattedPhone = phoneNumber.replace(/\D/g, "");

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: { body: message },
        }),
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      console.error("WhatsApp API error:", result);
      return { success: false, error: result.error?.message || "Failed to send message" };
    }

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (err) {
    const error = err as Error;
    console.error("Error sending WhatsApp message:", error.message);
    return { success: false, error: error.message };
  }
}

async function createNotification(
  supabase: any,
  userId: string,
  type: string,
  title: string,
  message: string,
  bookingId?: string,
  rideId?: string
) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      related_booking_id: bookingId || null,
      related_ride_id: rideId || null,
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const adminPhone = Deno.env.get("ADMIN_WHATSAPP_NUMBER");

    // ---- Authentication ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Service role client for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, notificationType, cancellationReason } = await req.json();

    if (!bookingId || typeof bookingId !== "string") {
      return new Response(
        JSON.stringify({ error: "Valid Booking ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- Fetch booking & authorize ----
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        seats_booked,
        seat_type,
        status,
        created_at,
        cancellation_reason,
        passenger_id,
        passenger:profiles!bookings_passenger_id_fkey(full_name, phone_number),
        ride:rides!bookings_ride_id_fkey(
          origin,
          destination,
          departure_date,
          departure_time,
          front_seat_price,
          back_seat_price,
          driver_id,
          driver:profiles!rides_driver_id_fkey(full_name, phone_number)
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !bookingData) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const booking = bookingData as unknown as BookingData;

    // Authorization: caller must be the passenger or the driver
    const isPassenger = booking.passenger_id === userId;
    const isDriver = booking.ride?.driver_id === userId;

    if (!isPassenger && !isDriver) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const passengerName = booking.passenger?.full_name || "Passenger";
    const passengerPhone = booking.passenger?.phone_number;
    const driverName = booking.ride?.driver?.full_name || "Driver";
    const driverPhone = booking.ride?.driver?.phone_number;
    const driverId = booking.ride?.driver_id;
    const seatPrice = booking.seat_type === "front"
      ? (booking.ride?.front_seat_price || 0)
      : (booking.ride?.back_seat_price || 0);
    const totalPrice = seatPrice * booking.seats_booked;

    const results: Array<{ recipient: string; success: boolean; error?: string; messageId?: string }> = [];

    if (notificationType === "cancellation") {
      const reason = cancellationReason || booking.cancellation_reason || "No reason provided";
      
      const driverCancellationMessage = `
⚠️ *Booking Cancelled - SwatPool*

📋 *Booking ID:* ${booking.id.slice(0, 8).toUpperCase()}
👤 *Passenger:* ${passengerName}

📍 *Route:*
From: ${booking.ride?.origin || "N/A"}
To: ${booking.ride?.destination || "N/A"}

📅 *Date:* ${booking.ride?.departure_date || "N/A"}
⏰ *Time:* ${booking.ride?.departure_time || "N/A"}

💺 *Seats Cancelled:* ${booking.seats_booked} ${booking.seat_type} seat(s)

❌ *Cancellation Reason:*
${reason}

The seat(s) are now available for other passengers.
      `.trim();

      if (driverPhone) {
        const driverResult = await sendWhatsAppMessage(driverPhone, driverCancellationMessage);
        results.push({ recipient: "driver", ...driverResult });
      }

      if (driverId) {
        await createNotification(
          supabase,
          driverId,
          "booking_cancelled",
          "Booking Cancelled",
          `${passengerName} cancelled their booking for ${booking.ride?.origin} → ${booking.ride?.destination}. Reason: ${reason}`,
          bookingId
        );
      }

      if (adminPhone) {
        const adminMessage = `
📊 *Admin Alert - Booking Cancelled*

📋 *ID:* ${booking.id.slice(0, 8).toUpperCase()}
👤 *Passenger:* ${passengerName}
📍 *Route:* ${booking.ride?.origin || "N/A"} → ${booking.ride?.destination || "N/A"}
💺 *Seats:* ${booking.seats_booked} ${booking.seat_type}
❌ *Reason:* ${reason}
        `.trim();

        const adminResult = await sendWhatsAppMessage(adminPhone, adminMessage);
        results.push({ recipient: "admin", ...adminResult });
      }
    } else {
      const bookingDetails = `
🚗 *SwatPool Booking Confirmation*

📋 *Booking ID:* ${booking.id.slice(0, 8).toUpperCase()}
👤 *Passenger:* ${passengerName}
🚘 *Driver:* ${driverName}

📍 *Route:*
From: ${booking.ride?.origin || "N/A"}
To: ${booking.ride?.destination || "N/A"}

📅 *Date:* ${booking.ride?.departure_date || "N/A"}
⏰ *Time:* ${booking.ride?.departure_time || "N/A"}

💺 *Seats:* ${booking.seats_booked} ${booking.seat_type} seat(s)
💰 *Total:* ₨${totalPrice}

Status: ${booking.status.toUpperCase()}

Thank you for using SwatPool!
      `.trim();

      if (passengerPhone) {
        const passengerResult = await sendWhatsAppMessage(passengerPhone, bookingDetails);
        results.push({ recipient: "passenger", ...passengerResult });
      }

      if (driverPhone) {
        const driverMessage = `
🔔 *New Booking Request - SwatPool*

📋 *Booking ID:* ${booking.id.slice(0, 8).toUpperCase()}
👤 *Passenger:* ${passengerName}

📍 *Route:*
From: ${booking.ride?.origin || "N/A"}
To: ${booking.ride?.destination || "N/A"}

📅 *Date:* ${booking.ride?.departure_date || "N/A"}
⏰ *Time:* ${booking.ride?.departure_time || "N/A"}

💺 *Seats Requested:* ${booking.seats_booked} ${booking.seat_type} seat(s)
💰 *Total Fare:* ₨${totalPrice}

Please confirm or reject this booking in the app.
        `.trim();

        const driverResult = await sendWhatsAppMessage(driverPhone, driverMessage);
        results.push({ recipient: "driver", ...driverResult });
      }

      if (driverId) {
        await createNotification(
          supabase,
          driverId,
          "new_booking",
          "New Booking Request",
          `${passengerName} requested ${booking.seats_booked} ${booking.seat_type} seat(s) for ${booking.ride?.origin} → ${booking.ride?.destination}`,
          bookingId
        );
      }

      if (adminPhone) {
        const adminMessage = `
📊 *Admin Alert - New Booking*

📋 *ID:* ${booking.id.slice(0, 8).toUpperCase()}
👤 *Passenger:* ${passengerName}
📍 *Route:* ${booking.ride?.origin || "N/A"} → ${booking.ride?.destination || "N/A"}
📅 *Date:* ${booking.ride?.departure_date || "N/A"} at ${booking.ride?.departure_time || "N/A"}
💺 *Seats:* ${booking.seats_booked} ${booking.seat_type}
💰 *Amount:* ₨${totalPrice}
        `.trim();

        const adminResult = await sendWhatsAppMessage(adminPhone, adminMessage);
        results.push({ recipient: "admin", ...adminResult });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const error = err as Error;
    console.error("Error processing notification:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
