'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  Upload, X, Plus, Minus, ChevronDown, Mic,
  Calendar, ArrowLeft, ArrowRight, Loader2
} from 'lucide-react';
import { createAssignment } from '@/lib/api';
import { useAssignmentStore } from '@/store/assignmentStore';

type QuestionType = 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank';
type Difficulty = 'easy' | 'medium' | 'hard';

interface QuestionSection {
  id: string;
  type: QuestionType;
  count: number;
  marks: number;
}

const Q_TYPE_LABELS: Record<QuestionType, string> = {
  mcq:           'Multiple Choice Questions',
  short_answer:  'Short Questions',
  long_answer:   'Long Answer Questions',
  true_false:    'True/False Questions',
  fill_blank:    'Fill in the Blank',
};

const Q_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'mcq',           label: 'Multiple Choice Questions' },
  { value: 'short_answer',  label: 'Short Questions' },
  { value: 'long_answer',   label: 'Long Answer Questions' },
  { value: 'true_false',    label: 'True/False Questions' },
  { value: 'fill_blank',    label: 'Fill in the Blank' },
];

function genId() { return Math.random().toString(36).slice(2); }

export default function CreateAssignmentForm() {
  const router = useRouter();
  const setGenerationStatus = useAssignmentStore(s => s.setGenerationStatus);
  const setGenerationMessage = useAssignmentStore(s => s.setGenerationMessage);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Grade 9-10');
  const [dueDate, setDueDate] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [duration, setDuration] = useState(60);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sections, setSections] = useState<QuestionSection[]>([
    { id: genId(), type: 'mcq',          count: 4, marks: 1 },
    { id: genId(), type: 'short_answer', count: 3, marks: 2 },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setUploadedFile(files[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const updateSection = (id: string, field: keyof QuestionSection, value: QuestionType | number) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSection = () => {
    setSections(prev => [...prev, { id: genId(), type: 'long_answer', count: 5, marks: 5 }]);
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const totalQuestions = sections.reduce((a, s) => a + s.count, 0);
  const calcTotalMarks = sections.reduce((a, s) => a + s.count * s.marks, 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!subject.trim()) e.subject = 'Subject is required';
    if (!dueDate) e.dueDate = 'Due date is required';
    if (!sections.length) e.sections = 'Add at least one question type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await createAssignment({
        title: title.trim() || `${subject} Assessment`,
        subject: subject.trim(),
        gradeLevel,
        dueDate,
        totalMarks: calcTotalMarks || totalMarks,
        duration,
        questionConfigs: sections.map(s => ({
          type: s.type,
          count: s.count,
          marks: s.marks,
          difficulty: 'medium' as Difficulty,
        })),
        additionalInstructions: additionalInfo.trim(),
        file: uploadedFile,
      });
      setGenerationStatus('pending');
      setGenerationMessage('Your question paper is being generated...');
      router.push(`/assignments/${result.assignmentId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create';
      setErrors({ submit: msg });
      setSubmitting(false);
    }
  };

  return (
    <div className="px-3 md:px-8 pb-12 max-w-3xl">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">

        {/* Section header */}
        <div className="px-4 md:px-8 py-4 md:py-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-base">Assignment Details</h2>
          <p className="text-sm text-gray-500 mt-0.5">Basic information about your assignment</p>
        </div>

        <div className="px-4 md:px-8 py-5 md:py-6 space-y-5 md:space-y-6">

          {/* Title + Subject + Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Paper Title
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                placeholder="e.g. Mid-Term Examination 2025"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Subject</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                placeholder="e.g. Physics, Mathematics"
              />
              {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Grade Level</label>
              <div className="relative">
                <select
                  value={gradeLevel}
                  onChange={e => setGradeLevel(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all appearance-none bg-white"
                >
                  {['Grade 1-3','Grade 4-5','Grade 6-8','Grade 9-10','Grade 11-12','Undergraduate','Postgraduate'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* File upload — Figma style */}
          <div>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-gray-400 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              {uploadedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setUploadedFile(null); }}
                    className="ml-2 p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 mx-auto mb-3 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {isDragActive ? 'Drop it here!' : 'Choose a file or drag & drop it here'}
                  </p>
                  <p className="text-xs text-gray-400 mb-3">JPEG, PNG, PDF, upto 10MB</p>
                  <button
                    type="button"
                    className="text-xs font-medium border border-gray-300 text-gray-700 px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Browse Files
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Upload images of your preferred document/image
            </p>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Due Date</label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all appearance-none bg-white"
                placeholder="Choose a chapter"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Duration (minutes)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDuration(v => Math.max(10, v - 10))}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Minus className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(Math.max(1, Number(e.target.value)))}
                className="w-20 text-center border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                min={1}
              />
              <button
                type="button"
                onClick={() => setDuration(v => v + 10)}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-500">minutes</span>
            </div>
          </div>

          {/* Question Types — matches Figma table exactly */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="grid grid-cols-3 flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wide pr-8">
                <span>Question Type</span>
                <span className="text-center">No. of Questions</span>
                <span className="text-center">Marks</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {sections.map((sec) => (
                <div key={sec.id} className="grid grid-cols-3 items-center gap-3 pr-8 relative group">
                  {/* Type dropdown */}
                  <div className="relative">
                    <select
                      value={sec.type}
                      onChange={e => updateSection(sec.id, 'type', e.target.value as QuestionType)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 appearance-none bg-white pr-7"
                    >
                      {Q_TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Count stepper */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSection(sec.id, 'count', Math.max(1, sec.count - 1))}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 flex-shrink-0"
                    >
                      <Minus className="w-3 h-3 text-gray-600" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-gray-900">{sec.count}</span>
                    <button
                      type="button"
                      onClick={() => updateSection(sec.id, 'count', sec.count + 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 flex-shrink-0"
                    >
                      <Plus className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>

                  {/* Marks stepper */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateSection(sec.id, 'marks', Math.max(1, sec.marks - 1))}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 flex-shrink-0"
                    >
                      <Minus className="w-3 h-3 text-gray-600" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-gray-900">{sec.marks}</span>
                    <button
                      type="button"
                      onClick={() => updateSection(sec.id, 'marks', sec.marks + 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 flex-shrink-0"
                    >
                      <Plus className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>

                  {/* Remove button */}
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(sec.id)}
                      className="absolute -right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Question Type */}
            <button
              type="button"
              onClick={addSection}
              className="flex items-center gap-2 mt-4 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
                <Plus className="w-3 h-3" />
              </div>
              Add Question Type
            </button>

            {errors.sections && <p className="text-red-500 text-xs mt-2">{errors.sections}</p>}

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-gray-100 text-right space-y-0.5">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Total Questions : </span>{totalQuestions}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Total Marks : </span>{calcTotalMarks}
              </p>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Information <span className="font-normal text-gray-400">(For better output)</span>
            </label>
            <div className="relative">
              <textarea
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all resize-none"
                placeholder="e.g Generate a question paper for 3 hour exam duration..."
              />
              <button className="absolute bottom-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {errors.submit}
            </div>
          )}
        </div>

        {/* Footer nav — Previous / Next */}
        <div className="px-4 md:px-8 py-4 md:py-5 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm px-6 py-2.5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
