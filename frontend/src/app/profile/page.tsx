'use client';

import { useState, useRef } from 'react';
import AppShell from '@/components/AppShell';
import { apiUpdateProfile } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { Save, User, Mail, Phone, School, BookOpen, Briefcase, CheckCircle2, Camera, X, Upload } from 'lucide-react';

export default function ProfilePage() {
  const { profile, setProfile } = useProfileStore();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [form, setForm] = useState({ ...profile });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>(profile.avatar || '');
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleAvatarFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAvatarPreview(result);
      setForm((p) => ({ ...p, avatar: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiUpdateProfile({ ...form, avatar: avatarPreview });
      const nextProfile = {
        name: updated.name,
        email: updated.email,
        mobile: updated.mobile || '',
        schoolName: updated.schoolName || '',
        schoolLocation: updated.schoolLocation || '',
        designation: updated.designation || '',
        className: updated.className || '',
        avatar: updated.avatar || '',
      };
      setProfile(nextProfile);
      updateUser(nextProfile);
      setForm(nextProfile);
      setAvatarPreview(nextProfile.avatar);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview('');
    setForm((p) => ({ ...p, avatar: '' }));
  };

  const fields = [
    { key: 'name',           label: 'Full Name',       icon: User,      placeholder: 'John Doe',              type: 'text'  },
    { key: 'email',          label: 'Email Address',   icon: Mail,      placeholder: 'john@school.edu',        type: 'email' },
    { key: 'mobile',         label: 'Mobile Number',   icon: Phone,     placeholder: '+91 98765 43210',        type: 'tel'   },
    { key: 'designation',    label: 'Designation',     icon: Briefcase, placeholder: 'Senior Teacher',         type: 'text'  },
    { key: 'className',      label: 'Class / Grade',   icon: BookOpen,  placeholder: 'Grade 9-10',             type: 'text'  },
    { key: 'schoolName',     label: 'School Name',     icon: School,    placeholder: 'Delhi Public School',    type: 'text'  },
    { key: 'schoolLocation', label: 'School Location', icon: School,    placeholder: 'Bokaro Steel City',      type: 'text'  },
  ];

  const initials = form.name ? form.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <AppShell title="Profile" showBack backHref="/">
      <div className="p-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h1 className="text-lg font-bold text-gray-900">Edit Profile</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>

          {/* Avatar section */}
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-6">

              {/* Avatar with upload overlay */}
              <div className="relative flex-shrink-0 group">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleAvatarFile(e.target.files?.[0] ?? null)}
                />

                {/* Avatar circle */}
                <div
                  className="w-20 h-20 rounded-full overflow-hidden cursor-pointer relative border-2 border-white shadow-md"
                  style={{ boxShadow: '0 0 0 3px #E8470A22' }}
                  onClick={() => avatarInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDraggingAvatar(true); }}
                  onDragLeave={() => setIsDraggingAvatar(false)}
                  onDrop={e => { e.preventDefault(); setIsDraggingAvatar(false); handleAvatarFile(e.dataTransfer.files?.[0] ?? null); }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#E8470A]/10 flex items-center justify-center text-2xl font-bold text-[#E8470A]">
                      {initials}
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isDraggingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Remove button */}
                {avatarPreview && (
                  <button
                    onClick={removeAvatar}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Info + upload button */}
              <div className="flex-1">
                <h2 className="font-bold text-gray-900 text-base">{form.name || 'Your Name'}</h2>
                <p className="text-sm text-gray-500">{form.designation || 'Designation'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{form.schoolName}{form.schoolLocation ? ` · ${form.schoolLocation}` : ''}</p>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    Upload Photo
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="flex items-center gap-1.5 text-xs font-medium border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">JPG, PNG or GIF · Max 5MB · Click photo or drag to upload</p>
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {fields.map(({ key, label, icon: Icon, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {label}
                </label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={type}
                    value={(form as any)[key] || ''}
                    onChange={e => update(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <p className="text-xs text-gray-400">Changes reflect instantly across the app.</p>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 font-semibold text-sm px-6 py-2.5 rounded-xl transition-all ${
                saved ? 'bg-emerald-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
            >
              {saved ? <><CheckCircle2 className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}</>}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
