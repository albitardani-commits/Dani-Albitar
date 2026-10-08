import { NetPalDatabase } from '../types';
import dbJson from './netpal_db.json';

export const initialNetPalData: NetPalDatabase = {
  sections: dbJson.sections.map((s: any) => ({
    ...s,
    id: Number(s.id),
    order_idx: Number(s.order_idx || 0),
  })),
  subsections: dbJson.subsections.map((sub: any) => ({
    ...sub,
    id: Number(sub.id),
    section_id: Number(sub.section_id),
    order_idx: Number(sub.order_idx || 0),
  })),
  projects: dbJson.projects.map((p: any) => ({
    ...p,
    id: Number(p.id),
    section_id: Number(p.section_id),
    subsection_id: p.subsection_id ? Number(p.subsection_id) : null,
    order_idx: Number(p.order_idx || 0),
    images: [],
  })),
  team: dbJson.team.map((t: any) => ({
    ...t,
    id: Number(t.id),
  })),
  content: dbJson.content.map((c: any) => ({
    ...c,
    id: Number(c.id),
  })),
  admins: dbJson.admins.map((a: any) => ({
    ...a,
    id: Number(a.id),
    can_manage_projects: Boolean(a.can_manage_projects),
    can_manage_sections: Boolean(a.can_manage_sections),
    can_manage_content: Boolean(a.can_manage_content),
    can_manage_team: Boolean(a.can_manage_team),
    can_manage_logo: Boolean(a.can_manage_logo),
    can_manage_admins: Boolean(a.can_manage_admins),
  })),
};
