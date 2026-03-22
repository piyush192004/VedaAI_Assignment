'use client';

import { useRef, useState } from 'react';
import { GeneratedPaper, Difficulty } from '@/types';
import { Download, RefreshCw, Printer, Clock, Award, BookOpen } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  paper: GeneratedPaper;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const DIFF: Record<Difficulty, { label: string; cls: string }> = {
  easy:   { label: 'Easy',     cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  medium: { label: 'Moderate', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  hard:   { label: 'Hard',     cls: 'bg-red-100 text-red-700 border-red-200' },
};

export default function QuestionPaper({ paper, onRegenerate, isRegenerating }: Props) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [section, setSection] = useState('');
  const [downloading, setDownloading] = useState(false);

  const totalQ = paper.sections.reduce((a, s) => a + s.questions.length, 0);

  const handlePDF = async () => {
    if (!paperRef.current || downloading) return;
    setDownloading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(paperRef.current, { scale: 2.5, backgroundColor: '#ffffff', useCORS: true });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * w) / canvas.width;
      let remaining = imgH, offset = 0;
      while (remaining > 0) {
        if (offset > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -offset, w, imgH);
        offset += h; remaining -= h;
      }
      pdf.save(`${paper.title.replace(/\s+/g, '_')}.pdf`);
    } catch (e) { console.error(e); }
    finally { setDownloading(false); }
  };

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Action bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-card">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span><span className="font-semibold text-gray-900">{totalQ}</span> questions</span>
          <span className="text-gray-200">·</span>
          <span><span className="font-semibold text-gray-900">{paper.totalMarks}</span> marks</span>
          <span className="text-gray-200">·</span>
          <span><span className="font-semibold text-gray-900">{paper.duration}</span> min</span>
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 text-xs border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', isRegenerating && 'animate-spin')} />
              Regenerate
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={handlePDF}
            disabled={downloading}
            className="flex items-center gap-1.5 text-xs bg-gray-900 hover:bg-gray-800 text-white font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-60"
          >
            <Download className={clsx('w-3.5 h-3.5', downloading && 'animate-bounce')} />
            {downloading ? 'Exporting...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Paper */}
      <div
        id="question-paper-print"
        ref={paperRef}
        className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white px-5 md:px-5 md:px-5 md:px-10 py-4 md:py-5 md:py-7 text-center border-b-4 border-amber-500">
          <div className="text-amber-400 text-[10px] font-semibold tracking-[0.3em] uppercase mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Academic Assessment
          </div>
          <h1 className="text-2xl font-bold tracking-wide uppercase">{paper.title}</h1>
          <p className="text-gray-400 text-sm mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            {paper.subject} &nbsp;·&nbsp; {paper.gradeLevel}
          </p>
          <div className="flex items-center justify-center gap-8 mt-4 text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Time: <strong className="text-white ml-1">{paper.duration} min</strong>
            </span>
            <span className="text-gray-600">|</span>
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Max Marks: <strong className="text-white ml-1">{paper.totalMarks}</strong>
            </span>
            <span className="text-gray-600">|</span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              {paper.sections.length} Section{paper.sections.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Student Info */}
        <div className="px-5 md:px-5 md:px-10 py-4 md:py-5 bg-gray-50 border-b-2 border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
            {[
              { label: 'Student Name', val: studentName, set: setStudentName },
              { label: 'Roll Number',  val: rollNo,       set: setRollNo },
              { label: 'Section',      val: section,       set: setSection },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {label}
                </label>
                <input
                  type="text"
                  value={val}
                  onChange={e => set(e.target.value)}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  className="w-full border-b-2 border-gray-300 bg-transparent text-gray-900 text-sm py-1 focus:outline-none focus:border-gray-700 transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="px-10 py-3 bg-amber-50 border-b border-amber-100">
          <p className="text-xs text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
            <strong>General Instructions: </strong>
            All questions are compulsory unless stated otherwise. Marks are indicated in brackets.
            Write answers clearly and legibly.
          </p>
        </div>

        {/* Sections */}
        <div className="px-5 md:px-10 py-6 md:py-8 space-y-10">
          {paper.sections.map((sec, sIdx) => (
            <div key={sIdx}>
              <div className="flex items-start justify-between border-b-2 border-gray-800 pb-2 mb-5">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">{sec.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5 italic" style={{ fontFamily: 'Inter, sans-serif' }}>{sec.instruction}</p>
                </div>
                <span className="flex-shrink-0 border-2 border-gray-800 px-2.5 py-0.5 text-xs font-bold text-gray-700 ml-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                  [{sec.totalMarks} Marks]
                </span>
              </div>

              <div className="space-y-5">
                {sec.questions.map((q, qIdx) => (
                  <div key={q.id} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 text-sm font-bold text-gray-600 pt-0.5">{qIdx + 1}.</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="flex-1 text-sm leading-relaxed text-gray-900">{q.text}</p>
                        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                          {/* Difficulty badge (screen only) */}
                          <span
                            className={clsx(
                              'no-print inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                              DIFF[q.difficulty]?.cls ?? 'bg-gray-100 text-gray-600 border-gray-200'
                            )}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            {DIFF[q.difficulty]?.label ?? q.difficulty}
                          </span>
                          <span className="border border-gray-400 px-2 py-0.5 text-[10px] font-bold text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                            [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                          </span>
                        </div>
                      </div>

                      {/* MCQ options */}
                      {q.options && q.options.length > 0 && (
                        <div className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-0.5">
                          {q.options.map((o, i) => (
                            <p key={i} className="text-sm text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>{o}</p>
                          ))}
                        </div>
                      )}

                      {/* Answer lines */}
                      {(q.type === 'short_answer' || q.type === 'fill_blank') && (
                        <div className="mt-3 space-y-2">
                          {[1,2].map(i => <div key={i} className="border-b border-gray-300 w-full h-5" />)}
                        </div>
                      )}
                      {q.type === 'long_answer' && (
                        <div className="mt-3 space-y-2">
                          {[1,2,3,4,5].map(i => <div key={i} className="border-b border-gray-300 w-full h-6" />)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 md:px-10 py-4 bg-gray-900 text-center">
          <p className="text-xs text-gray-400 tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
            ✦ &nbsp; End of Paper &nbsp; ✦ &nbsp; Generated by <span className="text-amber-400 font-semibold">VedaAI</span> &nbsp; · &nbsp;
            {new Date(paper.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
