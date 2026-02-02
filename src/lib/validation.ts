import { z } from "zod";

/**
 * Validation schemas for form inputs across the application
 */

// Phone number validation (Pakistan format)
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+92|0)?[3][0-9]{9}$/, {
    message: "Enter a valid Pakistani phone number (e.g., 03001234567 or +923001234567)",
  });

// Location validation
export const locationSchema = z
  .string()
  .trim()
  .min(2, { message: "Location must be at least 2 characters" })
  .max(100, { message: "Location must be less than 100 characters" });

// Date validation (must be today or future)
export const futureDateSchema = z
  .string()
  .refine((val) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(val);
    return inputDate >= today;
  }, { message: "Date must be today or in the future" });

// Price validation
export const priceSchema = z
  .number()
  .min(1, { message: "Price must be at least 1" })
  .max(100000, { message: "Price cannot exceed 100,000" });

// Seats validation
export const seatsSchema = z
  .number()
  .int()
  .min(0, { message: "Seats cannot be negative" })
  .max(10, { message: "Maximum 10 seats allowed" });

// Description validation
export const descriptionSchema = z
  .string()
  .trim()
  .max(500, { message: "Description must be less than 500 characters" })
  .optional();

// Full ride form schema
export const rideFormSchema = z.object({
  origin: locationSchema,
  destination: locationSchema,
  departure_date: futureDateSchema,
  departure_time: z.string().min(1, { message: "Time is required" }),
  front_seats: seatsSchema,
  back_seats: seatsSchema,
  front_price: priceSchema,
  back_price: priceSchema,
  description: descriptionSchema,
}).refine((data) => data.front_seats + data.back_seats >= 1, {
  message: "At least 1 seat must be available",
  path: ["front_seats"],
});

// Booking validation
export const bookingFormSchema = z.object({
  rideId: z.string().uuid({ message: "Invalid ride ID" }),
  seats: z.number().int().min(1, { message: "Must book at least 1 seat" }),
  seatType: z.enum(["front", "back"], { message: "Invalid seat type" }),
});

// Profile validation
export const profileFormSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  phone_number: phoneSchema,
  emergency_contact: phoneSchema.optional().or(z.literal("")),
  emergency_contact_name: z
    .string()
    .trim()
    .max(100, { message: "Name must be less than 100 characters" })
    .optional()
    .or(z.literal("")),
});

// Search validation
export const searchFormSchema = z.object({
  from: locationSchema.optional().or(z.literal("")),
  to: locationSchema.optional().or(z.literal("")),
});

/**
 * Utility function to safely parse and validate data
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((err) => 
    `${err.path.join('.')}: ${err.message}`
  );
  
  return { success: false, errors };
}

/**
 * Generates a unique identifier for booking/ride references
 * Uses a combination of timestamp and random string for uniqueness
 */
export function generateUniqueReference(prefix: string = ""): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${randomPart}`.toUpperCase();
}

/**
 * Validates UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
