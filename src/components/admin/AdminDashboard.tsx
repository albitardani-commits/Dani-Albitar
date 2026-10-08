import React, { useState, useEffect, useMemo } from 'react';
import {
  Palette,
  Folder,
  Users,
  FileText,
  Download,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Shield,
  ShieldCheck,
  KeyRound,
  Search,
  Upload,
  RotateCcw,
  ExternalLink,
  Tag,
  Lock,
  UserCheck,
} from 'lucide-react';
import {
  NetPalDatabase,
  Project,
  Section,
  SubSection,
  TeamMember,
  AdminUser,
} from '../../types';
import { resetToOriginalDatabase } from '../../services/storage';

interface AdminDashboardProps {
  db: NetPalDatabase;
  onUpdateDb: (newDb: NetPalDatabase) => void;
  adminUser: AdminUser;
  onLogout: () => void;
  onReturnToSite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  db,
  onUpdateDb,
  adminUser,
  onLogout,
  onReturnToSite,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'projects' | 'sections' | 'team' | 'admins' | 'content' | 'backup'
  >('projects');

  // Ensure normal mouse cursor inside Admin Dashboard
  useEffect(() => {
    document.body.classList.add('admin-mode');
    return () => {
      document.body.classList.remove('admin-mode');
    };
  }, []);

  // Notifications
  const [toastMessage, setToastMessage] = useState('');
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Search & Filters
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<number | 'all'>('all');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState<'all' | 'super_admin' | 'admin'>('all');

