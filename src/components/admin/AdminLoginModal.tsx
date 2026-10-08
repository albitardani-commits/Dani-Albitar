import React, { useState } from 'react';
import { Lock, User, KeyRound, ArrowLeft, ShieldCheck, Sparkles, AlertCircle, X } from 'lucide-react';
import { AdminUser, NetPalDatabase } from '../../types';
import { loginAdmin } from '../../services/storage';

interface AdminLoginModalProps {
  isOpen: boolean;
  db: NetPalDatabase;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  db,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = loginAdmin(db, username, password);
    if (user) {
      onLoginSuccess(user);
      onClose();
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة. يمكنك استخدام الدخول السريع أدناه.');
    }
  };

  const handleQuickLogin = () => {
    const user = loginAdmin(db, 'admin', 'admin123');
    if (user) {
      onLoginSuccess(user);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      style={{ fontFamily: "'Co Headline Arbc', 'Co Headline', 'Segoe UI', sans-serif" }}
    >
      <div className="relative w-full max-w-md bg-[#07444E] border border-[#5DCBCA]/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-[#b8e4e4] hover:text-white hover:bg-[#0a4f5b] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon */}
        <div className="text-center mb-6 space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#07444E] to-[#5DCBCA] p-[2px] mx-auto shadow-lg shadow-[#5DCBCA]/20 mb-3">
            <div className="w-full h-full bg-[#05333B] rounded-[14px] flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#5DCBCA]" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white">تسجيل الدخول إلى لوحة التحكم</h3>
          <p className="text-xs text-[#b8e4e4]">
            أهلاً بك! يمكنك الدخول بسلاسة وتعديل كل محتويات ومشاريع الموقع.
          </p>
        </div>

        {/* 1-Click Fast Login Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-[#05333B] border border-[#5DCBCA]/40 text-right space-y-2">
          <div className="flex items-center gap-2 text-[#5DCBCA] text-xs font-bold">
            <Sparkles className="w-4 h-4 text-[#5DCBCA]" />
            <span>دخول سريع ومباشر بضغطة واحدة:</span>
          </div>
          <p className="text-[11px] text-[#b8e4e4] leading-relaxed">
            تم ضبط الحساب مسبقاً (admin / admin123). اضغط الزر للدخول فوراً دون عناء.
          </p>
          <button
            type="button"
            onClick={handleQuickLogin}
            className="w-full mt-2 py-2.5 rounded-xl bg-[#5DCBCA] hover:bg-[#4ebaba] text-[#07444E] font-bold text-xs shadow-md shadow-[#5DCBCA]/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>دخول مباشر كمدير للنظام (Super Admin)</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#b8e4e4] mb-1.5">اسم المستخدم</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#b8e4e4] absolute right-3.5 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:outline-none focus:border-[#5DCBCA]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#b8e4e4] mb-1.5">كلمة المرور</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#b8e4e4] absolute right-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#05333B] border border-[#5DCBCA]/30 text-white text-sm focus:outline-none focus:border-[#5DCBCA]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#5DCBCA] hover:bg-[#4ebaba] text-[#07444E] font-bold text-sm shadow-lg shadow-[#5DCBCA]/25 transition cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            <span>دخول لوحة التحكم</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
