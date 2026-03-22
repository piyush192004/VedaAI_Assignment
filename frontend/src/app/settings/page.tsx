'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { Bell, Moon, Globe, Shield, Download, Trash2, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react';

interface Setting {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([
    { key: 'emailNotifs',    label: 'Email Notifications',     description: 'Receive email when paper generation completes',     value: true  },
    { key: 'pushNotifs',     label: 'Push Notifications',      description: 'Browser push notifications for real-time updates',  value: false },
    { key: 'darkMode',       label: 'Dark Mode',               description: 'Switch to dark theme (coming soon)',                value: false },
    { key: 'autoSave',       label: 'Auto-save Drafts',        description: 'Automatically save assignment drafts as you type',  value: true  },
    { key: 'difficultyTags', label: 'Show Difficulty Tags',    description: 'Display Easy / Moderate / Hard tags on papers',     value: true  },
    { key: 'answerKey',      label: 'Include Answer Key',      description: 'Generate answer key alongside question paper',      value: false },
  ]);

  const [language, setLanguage] = useState('English');
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) =>
    setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value: !s.value } : s));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    {
      title: 'Notifications',
      icon: Bell,
      keys: ['emailNotifs', 'pushNotifs'],
    },
    {
      title: 'Appearance',
      icon: Moon,
      keys: ['darkMode'],
    },
    {
      title: 'Editor',
      icon: Shield,
      keys: ['autoSave', 'difficultyTags', 'answerKey'],
    },
  ];

  return (
    <AppShell title="Settings">
      <div className="p-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h1 className="text-lg font-bold text-gray-900">Settings</h1>
        </div>

        <div className="space-y-4">
          {/* Toggle sections */}
          {sections.map(({ title, icon: Icon, keys }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Icon className="w-4 h-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {settings.filter((s) => keys.includes(s.key)).map((s) => (
                  <div key={s.key} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                    </div>
                    <button
                      onClick={() => toggle(s.key)}
                      className="flex-shrink-0 ml-4"
                    >
                      {s.value ? (
                        <ToggleRight className="w-9 h-9 text-gray-900" />
                      ) : (
                        <ToggleLeft className="w-9 h-9 text-gray-300" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Language */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Language & Region</h2>
            </div>
            <div className="px-6 py-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Interface Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white appearance-none"
              >
                {['English', 'Hindi', 'Tamil', 'Telugu', 'Marathi', 'Bengali'].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Download className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Data & Privacy</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left">
                <Download className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Export My Data</p>
                  <p className="text-xs text-gray-500">Download all your assignments and papers</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-100 hover:bg-red-50 transition-colors text-left">
                <Trash2 className="w-4 h-4 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-600">Clear All Data</p>
                  <p className="text-xs text-red-400">Permanently delete all assignments</p>
                </div>
              </button>
            </div>
          </div>

          {/* App info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">VedaAI</p>
              <p className="text-xs text-gray-400">Version 1.0.0 · Built for educators</p>
            </div>
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl transition-all ${
                saved ? 'bg-emerald-500 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
            >
              {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
