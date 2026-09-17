// Tipos manuais que espelham supabase/schema.sql. Se você alterar o schema,
// atualize aqui também (ou gere via `supabase gen types typescript`).
export type Database = {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Tables: {
      event: {
        Row: {
          id: string;
          name: string;
          event_date: string | null;
          location: string | null;
          cover_key: string | null;
          accent_color: string;
          color_bg: string;
          color_surface: string;
          color_text: string;
          color_accent_soft: string;
          color_ornamental: string;
          color_border: string;
          logo_key: string | null;
          admin_password_hash: string;
          public_base_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          event_date?: string | null;
          location?: string | null;
          cover_key?: string | null;
          accent_color?: string;
          color_bg?: string;
          color_surface?: string;
          color_text?: string;
          color_accent_soft?: string;
          color_ornamental?: string;
          color_border?: string;
          logo_key?: string | null;
          admin_password_hash: string;
          public_base_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['event']['Insert']>;
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          event_id: string;
          original_key: string;
          thumb_key: string;
          width: number | null;
          height: number | null;
          face_count: number;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          original_key: string;
          thumb_key: string;
          width?: number | null;
          height?: number | null;
          face_count?: number;
          uploaded_at?: string;
        };
        Update: Partial<Database['public']['Tables']['photos']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'photos_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'event';
            referencedColumns: ['id'];
          },
        ];
      };
      face_descriptors: {
        Row: { id: string; photo_id: string; embedding: number[] };
        Insert: { id?: string; photo_id: string; embedding: number[] };
        Update: Partial<Database['public']['Tables']['face_descriptors']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'face_descriptors_photo_id_fkey';
            columns: ['photo_id'];
            isOneToOne: false;
            referencedRelation: 'photos';
            referencedColumns: ['id'];
          },
        ];
      };
      guests: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          phone: string | null;
          matched_photo_ids: string[];
          registered_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          phone?: string | null;
          matched_photo_ids?: string[];
          registered_at?: string;
        };
        Update: Partial<Database['public']['Tables']['guests']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'guests_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'event';
            referencedColumns: ['id'];
          },
        ];
      };
    };
  };
};
