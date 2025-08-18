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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          points_reward: number
          target_count: number | null
          type: Database["public"]["Enums"]["challenge_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_reward: number
          target_count?: number | null
          type: Database["public"]["Enums"]["challenge_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_reward?: number
          target_count?: number | null
          type?: Database["public"]["Enums"]["challenge_type"]
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string | null
          id: string
          progress: number | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          course_id?: string | null
          id?: string
          progress?: number | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string | null
          id?: string
          progress?: number | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      course_quizzes: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_attempts: number | null
          passing_score: number
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_attempts?: number | null
          passing_score?: number
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_attempts?: number | null
          passing_score?: number
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
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
          content: string | null
          course_modules: Json | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          featured_image_url: string | null
          id: string
          is_premium: boolean | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["course_category"]
          content?: string | null
          course_modules?: Json | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          featured_image_url?: string | null
          id?: string
          is_premium?: boolean | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["course_category"]
          content?: string | null
          course_modules?: Json | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          featured_image_url?: string | null
          id?: string
          is_premium?: boolean | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          description: string
          end_date: string | null
          event_type: string
          id: string
          image_url: string | null
          is_featured: boolean | null
          location: string | null
          registration_url: string | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          end_date?: string | null
          event_type: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location?: string | null
          registration_url?: string | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          end_date?: string | null
          event_type?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          location?: string | null
          registration_url?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_premium: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean | null
          name?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_reply_id: string | null
          thread_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_reply_id?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_reply_id?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
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
          created_at: string | null
          id: string
          reply_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reply_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reply_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_reply_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_reply_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          last_reply_at: string | null
          replies_count: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          last_reply_at?: string | null
          replies_count?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          last_reply_at?: string | null
          replies_count?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          course_id: string | null
          created_at: string | null
          error_message: string | null
          generated_at: string | null
          id: string
          level: string | null
          status: string | null
          topic: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          error_message?: string | null
          generated_at?: string | null
          id?: string
          level?: string | null
          status?: string | null
          topic: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          error_message?: string | null
          generated_at?: string | null
          id?: string
          level?: string | null
          status?: string | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_courses_log_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_resources_log: {
        Row: {
          category: string
          created_at: string | null
          error_message: string | null
          generated_at: string | null
          id: string
          resource_id: string | null
          status: string | null
          type: string
        }
        Insert: {
          category: string
          created_at?: string | null
          error_message?: string | null
          generated_at?: string | null
          id?: string
          resource_id?: string | null
          status?: string | null
          type: string
        }
        Update: {
          category?: string
          created_at?: string | null
          error_message?: string | null
          generated_at?: string | null
          id?: string
          resource_id?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_resources_log_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          company_name: string
          contact_email: string
          created_at: string | null
          description: string
          employer_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          location: string
          requirements: string | null
          salary_range: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_name: string
          contact_email: string
          created_at?: string | null
          description: string
          employer_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          location: string
          requirements?: string | null
          salary_range?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          contact_email?: string
          created_at?: string | null
          description?: string
          employer_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string
          requirements?: string | null
          salary_range?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_listings_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          target_id: string | null
          target_url: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          target_id?: string | null
          target_url?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          target_id?: string | null
          target_url?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_listings: {
        Row: {
          annual_revenue: number | null
          contact_email: string
          created_at: string | null
          description: string
          id: string
          images_urls: string[] | null
          is_active: boolean | null
          location: string
          price: number | null
          seller_id: string | null
          surface_area: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          annual_revenue?: number | null
          contact_email: string
          created_at?: string | null
          description: string
          id?: string
          images_urls?: string[] | null
          is_active?: boolean | null
          location: string
          price?: number | null
          seller_id?: string | null
          surface_area?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          annual_revenue?: number | null
          contact_email?: string
          created_at?: string | null
          description?: string
          id?: string
          images_urls?: string[] | null
          is_active?: boolean | null
          location?: string
          price?: number | null
          seller_id?: string | null
          surface_area?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          pharmacy_name: string | null
          position: string | null
          stripe_customer_id: string | null
          student_document_url: string | null
          student_verification_status: string | null
          subscription_role: Database["public"]["Enums"]["user_role"] | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          pharmacy_name?: string | null
          position?: string | null
          stripe_customer_id?: string | null
          student_document_url?: string | null
          student_verification_status?: string | null
          subscription_role?: Database["public"]["Enums"]["user_role"] | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          pharmacy_name?: string | null
          position?: string | null
          stripe_customer_id?: string | null
          student_document_url?: string | null
          student_verification_status?: string | null
          subscription_role?: Database["public"]["Enums"]["user_role"] | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          company_name: string
          company_type: string
          created_at: string | null
          description: string
          discount_details: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          terms_conditions: string | null
          title: string
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          company_name: string
          company_type: string
          created_at?: string | null
          description: string
          discount_details?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          terms_conditions?: string | null
          title: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          company_name?: string
          company_type?: string
          created_at?: string | null
          description?: string
          discount_details?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          terms_conditions?: string | null
          title?: string
          updated_at?: string | null
          valid_until?: string | null
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
          attempt_number: number
          completed_at: string | null
          id: string
          max_score: number
          passed: boolean
          percentage: number
          quiz_id: string
          score: number
          started_at: string
          time_taken_seconds: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          attempt_number?: number
          completed_at?: string | null
          id?: string
          max_score: number
          passed?: boolean
          percentage?: number
          quiz_id: string
          score?: number
          started_at?: string
          time_taken_seconds?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          attempt_number?: number
          completed_at?: string | null
          id?: string
          max_score?: number
          passed?: boolean
          percentage?: number
          quiz_id?: string
          score?: number
          started_at?: string
          time_taken_seconds?: number | null
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
          created_at: string
          explanation: string | null
          id: string
          order_index: number
          points: number
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          order_index?: number
          points?: number
          question_text: string
          question_type?: string
          quiz_id: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          order_index?: number
          points?: number
          question_text?: string
          question_type?: string
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
          created_at: string | null
          description: string | null
          download_count: number | null
          file_url: string | null
          format: Database["public"]["Enums"]["resource_format"]
          id: string
          is_premium: boolean | null
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["resource_category"]
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          format: Database["public"]["Enums"]["resource_format"]
          id?: string
          is_premium?: boolean | null
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          format?: Database["public"]["Enums"]["resource_format"]
          id?: string
          is_premium?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string | null
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
          details: Json
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
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
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
          owner_id: string
          status: string
          stripe_subscription_id: string | null
          team_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_members?: number
          owner_id: string
          status?: string
          stripe_subscription_id?: string | null
          team_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_members?: number
          owner_id?: string
          status?: string
          stripe_subscription_id?: string | null
          team_name?: string
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      job_listings_public: {
        Row: {
          company_name: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string | null
          is_active: boolean | null
          location: string | null
          requirements: string | null
          salary_range: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          location?: string | null
          requirements?: string | null
          salary_range?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          location?: string | null
          requirements?: string | null
          salary_range?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_user_points: {
        Args: { points: number; user_id: string }
        Returns: undefined
      }
      calculate_quiz_stats: {
        Args: { quiz_id_param: string }
        Returns: {
          average_score: number
          pass_rate: number
          total_attempts: number
          total_users: number
        }[]
      }
      calculate_team_price: {
        Args: { member_count: number }
        Returns: number
      }
      can_access_contact_info: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_access_user_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      get_job_contact_email: {
        Args: { job_id: string }
        Returns: string
      }
      get_job_contact_email_rpc: {
        Args: { job_id: string }
        Returns: string
      }
      get_job_contact_email_secure: {
        Args: { job_id_param: string }
        Returns: string
      }
      get_pharmacy_contact_email: {
        Args: { pharmacy_id: string }
        Returns: string
      }
      get_pharmacy_contact_email_secure: {
        Args: { pharmacy_id_param: string }
        Returns: string
      }
      is_active_team_member_of_subscription: {
        Args: { subscription_id: string; user_id: string }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_team_member: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_team_owner_strict: {
        Args: { team_id_param: string; user_id_param: string }
        Returns: boolean
      }
      is_team_subscription_owner: {
        Args: { subscription_id: string; user_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: { details: Json; event_type: string; user_id_param?: string }
        Returns: undefined
      }
      update_challenge_progress: {
        Args: { challenge_id_param: string; points_earned_param?: number }
        Returns: undefined
      }
      validate_team_invitation: {
        Args: {
          invitation_token_param: string
          team_id_param: string
          user_email_param: string
        }
        Returns: boolean
      }
    }
    Enums: {
      challenge_type:
        | "course_started"
        | "course_completed"
        | "resource_downloaded"
        | "forum_post"
        | "forum_reply"
      course_category:
        | "gestion"
        | "marketing"
        | "liderazgo"
        | "atencion_cliente"
        | "tecnologia"
      resource_category:
        | "atencion"
        | "marketing"
        | "gestion"
        | "liderazgo"
        | "finanzas"
        | "digital"
      resource_format: "pdf" | "docs" | "url" | "xls" | "video"
      resource_type:
        | "protocolo"
        | "calculadora"
        | "plantilla"
        | "guia"
        | "checklist"
        | "manual"
        | "herramienta"
      subscription_status: "active" | "canceled" | "expired" | "trialing"
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
      challenge_type: [
        "course_started",
        "course_completed",
        "resource_downloaded",
        "forum_post",
        "forum_reply",
      ],
      course_category: [
        "gestion",
        "marketing",
        "liderazgo",
        "atencion_cliente",
        "tecnologia",
      ],
      resource_category: [
        "atencion",
        "marketing",
        "gestion",
        "liderazgo",
        "finanzas",
        "digital",
      ],
      resource_format: ["pdf", "docs", "url", "xls", "video"],
      resource_type: [
        "protocolo",
        "calculadora",
        "plantilla",
        "guia",
        "checklist",
        "manual",
        "herramienta",
      ],
      subscription_status: ["active", "canceled", "expired", "trialing"],
      user_role: ["freemium", "estudiante", "profesional", "premium", "admin"],
    },
  },
} as const
