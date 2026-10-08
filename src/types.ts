export interface Section {
  id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string;
  order_idx: number;
}

export interface SubSection {
  id: number;
  section_id: number;
  name_ar: string;
  name_en: string;
  slug: string;
  order_idx: number;
}

export interface Project {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  section_id: number;
  subsection_id?: number | null;
  cover_image: string;
  video_url?: string | null;
  link_url?: string | null;
  tech_tags?: string | null;
  order_idx: number;
  images?: string[];
}

export interface TeamMember {
  id: number;
  name_ar: string;
  name_en: string;
  role_ar: string;
  role_en: string;
  skills_ar?: string | null;
  skills_en?: string | null;
  image?: string | null;
}

export interface SiteContentItem {
  id: number;
  key_name: string;
  text_ar: string;
  text_en: string;
}

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  role: 'super_admin' | 'admin';
  can_manage_projects: boolean | number;
  can_manage_sections: boolean | number;
  can_manage_content: boolean | number;
  can_manage_team: boolean | number;
  can_manage_logo: boolean | number;
  can_manage_admins: boolean | number;
}

export interface NetPalDatabase {
  sections: Section[];
  subsections: SubSection[];
  projects: Project[];
  team: TeamMember[];
  content: SiteContentItem[];
  admins: AdminUser[];
}
