export type VoiceZh = "zh-HK" | "zh-CN";

export type ProfileRow = {
  id: string;
  display_name: string | null;
  theme: string | null;
  voice_zh: VoiceZh;
  created_at: string;
  updated_at: string;
};

export type StudentRow = {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
};

export type ContentLanguage = "zh" | "en";
export type WordListType = "chinese_vocabulary" | "english_vocabulary";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LessonRow = {
  id: string;
  owner_id: string;
  student_id: string;
  title: string;
  language: ContentLanguage;
  created_at: string;
  updated_at: string;
};

export type ParagraphRow = {
  id: string;
  lesson_id: string;
  sort_order: number;
  content: string;
  created_at: string;
  updated_at: string;
};

export type WordListRow = {
  id: string;
  owner_id: string;
  student_id: string;
  title: string;
  language: ContentLanguage;
  type: WordListType;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type DictationSessionRow = {
  id: string;
  owner_id: string;
  student_id: string;
  language: ContentLanguage;
  source_type: "lesson" | "paragraph" | "word_list" | "mistakes";
  source_id: string;
  paragraph_index: number | null;
  mode: "listen" | "paper" | "typing";
  voice: string | null;
  speed: string | null;
  score: number | null;
  accuracy: number | null;
  correct_count: number | null;
  wrong_count: number | null;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
  mistake_ids: string[] | null;
};

export type MistakeRow = {
  id: string;
  owner_id: string;
  student_id: string;
  language: ContentLanguage;
  source_type: "lesson" | "word_list";
  source_id: string;
  answer_key: string;
  standard_answer: string;
  student_answer: string;
  mistake_count: number;
  active: boolean;
  last_wrong_at: string;
  created_at: string;
};

export type DictationAnswerRow = {
  id: string;
  session_id: string;
  owner_id: string;
  item_index: number;
  standard_answer: string;
  student_answer: string;
  is_correct: boolean;
  created_at: string;
};

export type DictationItemRow = {
  id: string;
  word_list_id: string;
  text: string;
  sort_order: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          display_name?: string | null;
          theme?: string | null;
          voice_zh?: VoiceZh;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          theme?: string | null;
          voice_zh?: VoiceZh;
          updated_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: StudentRow;
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      lessons: {
        Row: LessonRow;
        Insert: {
          id?: string;
          owner_id: string;
          student_id: string;
          title: string;
          language: ContentLanguage;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      paragraphs: {
        Row: ParagraphRow;
        Insert: {
          id?: string;
          lesson_id: string;
          sort_order: number;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          sort_order?: number;
          content?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      word_lists: {
        Row: WordListRow;
        Insert: {
          id?: string;
          owner_id: string;
          student_id: string;
          title: string;
          language: ContentLanguage;
          type: WordListType;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      dictation_sessions: {
        Row: DictationSessionRow;
        Insert: {
          id?: string;
          owner_id: string;
          student_id: string;
          language: ContentLanguage;
          source_type: DictationSessionRow["source_type"];
          source_id: string;
          paragraph_index?: number | null;
          mode: DictationSessionRow["mode"];
          voice?: string | null;
          speed?: string | null;
          score?: number | null;
          accuracy?: number | null;
          correct_count?: number | null;
          wrong_count?: number | null;
          completed?: boolean;
          created_at?: string;
          completed_at?: string | null;
          mistake_ids?: string[] | null;
        };
        Update: {
          voice?: string | null;
          speed?: string | null;
          score?: number | null;
          accuracy?: number | null;
          correct_count?: number | null;
          wrong_count?: number | null;
          completed?: boolean;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      mistakes: {
        Row: MistakeRow;
        Insert: {
          id?: string;
          owner_id: string;
          student_id: string;
          language: ContentLanguage;
          source_type: MistakeRow["source_type"];
          source_id: string;
          answer_key: string;
          standard_answer: string;
          student_answer: string;
          mistake_count?: number;
          active?: boolean;
          last_wrong_at?: string;
          created_at?: string;
        };
        Update: {
          student_answer?: string;
          mistake_count?: number;
          active?: boolean;
          last_wrong_at?: string;
        };
        Relationships: [];
      };
      dictation_answers: {
        Row: DictationAnswerRow;
        Insert: {
          id?: string;
          session_id: string;
          owner_id: string;
          item_index: number;
          standard_answer: string;
          student_answer: string;
          is_correct: boolean;
          created_at?: string;
        };
        Update: {
          standard_answer?: string;
          student_answer?: string;
          is_correct?: boolean;
        };
        Relationships: [];
      };
      dictation_items: {
        Row: DictationItemRow;
        Insert: {
          id?: string;
          word_list_id: string;
          text: string;
          sort_order: number;
          created_at?: string;
        };
        Update: {
          text?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_lesson: {
        Args: { p_language: ContentLanguage; p_title: string; p_paragraphs: Json };
        Returns: string;
      };
      save_lesson: {
        Args: {
          p_lesson_id: string;
          p_language: ContentLanguage;
          p_title: string;
          p_paragraphs: Json;
        };
        Returns: undefined;
      };
      create_word_list: {
        Args: {
          p_title: string;
          p_language: ContentLanguage;
          p_type: WordListType;
          p_items: Json;
        };
        Returns: string;
      };
      save_word_list: {
        Args: { p_word_list_id: string; p_title: string; p_items: Json };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
