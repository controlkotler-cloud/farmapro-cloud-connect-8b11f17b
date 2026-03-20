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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          points: number
          requirement_type: string | null
          requirement_value: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          points?: number
          requirement_type?: string | null
          requirement_value?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          points?: number
          requirement_type?: string | null
          requirement_value?: number | null
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean
          max_completions: number | null
          points: number
          start_date: string | null
          title: string
          type: Database["public"]["Enums"]["challenge_type"]
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_completions?: number | null
          points?: number
          start_date?: string | null
          title: string
          type?: Database["public"]["Enums"]["challenge_type"]
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          max_completions?: number | null
          points?: number
          start_date?: string | null
          title?: string
          type?: Database["public"]["Enums"]["challenge_type"]
          xp_reward?: number
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          completed_lessons: string[] | null
          course_id: string
          enrolled_at: string
          id: string
          is_completed: boolean
          progress: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_lessons?: string[] | null
          course_id: string
          enrolled_at?: string
          id?: string
          is_completed?: boolean
          progress?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_lessons?: string[] | null
          course_id?: string
          enrolled_at?: string
          id?: string
          is_completed?: boolean
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_generation_control: {
        Row: {
          created_at: string | null
          current_topic_index: number | null
          cycle_complete: boolean | null
          id: string
          last_updated: string | null
        }
        Insert: {
          created_at?: string | null
          current_topic_index?: number | null
          cycle_complete?: boolean | null
          id?: string
          last_updated?: string | null
        }
        Update: {
          created_at?: string | null
          current_topic_index?: number | null
          cycle_complete?: boolean | null
          id?: string
          last_updated?: string | null
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          content: string | null
          created_at: string
          duration_minutes: number
          id: string
          is_free: boolean
          module_id: string
          order_index: number
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          is_free?: boolean
          module_id: string
          order_index?: number
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          is_free?: boolean
          module_id?: string
          order_index?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          order_index: number
          passing_score: number
          time_limit_minutes: number | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          passing_score?: number
          time_limit_minutes?: number | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          passing_score?: number
          time_limit_minutes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: Database["public"]["Enums"]["course_category"]
          created_at: string
          description: string | null
          difficulty: string
          duration_hours: number
          duration_minutes: number
          id: string
          instructor: string
          is_featured: boolean
          is_premium: boolean
          is_published: boolean
          order_index: number
          rating: number
          slug: string
          students_count: number
          thumbnail_url: string | null
          title: string
          total_lessons: number
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["course_category"]
          created_at?: string
          description?: string | null
          difficulty?: string
          duration_hours?: number
          duration_minutes?: number
          id?: string
          instructor?: string
          is_featured?: boolean
          is_premium?: boolean
          is_published?: boolean
          order_index?: number
          rating?: number
          slug: string
          students_count?: number
          thumbnail_url?: string | null
          title: string
          total_lessons?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["course_category"]
          created_at?: string
          description?: string | null
          difficulty?: string
          duration_hours?: number
          duration_minutes?: number
          id?: string
          instructor?: string
          is_featured?: boolean
          is_premium?: boolean
          is_published?: boolean
          order_index?: number
          rating?: number
          slug?: string
          students_count?: number
          thumbnail_url?: string | null
          title?: string
          total_lessons?: number
          updated_at?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          is_online: boolean
          is_premium: boolean
          is_published: boolean
          location: string | null
          max_attendees: number | null
          meeting_url: string | null
          start_date: string
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_online?: boolean
          is_premium?: boolean
          is_published?: boolean
          location?: string | null
          max_attendees?: number | null
          meeting_url?: string | null
          start_date: string
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_online?: boolean
          is_premium?: boolean
          is_published?: boolean
          location?: string | null
          max_attendees?: number | null
          meeting_url?: string | null
          start_date?: string
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          is_premium: boolean
          name: string
          order_index: number
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name: string
          order_index?: number
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          is_premium?: boolean
          name?: string
          order_index?: number
          slug?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_solution: boolean
          likes_count: number
          parent_id: string | null
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_solution?: boolean
          likes_count?: number
          parent_id?: string | null
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_solution?: boolean
          likes_count?: number
          parent_id?: string | null
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reply_likes: {
        Row: {
          created_at: string
          id: string
          reply_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reply_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reply_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_reply_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          category_id: string
          content: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          last_reply_at: string | null
          replies_count: number
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          category_id: string
          content: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          replies_count?: number
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          category_id?: string
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          replies_count?: number
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_courses_log: {
        Row: {
          category: string | null
          course_id: string | null
          generated_at: string | null
          id: string
          status: string | null
          topic: string | null
        }
        Insert: {
          category?: string | null
          course_id?: string | null
          generated_at?: string | null
          id?: string
          status?: string | null
          topic?: string | null
        }
        Update: {
          category?: string | null
          course_id?: string | null
          generated_at?: string | null
          id?: string
          status?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      generated_resources_log: {
        Row: {
          category: string | null
          generated_at: string | null
          id: string
          resource_id: string | null
          status: string | null
        }
        Insert: {
          category?: string | null
          generated_at?: string | null
          id?: string
          resource_id?: string | null
          status?: string | null
        }
        Update: {
          category?: string | null
          generated_at?: string | null
          id?: string
          resource_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          resume_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          resume_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          resume_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_conversations: {
        Row: {
          applicant_id: string
          applicant_unread: boolean | null
          created_at: string | null
          employer_id: string | null
          employer_unread: boolean | null
          id: string
          job_id: string
          last_message_at: string | null
        }
        Insert: {
          applicant_id: string
          applicant_unread?: boolean | null
          created_at?: string | null
          employer_id?: string | null
          employer_unread?: boolean | null
          id?: string
          job_id: string
          last_message_at?: string | null
        }
        Update: {
          applicant_id?: string
          applicant_unread?: boolean | null
          created_at?: string | null
          employer_id?: string | null
          employer_unread?: boolean | null
          id?: string
          job_id?: string
          last_message_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          applications_count: number
          benefits: string | null
          company_name: string
          contact_email: string | null
          created_at: string
          description: string
          expires_at: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          job_type: string
          location: string
          posted_by: string | null
          requirements: string | null
          salary_range: string | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          applications_count?: number
          benefits?: string | null
          company_name: string
          contact_email?: string | null
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          job_type?: string
          location: string
          posted_by?: string | null
          requirements?: string | null
          salary_range?: string | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          applications_count?: number
          benefits?: string | null
          company_name?: string
          contact_email?: string | null
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          job_type?: string
          location?: string
          posted_by?: string | null
          requirements?: string | null
          salary_range?: string | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      job_listings_public: {
        Row: {
          applications_count: number | null
          benefits: string | null
          company_name: string
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          job_type: string
          location: string
          province: string | null
          requirements: string | null
          salary_range: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          applications_count?: number | null
          benefits?: string | null
          company_name: string
          created_at?: string | null
          description: string
          id: string
          is_active?: boolean | null
          is_featured?: boolean | null
          job_type?: string
          location: string
          province?: string | null
          requirements?: string | null
          salary_range?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          applications_count?: number | null
          benefits?: string | null
          company_name?: string
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          job_type?: string
          location?: string
          province?: string | null
          requirements?: string | null
          salary_range?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      job_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "job_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      pharmacy_listings: {
        Row: {
          address: string
          annual_revenue: number | null
          city: string
          created_at: string
          description: string | null
          email: string | null
          employees_count: number | null
          has_dermocosmetica: boolean
          has_lab: boolean
          has_optica: boolean
          id: string
          is_active: boolean
          is_verified: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          photos: string[] | null
          postal_code: string | null
          province: string | null
          services: string[] | null
          updated_at: string
          views_count: number
          website: string | null
        }
        Insert: {
          address: string
          annual_revenue?: number | null
          city: string
          created_at?: string
          description?: string | null
          email?: string | null
          employees_count?: number | null
          has_dermocosmetica?: boolean
          has_lab?: boolean
          has_optica?: boolean
          id?: string
          is_active?: boolean
          is_verified?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          photos?: string[] | null
          postal_code?: string | null
          province?: string | null
          services?: string[] | null
          updated_at?: string
          views_count?: number
          website?: string | null
        }
        Update: {
          address?: string
          annual_revenue?: number | null
          city?: string
          created_at?: string
          description?: string | null
          email?: string | null
          employees_count?: number | null
          has_dermocosmetica?: boolean
          has_lab?: boolean
          has_optica?: boolean
          id?: string
          is_active?: boolean
          is_verified?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          photos?: string[] | null
          postal_code?: string | null
          province?: string | null
          services?: string[] | null
          updated_at?: string
          views_count?: number
          website?: string | null
        }
        Relationships: []
      }
      pharmacy_listings_public: {
        Row: {
          created_at: string | null
          description: string
          id: string
          images_urls: string[] | null
          is_active: boolean | null
          location: string
          price: number | null
          surface_area: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id: string
          images_urls?: string[] | null
          is_active?: boolean | null
          location: string
          price?: number | null
          surface_area?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          images_urls?: string[] | null
          is_active?: boolean | null
          location?: string
          price?: number | null
          surface_area?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          last_activity_date: string | null
          level: number
          pharmacy_city: string | null
          pharmacy_name: string | null
          points: number
          role: Database["public"]["Enums"]["user_role"]
          streak_days: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          last_activity_date?: string | null
          level?: number
          pharmacy_city?: string | null
          pharmacy_name?: string | null
          points?: number
          role?: Database["public"]["Enums"]["user_role"]
          streak_days?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number
          pharmacy_city?: string | null
          pharmacy_name?: string | null
          points?: number
          role?: Database["public"]["Enums"]["user_role"]
          streak_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          company_name: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          promo_code: string | null
          start_date: string | null
          title: string
          views_count: number
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          promo_code?: string | null
          start_date?: string | null
          title: string
          views_count?: number
        }
        Update: {
          company_name?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          promo_code?: string | null
          start_date?: string | null
          title?: string
          views_count?: number
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answer_text: string | null
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          points_earned: number
          question_id: string
          selected_option_id: string | null
        }
        Insert: {
          answer_text?: string | null
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id: string
          selected_option_id?: string | null
        }
        Update: {
          answer_text?: string | null
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id?: string
          selected_option_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "quiz_question_options"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string
          correct_answers: number
          id: string
          passed: boolean
          quiz_id: string
          score: number
          time_spent_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          correct_answers?: number
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
          time_spent_seconds?: number | null
          total_questions?: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          correct_answers?: number
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          time_spent_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_question_options: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          option_text: string
          order_index: number
          question_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_text: string
          order_index?: number
          question_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          option_text?: string
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: number
          created_at: string
          explanation: string | null
          id: string
          options: Json
          order_index: number
          points: number
          question: string
          quiz_id: string
        }
        Insert: {
          correct_answer?: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          order_index?: number
          points?: number
          question: string
          quiz_id: string
        }
        Update: {
          correct_answer?: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          order_index?: number
          points?: number
          question?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_downloads: {
        Row: {
          downloaded_at: string | null
          id: string
          resource_id: string | null
          user_id: string | null
        }
        Insert: {
          downloaded_at?: string | null
          id?: string
          resource_id?: string | null
          user_id?: string | null
        }
        Update: {
          downloaded_at?: string | null
          id?: string
          resource_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_downloads_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_downloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_generation_control: {
        Row: {
          created_at: string | null
          current_category_index: number | null
          cycle_complete: boolean | null
          id: string
          last_updated: string | null
        }
        Insert: {
          created_at?: string | null
          current_category_index?: number | null
          cycle_complete?: boolean | null
          id?: string
          last_updated?: string | null
        }
        Update: {
          created_at?: string | null
          current_category_index?: number | null
          cycle_complete?: boolean | null
          id?: string
          last_updated?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"]
          created_at: string
          description: string | null
          downloads_count: number
          file_url: string | null
          id: string
          is_premium: boolean
          is_published: boolean
          slug: string
          thumbnail_url: string | null
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          description?: string | null
          downloads_count?: number
          file_url?: string | null
          id?: string
          is_premium?: boolean
          is_published?: boolean
          slug: string
          thumbnail_url?: string | null
          title: string
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          description?: string | null
          downloads_count?: number
          file_url?: string | null
          id?: string
          is_premium?: boolean
          is_published?: boolean
          slug?: string
          thumbnail_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invitation_token: string | null
          invited_at: string
          invited_email: string | null
          joined_at: string | null
          member_role: Database["public"]["Enums"]["team_member_role"]
          status: string
          team_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_at?: string
          invited_email?: string | null
          joined_at?: string | null
          member_role?: Database["public"]["Enums"]["team_member_role"]
          status?: string
          team_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_at?: string
          invited_email?: string | null
          joined_at?: string | null
          member_role?: Database["public"]["Enums"]["team_member_role"]
          status?: string
          team_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      team_subscriptions: {
        Row: {
          created_at: string
          id: string
          max_members: number
          name: string
          owner_id: string
          status: string
          stripe_subscription_id: string | null
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_members?: number
          name?: string
          owner_id: string
          status?: string
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_members?: number
          name?: string
          owner_id?: string
          status?: string
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_subscriptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string | null
          completed_at: string | null
          created_at: string | null
          current_count: number | null
          id: string
          points_earned: number | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_count?: number | null
          id?: string
          points_earned?: number | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_count?: number | null
          id?: string
          points_earned?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          created_at: string
          email_community: boolean
          email_courses: boolean
          email_promotions: boolean
          id: string
          push_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_community?: boolean
          email_courses?: boolean
          email_promotions?: boolean
          id?: string
          push_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_community?: boolean
          email_courses?: boolean
          email_promotions?: boolean
          id?: string
          push_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          id: string
          level: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          level?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          level?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_points: {
        Args: { p_points: number; p_user_id: string }
        Returns: undefined
      }
      calculate_quiz_stats: {
        Args: { p_quiz_id: string }
        Returns: {
          avg_score: number
          pass_rate: number
          total_attempts: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      challenge_type:
        | "daily"
        | "weekly"
        | "monthly"
        | "special"
        | "course_started"
        | "course_completed"
        | "resource_downloaded"
        | "forum_post"
        | "forum_reply"
      course_category:
        | "ventas"
        | "marketing"
        | "gestion"
        | "liderazgo"
        | "atencion"
        | "otros"
        | "atencion_cliente"
        | "tecnologia"
      notification_type:
        | "system"
        | "course"
        | "forum"
        | "challenge"
        | "achievement"
        | "promotion"
      resource_category:
        | "ventas"
        | "marketing"
        | "gestion"
        | "liderazgo"
        | "atencion"
        | "otros"
        | "finanzas"
        | "digital"
      resource_format: "pdf" | "docs" | "url" | "xls" | "video"
      resource_type:
        | "pdf"
        | "video"
        | "infografia"
        | "plantilla"
        | "guia"
        | "otro"
        | "protocolo"
        | "calculadora"
        | "checklist"
        | "manual"
        | "herramienta"
      subscription_status: "active" | "canceled" | "expired" | "trialing"
      team_member_role: "premium" | "profesional"
      user_role: "freemium" | "estudiante" | "profesional" | "premium" | "admin"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      challenge_type: [
        "daily",
        "weekly",
        "monthly",
        "special",
        "course_started",
        "course_completed",
        "resource_downloaded",
        "forum_post",
        "forum_reply",
      ],
      course_category: [
        "ventas",
        "marketing",
        "gestion",
        "liderazgo",
        "atencion",
        "otros",
        "atencion_cliente",
        "tecnologia",
      ],
      notification_type: [
        "system",
        "course",
        "forum",
        "challenge",
        "achievement",
        "promotion",
      ],
      resource_category: [
        "ventas",
        "marketing",
        "gestion",
        "liderazgo",
        "atencion",
        "otros",
        "finanzas",
        "digital",
      ],
      resource_format: ["pdf", "docs", "url", "xls", "video"],
      resource_type: [
        "pdf",
        "video",
        "infografia",
        "plantilla",
        "guia",
        "otro",
        "protocolo",
        "calculadora",
        "checklist",
        "manual",
        "herramienta",
      ],
      subscription_status: ["active", "canceled", "expired", "trialing"],
      team_member_role: ["premium", "profesional"],
      user_role: ["freemium", "estudiante", "profesional", "premium", "admin"],
    },
  },
} as const
