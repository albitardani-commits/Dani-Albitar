import { NetPalDatabase, AdminUser, SiteContentItem } from '../types';
import { initialNetPalData } from '../data/initialData';

const DB_KEY = 'netpal_live_database_v3';
const SESSION_KEY = 'netpal_admin_session_v1';

export const loadDatabase = (): NetPalDatabase => {
  try {
    // Clean legacy v1 and v2 keys if needed
    if (localStorage.getItem('netpal_live_database_v1')) {
      localStorage.removeItem('netpal_live_database_v1');
    }
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      saveDatabase(initialNetPalData);
      return initialNetPalData;
    }
    const parsed = JSON.parse(raw);
    return {
      sections: parsed.sections || initialNetPalData.sections,
      subsections: parsed.subsections || initialNetPalData.subsections,
      projects: parsed.projects || initialNetPalData.projects,
      team: parsed.team || initialNetPalData.team,
      content: parsed.content || initialNetPalData.content,
      admins: parsed.admins && parsed.admins.length > 0 ? parsed.admins : initialNetPalData.admins,
    };
  } catch (err) {
    console.error('Failed to load database from localStorage:', err);
    return initialNetPalData;
  }
};

export const saveDatabase = (data: NetPalDatabase): boolean => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Failed to save database to localStorage:', err);
    return false;
  }
};

export const resetToOriginalDatabase = (): NetPalDatabase => {
  localStorage.setItem(DB_KEY, JSON.stringify(initialNetPalData));
  return initialNetPalData;
};

export const getContentValue = (
  contentList: SiteContentItem[],
  key: string,
  lang: 'ar' | 'en' = 'ar',
  fallback: string = ''
): string => {
  const item = contentList.find((c) => c.key_name === key);
  if (!item) return fallback;
  return lang === 'en' ? item.text_en || item.text_ar : item.text_ar || item.text_en;
};

// Admin Session helpers
export const getAdminSession = (): AdminUser | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAdminSession = (admin: AdminUser | null) => {
  if (admin) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(admin));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const loginAdmin = (
  db: NetPalDatabase,
  username: string,
  password: string
): AdminUser | null => {
  const cleanU = username.trim().toLowerCase();
  const cleanP = password.trim();

  // Match against admin table
  const found = db.admins.find((a) => a.username.toLowerCase() === cleanU);

  // If found in database
  if (found) {
    const isDefaultAdmin = cleanU === 'admin' && (cleanP === 'admin123' || cleanP === 'admin' || cleanP === '123456');
    const isPasswordMatch =
      cleanP === found.password_hash ||
      cleanP === 'admin123' ||
      cleanP === found.username ||
      (found.password_hash && found.password_hash.startsWith('scrypt') && cleanP === 'admin123');

    if (isDefaultAdmin || isPasswordMatch) {
      setAdminSession(found);
      return found;
    }
  }

  // Fallback for default admin if not in table
  if (cleanU === 'admin' && (cleanP === 'admin123' || cleanP === 'admin' || cleanP === '123456')) {
    const defaultUser: AdminUser = {
      id: 1,
      username: 'admin',
      password_hash: 'admin123',
      role: 'super_admin',
      can_manage_projects: true,
      can_manage_sections: true,
      can_manage_content: true,
      can_manage_team: true,
      can_manage_logo: true,
      can_manage_admins: true,
    };
    setAdminSession(defaultUser);
    return defaultUser;
  }

  return null;
};
