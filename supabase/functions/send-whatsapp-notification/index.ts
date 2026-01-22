import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingData {
  id: string;
  seats_booked: number;
  seat_type: string;
  status: string;
  created_at: string;
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

  // Format phone number (remove any non-numeric chars and ensure country code)
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

    console.log("WhatsApp message sent successfully:", result);
    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (err) {
    const error = err as Error;
    console.error("Error sending WhatsApp message:", error);
    return { success: false, error: error.message };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminPhone = Deno.env.get("ADMIN_WHATSAPP_NUMBER");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId } = await req.json();

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: "Booking ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch booking details with related data
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        seats_booked,
        seat_type,
        status,
        created_at,
        passenger:profiles!bookings_passenger_id_fkey(full_name, phone_number),
        ride:rides!bookings_ride_id_fkey(
          origin,
          destination,
          departure_date,
          departure_time,
          front_seat_price,
          back_seat_price,
          driver:profiles!rides_driver_id_fkey(full_name, phone_number)
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !bookingData) {
      console.error("Failed to fetch booking:", bookingError);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cast to our expected type
    const booking = bookingData as unknown as BookingData;

    const passengerName = booking.passenger?.full_name || "Passenger";
    const passengerPhone = booking.passenger?.phone_number;
    const driverName = booking.ride?.driver?.full_name || "Driver";
    const driverPhone = booking.ride?.driver?.phone_number;
    const seatPrice = booking.seat_type === "front" 
      ? (booking.ride?.front_seat_price || 0)
      : (booking.ride?.back_seat_price || 0);
    const totalPrice = seatPrice * booking.seats_booked;

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

    const results: Array<{ recipient: string; success: boolean; error?: string; messageId?: string }> = [];

    // Send to passenger if phone available
    if (passengerPhone) {
      const passengerResult = await sendWhatsAppMessage(passengerPhone, bookingDetails);
      results.push({ recipient: "passenger", ...passengerResult });
    }

    // Send to driver if phone available
    if (driverPhone) {
      const driverMessage = `
🔔 *New Booking Request - SwatPool*

📋 *Booking ID:* ${booking.id.slice(0, 8).toUpperCase()}
👤 *Passenger:* ${passengerName}
📱 *Contact:* ${passengerPhone || "Not provided"}

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

    // Send to admin for monitoring
    if (adminPhone) {
      const adminMessage = `
📊 *Admin Alert - New Booking*

📋 *ID:* ${booking.id.slice(0, 8).toUpperCase()}
👤 *Passenger:* ${passengerName} (${passengerPhone || "No phone"})
🚘 *Driver:* ${driverName} (${driverPhone || "No phone"})
📍 *Route:* ${booking.ride?.origin || "N/A"} → ${booking.ride?.destination || "N/A"}
📅 *Date:* ${booking.ride?.departure_date || "N/A"} at ${booking.ride?.departure_time || "N/A"}
💺 *Seats:* ${booking.seats_booked} ${booking.seat_type}
💰 *Amount:* ₨${totalPrice}
⏱️ *Booked at:* ${new Date(booking.created_at).toLocaleString()}
      `.trim();

      const adminResult = await sendWhatsAppMessage(adminPhone, adminMessage);
      results.push({ recipient: "admin", ...adminResult });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const error = err as Error;
    console.error("Error processing notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
