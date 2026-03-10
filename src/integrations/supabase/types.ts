export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          id: string
          passenger_id: string
          ride_id: string
          seat_type: string | null
          seats_booked: number
          status: string
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          passenger_id: string
          ride_id: string
          seat_type?: string | null
          seats_booked?: number
          status?: string
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          id?: string
          passenger_id?: string
          ride_id?: string
          seat_type?: string | null
          seats_booked?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "driver_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_booking_id: string | null
          related_ride_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_booking_id?: string | null
          related_ride_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_booking_id?: string | null
          related_ride_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_ride_id_fkey"
            columns: ["related_ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          driver_id: string
          id: string
          passenger_id: string
          payment_method: string
          payment_status: string
          rejection_reason: string | null
          ride_id: string
          screenshot_url: string | null
          transaction_reference: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          wallet_name: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          driver_id: string
          id?: string
          passenger_id: string
          payment_method: string
          payment_status?: string
          rejection_reason?: string | null
          ride_id: string
          screenshot_url?: string | null
          transaction_reference?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          wallet_name?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          driver_id?: string
          id?: string
          passenger_id?: string
          payment_method?: string
          payment_status?: string
          rejection_reason?: string | null
          ride_id?: string
          screenshot_url?: string | null
          transaction_reference?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          wallet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          emergency_contact: string | null
          emergency_contact_name: string | null
          full_name: string | null
          id: string
          is_driver: boolean | null
          phone_number: string | null
          profile_completed: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          full_name?: string | null
          id: string
          is_driver?: boolean | null
          phone_number?: string | null
          profile_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          full_name?: string | null
          id?: string
          is_driver?: boolean | null
          phone_number?: string | null
          profile_completed?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          driver_id: string
          id: string
          passenger_id: string
          rating: number
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          driver_id: string
          id?: string
          passenger_id: string
          rating: number
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          passenger_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "driver_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          available_seats: number
          back_seat_price: number | null
          back_seats_available: number | null
          created_at: string
          departure_date: string
          departure_time: string
          description: string | null
          destination: string
          driver_id: string
          front_seat_price: number | null
          front_seats_available: number | null
          id: string
          origin: string
          price_per_seat: number
          status: string
          updated_at: string
        }
        Insert: {
          available_seats: number
          back_seat_price?: number | null
          back_seats_available?: number | null
          created_at?: string
          departure_date: string
          departure_time: string
          description?: string | null
          destination: string
          driver_id: string
          front_seat_price?: number | null
          front_seats_available?: number | null
          id?: string
          origin: string
          price_per_seat: number
          status?: string
          updated_at?: string
        }
        Update: {
          available_seats?: number
          back_seat_price?: number | null
          back_seats_available?: number | null
          created_at?: string
          departure_date?: string
          departure_time?: string
          description?: string | null
          destination?: string
          driver_id?: string
          front_seat_price?: number | null
          front_seats_available?: number | null
          id?: string
          origin?: string
          price_per_seat?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string | null
          driver_id: string
          id: string
          license_plate: string
          seats_available: number | null
          updated_at: string | null
          vehicle_color: string
          vehicle_make: string
          vehicle_model: string
          vehicle_type: string
          vehicle_year: number | null
        }
        Insert: {
          created_at?: string | null
          driver_id: string
          id?: string
          license_plate: string
          seats_available?: number | null
          updated_at?: string | null
          vehicle_color: string
          vehicle_make: string
          vehicle_model: string
          vehicle_type: string
          vehicle_year?: number | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string
          id?: string
          license_plate?: string
          seats_available?: number | null
          updated_at?: string | null
          vehicle_color?: string
          vehicle_make?: string
          vehicle_model?: string
          vehicle_type?: string
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "driver_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      driver_public_profile: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_driver: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_driver?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_driver?: boolean | null
        }
        Relationships: []
      }
      vehicles_public: {
        Row: {
          created_at: string | null
          driver_id: string | null
          id: string | null
          seats_available: number | null
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_type: string | null
          vehicle_year: number | null
        }
        Insert: {
          created_at?: string | null
          driver_id?: string | null
          id?: string | null
          seats_available?: number | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string | null
          id?: string | null
          seats_available?: number | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "driver_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cancel_booking: {
        Args: { _booking_id: string; _reason?: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          _message: string
          _related_booking_id?: string
          _related_ride_id?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      get_driver_profile_for_booking: {
        Args: { _driver_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          is_driver: boolean
          phone_number: string
        }[]
      }
      update_payment_proof: {
        Args: {
          _payment_id: string
          _screenshot_url?: string
          _transaction_reference?: string
        }
        Returns: undefined
      }
      verify_payment: {
        Args: {
          _action: string
          _payment_id: string
          _rejection_reason?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
