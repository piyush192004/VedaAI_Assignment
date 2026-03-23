'use client';

import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  School,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiSignup } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setProfile = useProfileStore((state) => state.setProfile);

  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
    schoolLocation: '',
    designation: '',
    className: '',
    mobile: '',
  });

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateStep1 = () => {
    if (!form.name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!form.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Enter a valid email');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { token, user } = await apiSignup({
        name: form.name,
        email: form.email,
        password: form.password,
        schoolName: form.schoolName,
        schoolLocation: form.schoolLocation,
        designation: form.designation,
        className: form.className,
        mobile: form.mobile,
      });
      setAuth(token, user);
      setProfile({
        name: user.name,
        email: user.email,
        mobile: user.mobile || '',
        schoolName: user.schoolName || '',
        schoolLocation: user.schoolLocation || '',
        designation: user.designation || '',
        className: user.className || '',
        avatar: user.avatar || '',
      });
      router.push('/');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center">
            <div className="w-10 h-10 rounded-xl bg-[#E8470A] flex items-center justify-center shadow-md">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <path d="M3 14L9 4L15 14H3Z" fill="white" fillOpacity="0.9" />
                <path d="M6 14L9 9L12 14H6Z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-2xl text-gray-900 tracking-tight">VedaAI</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Join thousands of teachers using AI</p>
        </div>

        <div className="flex items-center gap-2 mb-6 px-1">
          {[1, 2].map((item) => (
            <div key={item} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                step > item ? 'bg-emerald-500 text-white' : step === item ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > item ? <CheckCircle2 className="w-4 h-4" /> : item}
              </div>
              <span className={`text-xs font-medium ${step === item ? 'text-gray-900' : 'text-gray-400'}`}>
                {item === 1 ? 'Account' : 'School Info'}
              </span>
              {item < 2 && <div className={`flex-1 h-px ${step > item ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="John Doe" className={inputClass} autoComplete="name" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="teacher@school.edu" className={inputClass} autoComplete="email" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Min. 6 characters" className={`${inputClass} pr-10`} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="Repeat password" className={inputClass} autoComplete="new-password" />
                </div>
              </div>
              <button type="button" onClick={handleNext} className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-all mt-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">School Name</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form.schoolName} onChange={(e) => update('schoolName', e.target.value)} placeholder="Delhi Public School" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">School Location</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={form.schoolLocation} onChange={(e) => update('schoolLocation', e.target.value)} placeholder="New Delhi" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Designation</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={form.designation} onChange={(e) => update('designation', e.target.value)} placeholder="Teacher" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Mobile</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" value={form.mobile} onChange={(e) => update('mobile', e.target.value)} placeholder="+91 98765..." className={inputClass} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400">School info is optional — you can update it later in your profile.</p>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => { setStep(1); setError(''); }} className="flex items-center gap-1.5 border border-gray-200 text-gray-700 font-semibold py-3 px-5 rounded-xl hover:bg-gray-50 transition-all">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</> : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-gray-900 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
