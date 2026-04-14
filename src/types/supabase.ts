// Auto-generated Supabase types for NAFA
// Run `supabase gen types typescript --local > src/types/supabase.ts` to regenerate

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'client' | 'vendor' | 'admin';
          first_name: string;
          last_name: string;
          phone: string | null;
          country: string;
          region: string | null;
          language: string;
          currency: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: 'client' | 'vendor' | 'admin';
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          country?: string;
          region?: string | null;
          language?: string;
          currency?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      vendor_profiles: {
        Row: {
          id: string;
          shop_name: string;
          shop_description: string | null;
          cover_photo_url: string | null;
          cnib_url: string | null;
          shop_type: 'online' | 'physical';
          shop_address: string | null;
          is_verified: boolean;
          is_suspended: boolean;
          is_pending: boolean;
          rating: number;
          review_count: number;
          total_sales: number;
          total_revenue: number;
          follower_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['vendor_profiles']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['vendor_profiles']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          vendor_id: string;
          title: string;
          description: string | null;
          price: number;
          currency: string;
          images: string[];
          category: string | null;
          stock: number;
          rating: number;
          review_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          client_id: string;
          vendor_id: string;
          subtotal: number;
          delivery_fee: number;
          total: number;
          currency: string;
          delivery_street: string;
          delivery_city: string;
          delivery_region: string | null;
          delivery_country: string;
          payment_method: 'orange_money' | 'moov_money' | 'card';
          payment_status: 'pending' | 'paid' | 'failed';
          order_status: 'placed' | 'confirmed' | 'preparing' | 'in_transit_warehouse' | 'at_warehouse' | 'delivering' | 'delivered' | 'cancelled';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          title: string;
          price: number;
          quantity: number;
          image: string | null;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: Database['public']['Tables']['orders']['Row']['order_status'];
          updated_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_status_history']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_status_history']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'order_update' | 'promo' | 'review' | 'system';
          title: string;
          body: string | null;
          is_read: boolean;
          linked_order_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          order_id: string;
          rating: number;
          comment: string | null;
          type: 'client_to_vendor' | 'vendor_to_client';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      follows: {
        Row: {
          follower_id: string;
          vendor_id: string;
          created_at: string;
        };
        Insert: { follower_id: string; vendor_id: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['follows']['Insert']>;
      };
      wallets: {
        Row: { vendor_id: string; balance: number };
        Insert: { vendor_id: string; balance?: number };
        Update: { balance?: number };
      };
      withdrawals: {
        Row: {
          id: string;
          vendor_id: string;
          amount: number;
          method: 'orange_money' | 'moov_money' | 'card';
          status: 'pending' | 'completed' | 'failed';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['withdrawals']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['withdrawals']['Insert']>;
      };
      alerts: {
        Row: {
          id: string;
          type: 'vendor_inactive' | 'delivery_late' | 'payment_failed' | 'high_cancellation';
          severity: 'warning' | 'critical';
          related_order_id: string | null;
          related_vendor_id: string | null;
          description: string | null;
          is_resolved: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: 'client' | 'vendor' | 'admin';
      };
    };
    Enums: Record<string, never>;
  };
};