  // ── Confirmation Modal State (Reliable In-App Dialog - No window.confirm) ──
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  // ── Edit / Add Modals State ──────────────────────────────────────────
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);
  const [projectModalError, setProjectModalError] = useState('');

  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isNewSection, setIsNewSection] = useState(false);
  const [sectionModalError, setSectionModalError] = useState('');

  const [editingSubSection, setEditingSubSection] = useState<SubSection | null>(null);
  const [isNewSubSection, setIsNewSubSection] = useState(false);
  const [subSectionModalError, setSubSectionModalError] = useState('');

  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [isNewTeamMember, setIsNewTeamMember] = useState(false);
  const [teamModalError, setTeamModalError] = useState('');

  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [isNewAdmin, setIsNewAdmin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminModalError, setAdminModalError] = useState('');

  // Editable site content state
  const [contentForm, setContentForm] = useState<Record<string, { ar: string; en: string }>>(() => {
    const map: Record<string, { ar: string; en: string }> = {};
    (db.content || []).forEach((item) => {
      map[item.key_name] = { ar: item.text_ar || '', en: item.text_en || '' };
    });
    return map;
  });

  // Keep content form in sync with db
  useEffect(() => {
    const map: Record<string, { ar: string; en: string }> = {};
    (db.content || []).forEach((item) => {
      map[item.key_name] = { ar: item.text_ar || '', en: item.text_en || '' };
    });
    setContentForm(map);
  }, [db.content]);

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS: PROJECTS
  // ══════════════════════════════════════════════════════════════════════════
  const handleOpenAddProject = () => {
    const firstSec = db.sections[0]?.id || 1;
    setEditingProject({
      id: Date.now(),
      section_id: firstSec,
      subsection_id: null,
      title_ar: '',
      title_en: '',
      description_ar: '',
      description_en: '',
      cover_image: 'https://placehold.co/800x450/07444E/FFFFFF?text=NetPal+Project',
      tech_tags: '',
      link_url: '',
      video_url: '',
      images: [],
      order_idx: db.projects.length,
    });
    setIsNewProject(true);
    setProjectModalError('');
  };

  const handleSaveProject = () => {
    if (!editingProject) return;
    if (!editingProject.title_ar.trim()) {
      setProjectModalError('يرجى كتابة عنوان المشروع بالعربية (حقل إجباري)');
      return;
    }

    let updated: Project[];
    if (isNewProject) {
      updated = [editingProject, ...db.projects];
    } else {
      updated = db.projects.map((item) =>
        item.id === editingProject.id ? editingProject : item
      );
    }
    onUpdateDb({ ...db, projects: updated });
    setEditingProject(null);
    triggerToast(isNewProject ? 'تمت إضافة المشروع الجديد بنجاح!' : 'تم حفظ تعديلات المشروع!');
  };

  const handleDeleteProject = (p: Project) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف المشروع',
      message: `هل أنت متأكد من رغبتك في حذف المشروع "${p.title_ar}"؟ لا يمكن التراجع عن هذه الخطوة.`,
      confirmLabel: 'نعم، احذف المشروع',
      onConfirm: () => {
        const updated = db.projects.filter((item) => item.id !== p.id);
        onUpdateDb({ ...db, projects: updated });
        setConfirmModal(null);
        triggerToast('تم حذف المشروع بنجاح.');
      },
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS: SECTIONS & SUBSECTIONS
  // ══════════════════════════════════════════════════════════════════════════
  const handleOpenAddSection = () => {
    setEditingSection({
      id: Date.now(),
      name_ar: '',
      name_en: '',
      slug: '',
      icon: 'folder',
      order_idx: db.sections.length,
    });
    setIsNewSection(true);
    setSectionModalError('');
  };

  const handleSaveSection = () => {
    if (!editingSection) return;
    if (!editingSection.name_ar.trim()) {
      setSectionModalError('يرجى كتابة اسم القسم بالعربية (حقل إجباري)');
      return;
    }
    const slug = editingSection.slug.trim() || `sec-${Date.now()}`;
    const toSave = { ...editingSection, slug };

    let updated: Section[];
    if (isNewSection) {
      updated = [...db.sections, toSave];
    } else {
      updated = db.sections.map((s) => (s.id === toSave.id ? toSave : s));
    }
    onUpdateDb({ ...db, sections: updated });
    setEditingSection(null);
    triggerToast(isNewSection ? 'تمت إضافة القسم بنجاح!' : 'تم حفظ بيانات القسم!');
  };

  const handleDeleteSection = (sec: Section) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف القسم الرئيسي',
      message: `هل أنت متأكد من حذف القسم "${sec.name_ar}"؟ سيتم أيضاً حذف كافة الأقسام الفرعية التابعة له.`,
      confirmLabel: 'نعم، احذف القسم وما يتبعه',
      onConfirm: () => {
        const updatedSecs = db.sections.filter((s) => s.id !== sec.id);
        const updatedSubs = db.subsections.filter((sub) => sub.section_id !== sec.id);
        onUpdateDb({ ...db, sections: updatedSecs, subsections: updatedSubs });
        setConfirmModal(null);
        triggerToast('تم حذف القسم الرئيسي وتصنيفاته الفرعية.');
      },
    });
  };

  const handleOpenAddSubSection = (sectionId: number) => {
    setEditingSubSection({
      id: Date.now(),
      section_id: sectionId,
      name_ar: '',
      name_en: '',
      slug: '',
      order_idx: db.subsections.filter((s) => s.section_id === sectionId).length,
    });
    setIsNewSubSection(true);
    setSubSectionModalError('');
  };

  const handleSaveSubSection = () => {
    if (!editingSubSection) return;
    if (!editingSubSection.name_ar.trim()) {
      setSubSectionModalError('يرجى كتابة اسم القسم الفرعي بالعربية (حقل إجباري)');
      return;
    }
    const slug = editingSubSection.slug.trim() || `sub-${Date.now()}`;
    const toSave = { ...editingSubSection, slug };

    let updated: SubSection[];
    if (isNewSubSection) {
      updated = [...db.subsections, toSave];
    } else {
      updated = db.subsections.map((s) => (s.id === toSave.id ? toSave : s));
    }
    onUpdateDb({ ...db, subsections: updated });
    setEditingSubSection(null);
    triggerToast(isNewSubSection ? 'تمت إضافة القسم الفرعي بنجاح!' : 'تم حفظ تعديل القسم الفرعي!');
  };

  const handleDeleteSubSection = (sub: SubSection) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف القسم الفرعي',
      message: `هل تريد بالتأكيد حذف القسم الفرعي "${sub.name_ar}"؟`,
      confirmLabel: 'نعم، حذف',
      onConfirm: () => {
        const updated = db.subsections.filter((s) => s.id !== sub.id);
        onUpdateDb({ ...db, subsections: updated });
        setConfirmModal(null);
        triggerToast('تم حذف القسم الفرعي.');
      },
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS: TEAM
  // ══════════════════════════════════════════════════════════════════════════
  const handleOpenAddTeamMember = () => {
    setEditingTeamMember({
      id: Date.now(),
      name_ar: '',
      name_en: '',
      role_ar: '',
      role_en: '',
      skills_ar: '',
      skills_en: '',
      image: '',
    });
    setIsNewTeamMember(true);
    setTeamModalError('');
  };

  const handleSaveTeamMember = () => {
    if (!editingTeamMember) return;
    if (!editingTeamMember.name_ar.trim()) {
      setTeamModalError('يرجى كتابة اسم العضو بالعربية (حقل إجباري)');
      return;
    }

    let updated: TeamMember[];
    if (isNewTeamMember) {
      updated = [...db.team, editingTeamMember];
    } else {
      updated = db.team.map((t) => (t.id === editingTeamMember.id ? editingTeamMember : t));
    }
    onUpdateDb({ ...db, team: updated });
    setEditingTeamMember(null);
    triggerToast(isNewTeamMember ? 'تمت إضافة عضو الفريق بنجاح!' : 'تم حفظ بيانات العضو!');
  };

  const handleDeleteTeamMember = (tm: TeamMember) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف عضو من الفريق',
      message: `هل تريد بالتأكيد حذف العضو "${tm.name_ar}" من فريق العمل؟`,
      confirmLabel: 'نعم، حذف العضو',
      onConfirm: () => {
        const updated = db.team.filter((t) => t.id !== tm.id);
        onUpdateDb({ ...db, team: updated });
        setConfirmModal(null);
        triggerToast('تم حذف العضو من الفريق.');
      },
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS: USERS & ADMINS (NEW DEDICATED MANAGEMENT)
  // ══════════════════════════════════════════════════════════════════════════
  const handleOpenAddAdmin = () => {
    setEditingAdmin({
      id: Date.now(),
      username: '',
      password_hash: '',
      role: 'admin',
      can_manage_projects: true,
      can_manage_sections: true,
      can_manage_content: true,
      can_manage_team: true,
      can_manage_logo: false,
      can_manage_admins: false,
    });
    setAdminPasswordInput('admin123');
    setIsNewAdmin(true);
    setAdminModalError('');
  };

  const handleOpenEditAdmin = (admin: AdminUser) => {
    setEditingAdmin({ ...admin });
    setAdminPasswordInput(''); // Blank means keep existing password
    setIsNewAdmin(false);
    setAdminModalError('');
  };

  const handleSaveAdmin = () => {
    if (!editingAdmin) return;
    const cleanUsername = editingAdmin.username.trim().toLowerCase();
    if (!cleanUsername) {
      setAdminModalError('يرجى إدخال اسم المستخدم (حقل إجباري)');
      return;
    }

    // Check duplicate username if new or if username changed
    const duplicate = db.admins.find(
      (a) => a.id !== editingAdmin.id && a.username.toLowerCase() === cleanUsername
    );
    if (duplicate) {
      setAdminModalError(`اسم المستخدم "${cleanUsername}" مسجل بالفعل لمستخدم آخر!`);
      return;
    }

    // Determine password
    let finalPassword = editingAdmin.password_hash;
    if (adminPasswordInput.trim()) {
      finalPassword = adminPasswordInput.trim();
    } else if (isNewAdmin) {
      finalPassword = 'admin123';
    }

    const adminToSave: AdminUser = {
      ...editingAdmin,
      username: cleanUsername,
      password_hash: finalPassword,
    };

    let updated: AdminUser[];
    if (isNewAdmin) {
      updated = [...db.admins, adminToSave];
    } else {
      updated = db.admins.map((a) => (a.id === adminToSave.id ? adminToSave : a));
    }

    onUpdateDb({ ...db, admins: updated });
    setEditingAdmin(null);
    triggerToast(isNewAdmin ? 'تمت إضافة المشرف/المستخدم بنجاح!' : 'تم تحديث بيانات وصلاحيات المستخدم!');
  };

  const handleDeleteAdmin = (targetAdmin: AdminUser) => {
    // Prevent deleting self
    if (targetAdmin.id === adminUser.id || targetAdmin.username.toLowerCase() === adminUser.username.toLowerCase()) {
      triggerToast('لا يمكنك حذف الحساب الذي قمت بتسجيل الدخول به حالياً!');
      return;
    }

    // Check if it's the last super admin
    const superAdminsCount = db.admins.filter((a) => a.role === 'super_admin').length;
    if (targetAdmin.role === 'super_admin' && superAdminsCount <= 1) {
      triggerToast('لا يمكن حذف المدير العام الوحيد في النظام!');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'حذف مستخدم / مشرف',
      message: `هل أنت متأكد من رغبتك في حذف المستخدم "${targetAdmin.username}"؟ لن يتمكن من تسجيل الدخول بعد الآن.`,
      confirmLabel: 'نعم، احذف المستخدم',
      onConfirm: () => {
        const updated = db.admins.filter((a) => a.id !== targetAdmin.id);
        onUpdateDb({ ...db, admins: updated });
        setConfirmModal(null);
        triggerToast(`تم حذف المستخدم ${targetAdmin.username} بنجاح.`);
      },
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS: SITE CONTENT
  // ══════════════════════════════════════════════════════════════════════════
  const handleSaveAllContent = () => {
    const updated = db.content.map((item) => {
      const formVal = contentForm[item.key_name];
      if (formVal) {
        return { ...item, text_ar: formVal.ar, text_en: formVal.en };
      }
      return item;
    });
    onUpdateDb({ ...db, content: updated });
    triggerToast('تم حفظ كافة نصوص الموقع بنجاح!');
  };

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS: BACKUP & DATA
  // ══════════════════════════════════════════════════════════════════════════
  const handleExportBackup = () => {
    try {
      const str = JSON.stringify(db, null, 2);
      const blob = new Blob([str], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `netpal_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      triggerToast('تم تصدير النسخة الاحتياطية بنجاح!');
    } catch {
      triggerToast('تعذر تصدير النسخة الاحتياطية.');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.sections && parsed.projects && parsed.content) {
          onUpdateDb(parsed);
          triggerToast('تم استيراد قاعدة البيانات بنجاح!');
        } else {
          triggerToast('الملف المختار غير متوافق مع هيكل بيانات NetPal.');
        }
      } catch {
        triggerToast('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToDefault = () => {
    setConfirmModal({
      isOpen: true,
      title: 'استعادة البيانات الأصلية',
      message: 'تحذير: هذا الإجراء سيستعيد البيانات الأصلية لمنصة NetPal ويعيد تعيين أي تعديلات قمت بها. هل تود المتابعة؟',
      confirmLabel: 'نعم، استعادة البيانات الأصلية',
      onConfirm: () => {
        const original = resetToOriginalDatabase();
        onUpdateDb(original);
        setConfirmModal(null);
        triggerToast('تمت استعادة البيانات الأصلية بنجاح.');
      },
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // FILTERED LISTS
  // ══════════════════════════════════════════════════════════════════════════
  const filteredProjects = useMemo(() => {
    return db.projects.filter((p) => {
      const matchSection =
        selectedSectionFilter === 'all' || p.section_id === selectedSectionFilter;
      const matchSearch =
        !projectSearch.trim() ||
        p.title_ar.toLowerCase().includes(projectSearch.toLowerCase()) ||
        (p.title_en && p.title_en.toLowerCase().includes(projectSearch.toLowerCase())) ||
        (p.tech_tags && p.tech_tags.toLowerCase().includes(projectSearch.toLowerCase()));
      return matchSection && matchSearch;
    });
  }, [db.projects, selectedSectionFilter, projectSearch]);

  const filteredAdmins = useMemo(() => {
    return (db.admins || []).filter((a) => {
      const matchRole =
        adminRoleFilter === 'all' || a.role === adminRoleFilter;
      const matchSearch =
        !adminSearch.trim() ||
        a.username.toLowerCase().includes(adminSearch.toLowerCase());
      return matchRole && matchSearch;
    });
  }, [db.admins, adminRoleFilter, adminSearch]);

  return (
    <div
      dir="rtl"
      className="admin-container min-h-screen bg-[#07444E] text-white flex flex-col selection:bg-[#5DCBCA] selection:text-[#07444E]"
      style={{ fontFamily: "'Co Headline Arbc', 'Co Headline', 'Segoe UI', Tahoma, sans-serif" }}
    >
      {/* ── Top Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 px-4 sm:px-8 py-3.5 bg-[#07444E]/95 border-b border-[#5DCBCA]/20 backdrop-blur-md flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src="/images/netpal-logo-3.svg"
            alt="NetPal Logo"
            className="h-9 sm:h-10 w-auto object-contain drop-shadow"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/netpal-logo-3.svg';
            }}
          />
          <div className="h-6 w-px bg-[#5DCBCA]/30 hidden sm:block" />
          <div className="hidden sm:flex flex-col">
            <span className="text-base font-bold text-white tracking-wide">لوحة التحكم والإدارة</span>
            <span className="text-xs text-[#b8e4e4]">نظام NetPal الشامل للمحتوى والمشاريع</span>
          </div>
        </div>

        {/* Center Toast Message */}
        {toastMessage && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a4f5b] border border-[#5DCBCA] text-[#5DCBCA] text-xs sm:text-sm font-bold shadow-lg animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-[#5DCBCA] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* User Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-xs">
            <UserCheck className="w-4 h-4 text-[#5DCBCA]" />
            <span className="text-white font-bold">{adminUser.username}</span>
            <span className="px-2 py-0.5 rounded-md bg-[#07444E] text-[#5DCBCA] font-semibold text-[11px]">
              {adminUser.role === 'super_admin' ? 'مدير عام' : 'مشرف'}
            </span>
          </div>

          <button
            onClick={onReturnToSite}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0a4f5b]/80 border border-[#5DCBCA]/40 text-white hover:bg-[#5DCBCA] hover:text-[#07444E] transition shadow-sm cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>عرض الموقع</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-950/40 border border-rose-800/40 text-rose-200 hover:bg-rose-900 transition shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden xs:inline">خروج</span>
          </button>
        </div>
      </header>

      {/* ── Main Navigation Tabs ──────────────────────────────────── */}
      <nav className="px-4 sm:px-8 py-3 bg-[#05333B] border-b border-[#5DCBCA]/20 flex items-center gap-2 sm:gap-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'projects'
              ? 'bg-[#5DCBCA] text-[#07444E] shadow-md shadow-[#5DCBCA]/20'
              : 'text-[#b8e4e4] hover:text-white hover:bg-[#0a4f5b]/60'
          }`}
        >
          <Palette className="w-4 h-4 shrink-0" />
          <span>المشاريع</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'projects' ? 'bg-[#07444E] text-[#5DCBCA]' : 'bg-[#0a4f5b] text-white'
            }`}
          >
            {db.projects.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-[#5DCBCA] text-[#07444E] shadow-md shadow-[#5DCBCA]/20'
              : 'text-[#b8e4e4] hover:text-white hover:bg-[#0a4f5b]/60'
          }`}
        >
          <Folder className="w-4 h-4 shrink-0" />
          <span>الأقسام والتصنيفات</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'sections' ? 'bg-[#07444E] text-[#5DCBCA]' : 'bg-[#0a4f5b] text-white'
            }`}
          >
            {db.sections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'team'
              ? 'bg-[#5DCBCA] text-[#07444E] shadow-md shadow-[#5DCBCA]/20'
              : 'text-[#b8e4e4] hover:text-white hover:bg-[#0a4f5b]/60'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>فريق العمل</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'team' ? 'bg-[#07444E] text-[#5DCBCA]' : 'bg-[#0a4f5b] text-white'
            }`}
          >
            {db.team.length}
          </span>
        </button>

        {/* Dedicated Admins & Users Tab */}
        <button
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'admins'
              ? 'bg-[#5DCBCA] text-[#07444E] shadow-md shadow-[#5DCBCA]/20'
              : 'text-[#b8e4e4] hover:text-white hover:bg-[#0a4f5b]/60'
          }`}
        >
          <Shield className="w-4 h-4 shrink-0" />
          <span>المشرفون والمستخدمون</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'admins' ? 'bg-[#07444E] text-[#5DCBCA]' : 'bg-[#0a4f5b] text-white'
            }`}
          >
            {(db.admins || []).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'content'
              ? 'bg-[#5DCBCA] text-[#07444E] shadow-md shadow-[#5DCBCA]/20'
              : 'text-[#b8e4e4] hover:text-white hover:bg-[#0a4f5b]/60'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>نصوص ومحتوى الموقع</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-[#5DCBCA] text-[#07444E] shadow-md shadow-[#5DCBCA]/20'
              : 'text-[#b8e4e4] hover:text-white hover:bg-[#0a4f5b]/60'
          }`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>النسخ والبيانات</span>
        </button>
      </nav>

      {/* ── Main Workspace ────────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        {/* ══════════════════════════════════════════════════════════
            TAB 1: PROJECTS (المشاريع)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'projects' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header with Title and Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a4f5b]/40 p-5 rounded-2xl border border-[#5DCBCA]/20">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">إدارة المشاريع المعروضة</h2>
                <p className="text-sm text-[#b8e4e4] mt-1">
                  إجمالي ({db.projects.length}) مشروعاً مسجلاً في مختلف الأقسام والتصنيفات
                </p>
              </div>

              <button
                onClick={handleOpenAddProject}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#5DCBCA] text-[#07444E] font-bold text-sm hover:bg-[#4ebaba] transition shadow-lg shadow-[#5DCBCA]/20 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مشروع جديد</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedSectionFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition border cursor-pointer shrink-0 ${
                    selectedSectionFilter === 'all'
                      ? 'bg-[#5DCBCA] text-[#07444E] border-[#5DCBCA]'
                      : 'bg-[#0a4f5b]/50 text-[#b8e4e4] border-[#5DCBCA]/20 hover:border-[#5DCBCA]/60'
                  }`}
                >
                  الكل ({db.projects.length})
                </button>
                {db.sections.map((s) => {
                  const count = db.projects.filter((p) => p.section_id === s.id).length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSectionFilter(s.id)}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition border cursor-pointer shrink-0 ${
                        selectedSectionFilter === s.id
                          ? 'bg-[#5DCBCA] text-[#07444E] border-[#5DCBCA]'
                          : 'bg-[#0a4f5b]/50 text-[#b8e4e4] border-[#5DCBCA]/20 hover:border-[#5DCBCA]/60'
                      }`}
                    >
                      {s.name_ar} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-[#b8e4e4] absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="بحث في المشاريع..."
                  className="w-full pr-10 pl-4 py-2 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center bg-[#0a4f5b]/30 rounded-2xl border border-[#5DCBCA]/20">
                <Palette className="w-12 h-12 text-[#5DCBCA]/60 mx-auto mb-3" />
                <p className="text-base font-bold text-white">لا توجد مشاريع مطابقة للبحث أو التصفية</p>
                <p className="text-xs text-[#b8e4e4] mt-1">جرّب تغيير عبارة البحث أو اختيار تصنيف آخر</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => {
                  const sec = db.sections.find((s) => s.id === project.section_id);
                  const sub = db.subsections.find((s) => s.id === project.subsection_id);
                  const tags = project.tech_tags
                    ? project.tech_tags.split(',').map((t) => t.trim())
                    : [];
                  const cover = project.cover_image.startsWith('http')
                    ? project.cover_image
                    : `/uploads/${project.cover_image}`;

                  return (
                    <div
                      key={project.id}
                      className="rounded-2xl border border-[#5DCBCA]/25 bg-[#0a4f5b]/70 overflow-hidden flex flex-col transition hover:border-[#5DCBCA]/60 hover:shadow-xl hover:shadow-[#05333B]/50"
                    >
                      {/* Thumbnail Image */}
                      <div className="relative aspect-video bg-[#05333B] overflow-hidden">
                        <img
                          src={cover}
                          alt={project.title_ar}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://placehold.co/800x450/07444E/FFFFFF?text=NetPal+Project';
                          }}
                        />
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-[#07444E]/90 text-white border border-[#5DCBCA]/30 backdrop-blur-sm">
                          {sec ? sec.name_ar : 'عام'}
                        </div>
                        {sub && (
                          <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-[#05333B]/90 text-[#b8e4e4] border border-white/10 backdrop-blur-sm">
                            {sub.name_ar}
                          </div>
                        )}
                      </div>

                      {/* Content Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="font-bold text-white text-base sm:text-lg leading-snug line-clamp-1">
                            {project.title_ar}
                          </h3>
                          {project.title_en && (
                            <p className="text-xs text-[#b8e4e4] mt-0.5 line-clamp-1">{project.title_en}</p>
                          )}
                          {project.description_ar && (
                            <p className="text-xs sm:text-sm text-slate-200 mt-2 line-clamp-2 leading-relaxed">
                              {project.description_ar}
                            </p>
                          )}
                        </div>

                        {/* Tags */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-0.5 rounded-md text-xs bg-[#07444E] text-[#5DCBCA] border border-[#5DCBCA]/30"
                              >
                                #{tag}
                              </span>
                            ))}
                            {tags.length > 3 && (
                              <span className="text-xs text-[#b8e4e4] self-center">
                                +{tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="pt-3 border-t border-[#5DCBCA]/20 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setEditingProject({ ...project });
                              setIsNewProject(false);
                              setProjectModalError('');
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#05333B] text-[#5DCBCA] hover:bg-[#5DCBCA] hover:text-[#07444E] transition border border-[#5DCBCA]/30 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>

                          <button
                            onClick={() => handleDeleteProject(project)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-950/40 text-rose-300 hover:bg-rose-900 hover:text-white transition border border-rose-800/40 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: SECTIONS (الأقسام والتصنيفات)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'sections' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a4f5b]/40 p-5 rounded-2xl border border-[#5DCBCA]/20">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  إدارة الأقسام والتصنيفات
                </h2>
                <p className="text-sm text-[#b8e4e4] mt-1">
                  تحكم بالأقسام الرئيسية للأعمال والأقسام الفرعية التابعة لكل قسم
                </p>
              </div>

              <button
                onClick={handleOpenAddSection}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#5DCBCA] text-[#07444E] font-bold text-sm hover:bg-[#4ebaba] transition shadow-lg shadow-[#5DCBCA]/20 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم رئيسي</span>
              </button>
            </div>

            {/* Sections Accordion/Cards */}
            <div className="space-y-5">
              {db.sections.map((section) => {
                const subs = db.subsections.filter((sub) => sub.section_id === section.id);
                const projectsCount = db.projects.filter((p) => p.section_id === section.id).length;

                return (
                  <div
                    key={section.id}
                    className="rounded-2xl border border-[#5DCBCA]/25 bg-[#0a4f5b]/70 overflow-hidden"
                  >
                    {/* Section Top Header */}
                    <div className="p-5 bg-[#05333B]/60 border-b border-[#5DCBCA]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#07444E] border border-[#5DCBCA]/40 flex items-center justify-center text-[#5DCBCA]">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{section.name_ar}</h3>
                            <span className="text-xs text-[#b8e4e4]">({section.name_en})</span>
                          </div>
                          <p className="text-xs text-[#b8e4e4] mt-0.5">
                            المعرف: <code className="text-[#5DCBCA]">{section.slug}</code> • مشاريع القسم: ({projectsCount})
                          </p>
                        </div>
                      </div>

                      {/* Section Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleOpenAddSubSection(section.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#07444E] text-[#5DCBCA] hover:bg-[#5DCBCA] hover:text-[#07444E] transition border border-[#5DCBCA]/30 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة تصنيف فرعي</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingSection({ ...section });
                            setIsNewSection(false);
                            setSectionModalError('');
                          }}
                          className="p-2 rounded-xl bg-[#07444E] text-white hover:bg-[#5DCBCA] hover:text-[#07444E] transition border border-[#5DCBCA]/30 cursor-pointer"
                          title="تعديل القسم الرئيسي"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteSection(section)}
                          className="p-2 rounded-xl bg-rose-950/40 text-rose-300 hover:bg-rose-900 hover:text-white transition border border-rose-800/40 cursor-pointer"
                          title="حذف القسم الرئيسي"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subsections List */}
                    <div className="p-5">
                      <div className="text-xs font-bold text-[#b8e4e4] mb-3 flex items-center gap-2">
                        <span>التصنيفات الفرعية التابعة لهذا القسم ({subs.length}):</span>
                      </div>

                      {subs.length === 0 ? (
                        <p className="text-xs text-slate-300 italic">لا توجد تصنيفات فرعية في هذا القسم بعد.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {subs.map((sub) => {
                            const subCount = db.projects.filter((p) => p.subsection_id === sub.id).length;
                            return (
                              <div
                                key={sub.id}
                                className="p-3.5 rounded-xl bg-[#07444E] border border-[#5DCBCA]/20 flex items-center justify-between gap-2"
                              >
                                <div>
                                  <div className="text-sm font-bold text-white">{sub.name_ar}</div>
                                  <div className="text-xs text-[#b8e4e4]">{sub.name_en} • ({subCount} مشروع)</div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingSubSection({ ...sub });
                                      setIsNewSubSection(false);
                                      setSubSectionModalError('');
                                    }}
                                    className="p-1.5 rounded-lg text-[#5DCBCA] hover:bg-[#05333B] transition cursor-pointer"
                                    title="تعديل القسم الفرعي"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubSection(sub)}
                                    className="p-1.5 rounded-lg text-rose-300 hover:bg-rose-950/60 transition cursor-pointer"
                                    title="حذف القسم الفرعي"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3: TEAM (فريق العمل)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'team' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a4f5b]/40 p-5 rounded-2xl border border-[#5DCBCA]/20">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  إدارة فريق العمل
                </h2>
                <p className="text-sm text-[#b8e4e4] mt-1">
                  أعضاء الفريق المعروضون في قسم (من نحن) على الموقع
                </p>
              </div>

              <button
                onClick={handleOpenAddTeamMember}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#5DCBCA] text-[#07444E] font-bold text-sm hover:bg-[#4ebaba] transition shadow-lg shadow-[#5DCBCA]/20 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عضو جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {db.team.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-[#5DCBCA]/25 bg-[#0a4f5b]/70 p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="text-center space-y-3">
                    {/* Avatar */}
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-[#05333B] border border-[#5DCBCA]/40 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name_ar}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <span>{member.name_ar ? member.name_ar.slice(0, 1) : 'ن'}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{member.name_ar}</h3>
                      <p className="text-xs text-[#b8e4e4]">{member.name_en}</p>
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#07444E] text-[#5DCBCA] border border-[#5DCBCA]/30">
                      {member.role_ar} {member.role_en && `(${member.role_en})`}
                    </div>
                    {member.skills_ar && (
                      <p className="text-xs text-slate-200 mt-2 line-clamp-2">
                        {member.skills_ar}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#5DCBCA]/20 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setEditingTeamMember({ ...member });
                        setIsNewTeamMember(false);
                        setTeamModalError('');
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#05333B] text-[#5DCBCA] hover:bg-[#5DCBCA] hover:text-[#07444E] transition border border-[#5DCBCA]/30 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTeamMember(member)}
                      className="p-2 rounded-xl bg-rose-950/40 text-rose-300 hover:bg-rose-900 transition border border-rose-800/40 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 4: ADMINS & USERS (المشرفون والمستخدمون)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'admins' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a4f5b]/40 p-5 rounded-2xl border border-[#5DCBCA]/20">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  إدارة المشرفين والمستخدمين
                </h2>
                <p className="text-sm text-[#b8e4e4] mt-1">
                  التحكم الكامل بحسابات لوحة التحكم، صلاحيات الوصول، وتغيير كلمات المرور
                </p>
              </div>

              <button
                onClick={handleOpenAddAdmin}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#5DCBCA] text-[#07444E] font-bold text-sm hover:bg-[#4ebaba] transition shadow-lg shadow-[#5DCBCA]/20 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مستخدم جديد</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Role Filter Pills */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdminRoleFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition border cursor-pointer ${
                    adminRoleFilter === 'all'
                      ? 'bg-[#5DCBCA] text-[#07444E] border-[#5DCBCA]'
                      : 'bg-[#0a4f5b]/50 text-[#b8e4e4] border-[#5DCBCA]/20 hover:border-[#5DCBCA]/60'
                  }`}
                >
                  الكل ({(db.admins || []).length})
                </button>
                <button
                  onClick={() => setAdminRoleFilter('super_admin')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition border cursor-pointer ${
                    adminRoleFilter === 'super_admin'
                      ? 'bg-[#5DCBCA] text-[#07444E] border-[#5DCBCA]'
                      : 'bg-[#0a4f5b]/50 text-[#b8e4e4] border-[#5DCBCA]/20 hover:border-[#5DCBCA]/60'
                  }`}
                >
                  المديرون العامون ({ (db.admins || []).filter((a) => a.role === 'super_admin').length })
                </button>
                <button
                  onClick={() => setAdminRoleFilter('admin')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition border cursor-pointer ${
                    adminRoleFilter === 'admin'
                      ? 'bg-[#5DCBCA] text-[#07444E] border-[#5DCBCA]'
                      : 'bg-[#0a4f5b]/50 text-[#b8e4e4] border-[#5DCBCA]/20 hover:border-[#5DCBCA]/60'
                  }`}
                >
                  المشرفون ({ (db.admins || []).filter((a) => a.role === 'admin').length })
                </button>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-[#b8e4e4] absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="بحث باسم المستخدم..."
                  className="w-full pr-10 pl-4 py-2 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>
            </div>

            {/* Users Cards / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAdmins.map((user) => {
                const isCurrentUser =
                  user.id === adminUser.id ||
                  user.username.toLowerCase() === adminUser.username.toLowerCase();

                return (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-[#5DCBCA]/25 bg-[#0a4f5b]/70 p-6 flex flex-col justify-between space-y-5 transition hover:border-[#5DCBCA]/50"
                  >
                    <div>
                      {/* Top Row: User Avatar & Role */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#07444E] border border-[#5DCBCA]/40 flex items-center justify-center text-[#5DCBCA] font-bold text-lg shadow">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg text-white">{user.username}</h3>
                              {isCurrentUser && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#5DCBCA]/20 text-[#5DCBCA] border border-[#5DCBCA]/40">
                                  حسابك
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#b8e4e4] mt-0.5">
                              المعرف الرقمي: #{user.id}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            user.role === 'super_admin'
                              ? 'bg-[#5DCBCA] text-[#07444E] border-[#5DCBCA]'
                              : 'bg-[#07444E] text-[#b8e4e4] border-[#5DCBCA]/30'
                          }`}
                        >
                          {user.role === 'super_admin' ? 'مدير عام' : 'مشرف'}
                        </span>
                      </div>

                      {/* Permissions List */}
                      <div className="mt-4 pt-4 border-t border-[#5DCBCA]/20 space-y-2">
                        <div className="text-xs font-bold text-[#b8e4e4]">صلاحيات الحساب:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {user.can_manage_projects ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs bg-[#07444E] text-[#5DCBCA] border border-[#5DCBCA]/30">
                              إدارة المشاريع
                            </span>
                          ) : null}
                          {user.can_manage_sections ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs bg-[#07444E] text-[#5DCBCA] border border-[#5DCBCA]/30">
                              إدارة الأقسام
                            </span>
                          ) : null}
                          {user.can_manage_content ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs bg-[#07444E] text-[#5DCBCA] border border-[#5DCBCA]/30">
                              إدارة المحتوى
                            </span>
                          ) : null}
                          {user.can_manage_team ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs bg-[#07444E] text-[#5DCBCA] border border-[#5DCBCA]/30">
                              إدارة الفريق
                            </span>
                          ) : null}
                          {user.can_manage_admins ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs bg-[#07444E] text-[#5DCBCA] border border-[#5DCBCA]/30">
                              إدارة المشرفين
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#5DCBCA]/20 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenEditAdmin(user)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#05333B] text-[#5DCBCA] hover:bg-[#5DCBCA] hover:text-[#07444E] transition border border-[#5DCBCA]/30 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>تعديل والصلاحيات</span>
                      </button>

                      <button
                        onClick={() => handleDeleteAdmin(user)}
                        disabled={isCurrentUser}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition border cursor-pointer ${
                          isCurrentUser
                            ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900 hover:text-white border-rose-800/40'
                        }`}
                        title={isCurrentUser ? 'لا يمكن حذف الحساب الحالي' : 'حذف المستخدم'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 5: CONTENT (نصوص الموقع)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'content' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a4f5b]/40 p-5 rounded-2xl border border-[#5DCBCA]/20">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  نصوص ومحتوى الموقع
                </h2>
                <p className="text-sm text-[#b8e4e4] mt-1">
                  تعديل العناوين، النصوص، ونماذج التواصل بلغتي العربية والإنجليزية فوراً
                </p>
              </div>

              <button
                onClick={handleSaveAllContent}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#5DCBCA] text-[#07444E] font-bold text-sm hover:bg-[#4ebaba] transition shadow-lg shadow-[#5DCBCA]/20 cursor-pointer self-start sm:self-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ كافة النصوص</span>
              </button>
            </div>

            <div className="space-y-4">
              {(db.content || []).map((item) => {
                const currentVal = contentForm[item.key_name] || {
                  ar: item.text_ar || '',
                  en: item.text_en || '',
                };

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-[#5DCBCA]/20 bg-[#0a4f5b]/70 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-[#5DCBCA]" />
                        <span>{item.key_name}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Arabic */}
                      <div>
                        <label className="block text-xs font-bold text-[#b8e4e4] mb-1.5">
                          النص بالعربية:
                        </label>
                        {item.text_ar && item.text_ar.length > 80 ? (
                          <textarea
                            rows={3}
                            value={currentVal.ar}
                            onChange={(e) =>
                              setContentForm({
                                ...contentForm,
                                [item.key_name]: { ...currentVal, ar: e.target.value },
                              })
                            }
                            className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={currentVal.ar}
                            onChange={(e) =>
                              setContentForm({
                                ...contentForm,
                                [item.key_name]: { ...currentVal, ar: e.target.value },
                              })
                            }
                            className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                          />
                        )}
                      </div>

                      {/* English */}
                      <div>
                        <label className="block text-xs font-bold text-[#b8e4e4] mb-1.5 text-left" dir="ltr">
                          English Text:
                        </label>
                        {item.text_en && item.text_en.length > 80 ? (
                          <textarea
                            rows={3}
                            dir="ltr"
                            value={currentVal.en}
                            onChange={(e) =>
                              setContentForm({
                                ...contentForm,
                                [item.key_name]: { ...currentVal, en: e.target.value },
                              })
                            }
                            className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                          />
                        ) : (
                          <input
                            type="text"
                            dir="ltr"
                            value={currentVal.en}
                            onChange={(e) =>
                              setContentForm({
                                ...contentForm,
                                [item.key_name]: { ...currentVal, en: e.target.value },
                              })
                            }
                            className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-4">
              <button
                onClick={handleSaveAllContent}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#5DCBCA] text-[#07444E] font-bold text-sm hover:bg-[#4ebaba] transition shadow-lg shadow-[#5DCBCA]/20 cursor-pointer"
              >
                حفظ كافة نصوص الموقع
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 6: BACKUP & DATA (النسخ والبيانات)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'backup' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#0a4f5b]/40 p-5 rounded-2xl border border-[#5DCBCA]/20">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                النسخ الاحتياطي والبيانات
              </h2>
              <p className="text-sm text-[#b8e4e4] mt-1">
                تصدير واستيراد كامل قاعدة البيانات الخاصة بالموقع مع كل الأقسام والمشاريع والمستخدمين
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Export */}
              <div className="p-6 rounded-2xl border border-[#5DCBCA]/25 bg-[#0a4f5b]/70 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-[#07444E] border border-[#5DCBCA]/40 flex items-center justify-center text-[#5DCBCA]">
                    <Download className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-white">تصدير نسخة احتياطية</h3>
                  <p className="text-xs sm:text-sm text-[#b8e4e4] leading-relaxed">
                    تحميل ملف JSON كامل يحتوي على كافة المشاريع، الأقسام، فريق العمل، والنصوص.
                  </p>
                </div>
                <button
                  onClick={handleExportBackup}
                  className="w-full py-3 rounded-xl bg-[#5DCBCA] text-[#07444E] font-bold text-sm hover:bg-[#4ebaba] transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير الآن (JSON)</span>
                </button>
              </div>

              {/* Import */}
              <div className="p-6 rounded-2xl border border-[#5DCBCA]/25 bg-[#0a4f5b]/70 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-[#07444E] border border-[#5DCBCA]/40 flex items-center justify-center text-[#5DCBCA]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-white">استيراد نسخة احتياطية</h3>
                  <p className="text-xs sm:text-sm text-[#b8e4e4] leading-relaxed">
                    رفع ملف JSON لاستعادة البيانات والمشاريع من نسخة سابقة محفوظة.
                  </p>
                </div>
                <label className="w-full py-3 rounded-xl bg-[#07444E] text-[#5DCBCA] font-bold text-sm border border-[#5DCBCA]/40 hover:bg-[#5DCBCA] hover:text-[#07444E] transition shadow-md cursor-pointer flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>اختيار ملف JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reset to Original */}
              <div className="p-6 rounded-2xl border border-rose-800/40 bg-rose-950/30 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-700/50 flex items-center justify-center text-rose-300">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-rose-200">استعادة البيانات الأصلية</h3>
                  <p className="text-xs sm:text-sm text-rose-200/80 leading-relaxed">
                    إعادة ضبط المنصة إلى الحالة الأولية وإلغاء كافة التعديلات والتغييرات المدخلة.
                  </p>
                </div>
                <button
                  onClick={handleResetToDefault}
                  className="w-full py-3 rounded-xl bg-rose-900/60 text-rose-100 border border-rose-700 hover:bg-rose-800 font-bold text-sm transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة الضبط الأصلي</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          IN-APP CONFIRMATION MODAL (100% Reliable - No window.confirm)
      ══════════════════════════════════════════════════════════════════════ */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#07444E] border border-[#5DCBCA]/40 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-700/50 flex items-center justify-center text-rose-300 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
                <p className="text-xs text-[#b8e4e4]">تأكيد العملية</p>
              </div>
            </div>

            <p className="text-sm text-slate-100 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-5 py-2.5 rounded-xl bg-[#05333B] text-[#b8e4e4] hover:text-white border border-[#5DCBCA]/30 text-sm font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-sm font-bold transition shadow-lg shadow-rose-900/40 cursor-pointer"
              >
                {confirmModal.confirmLabel || 'نعم، تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: ADD / EDIT PROJECT
      ══════════════════════════════════════════════════════════════════════ */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-[#07444E] border border-[#5DCBCA]/40 rounded-3xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#5DCBCA]/20 pb-4">
              <h3 className="text-xl font-bold text-white">
                {isNewProject ? 'إضافة مشروع جديد' : 'تعديل بيانات المشروع'}
              </h3>
              <button
                onClick={() => setEditingProject(null)}
                className="p-2 rounded-xl text-[#b8e4e4] hover:text-white hover:bg-[#0a4f5b] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {projectModalError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{projectModalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  عنوان المشروع (بالعربية) *
                </label>
                <input
                  type="text"
                  required
                  value={editingProject.title_ar}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, title_ar: e.target.value })
                  }
                  placeholder="مثال: هوية كافيه الأصيل"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  عنوان المشروع (بالإنكليزية)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editingProject.title_en}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, title_en: e.target.value })
                  }
                  placeholder="e.g. Al Aseel Café Identity"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  القسم الرئيسي *
                </label>
                <select
                  value={editingProject.section_id}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      section_id: Number(e.target.value),
                      subsection_id: null,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none cursor-pointer"
                >
                  {db.sections.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#07444E] text-white">
                      {s.name_ar} ({s.name_en})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  القسم الفرعي
                </label>
                <select
                  value={editingProject.subsection_id || ''}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      subsection_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#07444E] text-white">
                    بدون قسم فرعي
                  </option>
                  {db.subsections
                    .filter((s) => s.section_id === editingProject.section_id)
                    .map((sub) => (
                      <option key={sub.id} value={sub.id} className="bg-[#07444E] text-white">
                        {sub.name_ar}
                      </option>
                    ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  رابط صورة الغلاف (URL أو مسار الملف)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editingProject.cover_image}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, cover_image: e.target.value })
                  }
                  placeholder="https://... أو /images/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  الوسوم والتقنيات (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  value={editingProject.tech_tags || ''}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, tech_tags: e.target.value })
                  }
                  placeholder="هوية بصرية, شعار, تصميم ألوان"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  وصف المشروع (بالعربية)
                </label>
                <textarea
                  rows={3}
                  value={editingProject.description_ar}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, description_ar: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  وصف المشروع (بالإنكليزية)
                </label>
                <textarea
                  rows={2}
                  dir="ltr"
                  value={editingProject.description_en}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, description_en: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#5DCBCA]/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="px-5 py-2.5 rounded-xl bg-[#05333B] text-[#b8e4e4] hover:text-white border border-[#5DCBCA]/30 text-sm font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveProject}
                className="px-6 py-2.5 rounded-xl bg-[#5DCBCA] text-[#07444E] font-bold text-sm hover:bg-[#4ebaba] transition shadow-md shadow-[#5DCBCA]/20 cursor-pointer"
              >
                حفظ المشروع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: ADD / EDIT SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#07444E] border border-[#5DCBCA]/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#5DCBCA]/20 pb-3">
              <h3 className="text-lg font-bold text-white">
                {isNewSection ? 'إضافة قسم رئيسي جديد' : 'تعديل القسم الرئيسي'}
              </h3>
              <button
                onClick={() => setEditingSection(null)}
                className="p-1.5 rounded-xl text-[#b8e4e4] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sectionModalError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{sectionModalError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  اسم القسم (عربي) *
                </label>
                <input
                  type="text"
                  value={editingSection.name_ar}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, name_ar: e.target.value })
                  }
                  placeholder="مثال: الهويات البصرية"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  اسم القسم (English)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editingSection.name_en}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, name_en: e.target.value })
                  }
                  placeholder="e.g. Visual Identities"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  الاسم اللطيف (Slug)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editingSection.slug}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, slug: e.target.value })
                  }
                  placeholder="branding"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#5DCBCA]/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="px-4 py-2 rounded-xl bg-[#05333B] text-[#b8e4e4] hover:text-white border border-[#5DCBCA]/30 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveSection}
                className="px-5 py-2 rounded-xl bg-[#5DCBCA] text-[#07444E] font-bold text-xs sm:text-sm hover:bg-[#4ebaba] transition cursor-pointer"
              >
                حفظ القسم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: ADD / EDIT SUBSECTION
      ══════════════════════════════════════════════════════════════════════ */}
      {editingSubSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#07444E] border border-[#5DCBCA]/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#5DCBCA]/20 pb-3">
              <h3 className="text-lg font-bold text-white">
                {isNewSubSection ? 'إضافة تصنيف فرعي جديد' : 'تعديل التصنيف الفرعي'}
              </h3>
              <button
                onClick={() => setEditingSubSection(null)}
                className="p-1.5 rounded-xl text-[#b8e4e4] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {subSectionModalError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{subSectionModalError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  اسم التصنيف الفرعي (عربي) *
                </label>
                <input
                  type="text"
                  value={editingSubSection.name_ar}
                  onChange={(e) =>
                    setEditingSubSection({ ...editingSubSection, name_ar: e.target.value })
                  }
                  placeholder="مثال: مطاعم ومقاهي"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  اسم التصنيف الفرعي (English)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editingSubSection.name_en}
                  onChange={(e) =>
                    setEditingSubSection({ ...editingSubSection, name_en: e.target.value })
                  }
                  placeholder="e.g. Restaurants & Cafés"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  الاسم اللطيف (Slug)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editingSubSection.slug}
                  onChange={(e) =>
                    setEditingSubSection({ ...editingSubSection, slug: e.target.value })
                  }
                  placeholder="restaurants"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#5DCBCA]/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingSubSection(null)}
                className="px-4 py-2 rounded-xl bg-[#05333B] text-[#b8e4e4] hover:text-white border border-[#5DCBCA]/30 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveSubSection}
                className="px-5 py-2 rounded-xl bg-[#5DCBCA] text-[#07444E] font-bold text-xs sm:text-sm hover:bg-[#4ebaba] transition cursor-pointer"
              >
                حفظ التصنيف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: ADD / EDIT TEAM MEMBER
      ══════════════════════════════════════════════════════════════════════ */}
      {editingTeamMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#07444E] border border-[#5DCBCA]/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#5DCBCA]/20 pb-3">
              <h3 className="text-lg font-bold text-white">
                {isNewTeamMember ? 'إضافة عضو جديد للفريق' : 'تعديل بيانات العضو'}
              </h3>
              <button
                onClick={() => setEditingTeamMember(null)}
                className="p-1.5 rounded-xl text-[#b8e4e4] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {teamModalError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{teamModalError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  الاسم (بالعربية) *
                </label>
                <input
                  type="text"
                  value={editingTeamMember.name_ar}
                  onChange={(e) =>
                    setEditingTeamMember({ ...editingTeamMember, name_ar: e.target.value })
                  }
                  placeholder="مثال: دانيال"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  الاسم (بالإنكليزية)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editingTeamMember.name_en}
                  onChange={(e) =>
                    setEditingTeamMember({ ...editingTeamMember, name_en: e.target.value })
                  }
                  placeholder="e.g. Daniel"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  المسمى الوظيفي / الدور (عربي)
                </label>
                <input
                  type="text"
                  value={editingTeamMember.role_ar}
                  onChange={(e) =>
                    setEditingTeamMember({ ...editingTeamMember, role_ar: e.target.value })
                  }
                  placeholder="مثال: مصمم هويات بصرية"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  المسمى الوظيفي (English)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editingTeamMember.role_en}
                  onChange={(e) =>
                    setEditingTeamMember({ ...editingTeamMember, role_en: e.target.value })
                  }
                  placeholder="e.g. Brand Identity Designer"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  المهارات والخبرات (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  value={editingTeamMember.skills_ar || ''}
                  onChange={(e) =>
                    setEditingTeamMember({ ...editingTeamMember, skills_ar: e.target.value })
                  }
                  placeholder="Photoshop, Illustrator, Branding"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#5DCBCA]/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingTeamMember(null)}
                className="px-4 py-2 rounded-xl bg-[#05333B] text-[#b8e4e4] hover:text-white border border-[#5DCBCA]/30 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveTeamMember}
                className="px-5 py-2 rounded-xl bg-[#5DCBCA] text-[#07444E] font-bold text-xs sm:text-sm hover:bg-[#4ebaba] transition cursor-pointer"
              >
                حفظ العضو
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: ADD / EDIT USER & ADMIN
      ══════════════════════════════════════════════════════════════════════ */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#07444E] border border-[#5DCBCA]/40 rounded-3xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#5DCBCA]/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#05333B] border border-[#5DCBCA]/40 flex items-center justify-center text-[#5DCBCA]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {isNewAdmin ? 'إضافة مشرف / مستخدم جديد' : 'تعديل بيانات المشرف والصلاحيات'}
                  </h3>
                  <p className="text-xs text-[#b8e4e4]">إدارة الحساب وصلاحيات الدخول</p>
                </div>
              </div>
              <button
                onClick={() => setEditingAdmin(null)}
                className="p-1.5 rounded-xl text-[#b8e4e4] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminModalError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{adminModalError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  اسم المستخدم (Username) *
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editingAdmin.username}
                  onChange={(e) =>
                    setEditingAdmin({ ...editingAdmin, username: e.target.value.toLowerCase() })
                  }
                  placeholder="e.g. ahmed_designer"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  {isNewAdmin ? 'كلمة المرور *' : 'تغيير كلمة المرور (اتركه فارغاً للإبقاء على الحالية)'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#b8e4e4] absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    dir="ltr"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder={isNewAdmin ? 'admin123' : 'كلمة المرور الجديدة...'}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#b8e4e4] mb-1.5">
                  الدور / المستوى الوظيفي *
                </label>
                <select
                  value={editingAdmin.role}
                  onChange={(e) =>
                    setEditingAdmin({
                      ...editingAdmin,
                      role: e.target.value as 'super_admin' | 'admin',
                      // Auto enable all if super_admin
                      can_manage_projects: true,
                      can_manage_sections: true,
                      can_manage_content: true,
                      can_manage_team: true,
                      can_manage_admins: e.target.value === 'super_admin',
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:border-[#5DCBCA] focus:outline-none cursor-pointer"
                >
                  <option value="super_admin" className="bg-[#07444E] text-white">
                    مدير عام للنظام (Super Admin) - صلاحيات كاملة
                  </option>
                  <option value="admin" className="bg-[#07444E] text-white">
                    مشرف مخصص (Admin) - صلاحيات محددة
                  </option>
                </select>
              </div>

              {/* Permissions Checkboxes */}
              <div className="p-4 rounded-2xl bg-[#05333B] border border-[#5DCBCA]/20 space-y-3">
                <div className="text-xs font-bold text-white mb-2">
                  الصلاحيات التفصيلية للمستخدم:
                </div>

                <label className="flex items-center gap-2.5 text-xs sm:text-sm text-[#b8e4e4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingAdmin.can_manage_projects)}
                    onChange={(e) =>
                      setEditingAdmin({ ...editingAdmin, can_manage_projects: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#5DCBCA] rounded"
                  />
                  <span>إدارة المشاريع (إضافة، تعديل، حذف)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs sm:text-sm text-[#b8e4e4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingAdmin.can_manage_sections)}
                    onChange={(e) =>
                      setEditingAdmin({ ...editingAdmin, can_manage_sections: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#5DCBCA] rounded"
                  />
                  <span>إدارة الأقسام الرئيسية والتصنيفات الفرعية</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs sm:text-sm text-[#b8e4e4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingAdmin.can_manage_content)}
                    onChange={(e) =>
                      setEditingAdmin({ ...editingAdmin, can_manage_content: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#5DCBCA] rounded"
                  />
                  <span>إدارة نصوص ومحتوى الموقع</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs sm:text-sm text-[#b8e4e4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingAdmin.can_manage_team)}
                    onChange={(e) =>
                      setEditingAdmin({ ...editingAdmin, can_manage_team: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#5DCBCA] rounded"
                  />
                  <span>إدارة فريق العمل</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs sm:text-sm text-[#b8e4e4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingAdmin.can_manage_admins)}
                    onChange={(e) =>
                      setEditingAdmin({ ...editingAdmin, can_manage_admins: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#5DCBCA] rounded"
                  />
                  <span>إدارة المشرفين الآخرين وإنشاء حسابات جديدة</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[#5DCBCA]/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="px-5 py-2.5 rounded-xl bg-[#05333B] text-[#b8e4e4] hover:text-white border border-[#5DCBCA]/30 text-sm font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveAdmin}
                className="px-6 py-2.5 rounded-xl bg-[#5DCBCA] text-[#07444E] font-bold text-sm hover:bg-[#4ebaba] transition shadow-md shadow-[#5DCBCA]/20 cursor-pointer"
              >
                {isNewAdmin ? 'إضافة المستخدم' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
