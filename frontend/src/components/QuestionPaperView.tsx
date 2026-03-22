'use client';

import { useRef, useState } from 'react';
import { GeneratedPaper } from '@/types';
import DifficultyBadge from './DifficultyBadge';
import { Download, RefreshCw, Printer, Clock, Award, BookOpen } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  paper: GeneratedPaper;
  assignmentId: string;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  mcq: 'MCQ',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  true_false: 'True/False',
  fill_blank: 'Fill in the Blank',
};

export default function QuestionPaperView({ paper, assignmentId, onRegenerate, isRegenerating }: Props) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [section, setSection] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      if (!paperRef.current) return;

      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`${paper.title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="no-print flex items-center justify-between glass rounded-xl px-5 py-3 border border-ink-700">
        <p className="text-sm text-ink-400">
          <span className="text-ink-200 font-medium">{paper.sections.reduce((a, s) => a + s.questions.length, 0)} questions</span>
          {' · '}
          <span className="text-ink-200 font-medium">{paper.totalMarks} marks</span>
          {' · '}
          <span className="text-ink-200 font-medium">{paper.duration} min</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 text-xs bg-ink-700 hover:bg-ink-600 text-ink-200 px-3 py-2 rounded-lg transition-colors border border-ink-600 disabled:opacity-50"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isRegenerating && 'animate-spin')} />
            Regenerate
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs bg-ink-700 hover:bg-ink-600 text-ink-200 px-3 py-2 rounded-lg transition-colors border border-ink-600"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-ink-900 font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Paper */}
      <div
        ref={paperRef}
        className="print-paper bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white px-8 py-6 text-center">
          <h1 className="text-2xl font-bold tracking-wide uppercase">{paper.title}</h1>
          <p className="text-gray-300 text-sm mt-1">{paper.subject} · {paper.gradeLevel}</p>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Time: {paper.duration} minutes
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              Maximum Marks: {paper.totalMarks}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {paper.sections.length} Section{paper.sections.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Student Info */}
        <div className="px-8 py-5 border-b-2 border-gray-300 bg-gray-50">
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Name', value: studentName, setter: setStudentName },
              { label: 'Roll Number', value: rollNumber, setter: setRollNumber },
              { label: 'Section', value: section, setter: setSection },
            ].map(({ label, value, setter }) => (
              <div key={label} className="no-print">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full border-b-2 border-gray-400 bg-transparent text-gray-900 text-sm py-1 focus:outline-none focus:border-gray-700 transition-colors"
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
              </div>
            ))}
            {/* Print view (shows filled data as static text) */}
            {[
              { label: 'Name', value: studentName },
              { label: 'Roll Number', value: rollNumber },
              { label: 'Section', value: section },
            ].map(({ label, value }) => (
              <div key={`print-${label}`} className="hidden print-student-field">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}: </span>
                <span className="border-b border-gray-400 inline-block min-w-[120px] text-sm">{value || '\u00A0'.repeat(20)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions banner */}
        <div className="px-8 py-3 bg-yellow-50 border-b border-yellow-200">
          <p className="text-xs text-gray-600 font-medium">
            <strong>General Instructions:</strong> All questions are compulsory unless stated otherwise. 
            Write legibly. Marks are indicated against each question.
          </p>
        </div>

        {/* Sections */}
        <div className="px-8 py-6 space-y-8">
          {paper.sections.map((section, sIdx) => (
            <div key={sIdx}>
              {/* Section header */}
              <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2 mb-4">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-widest">{section.title}</h2>
                  <p className="text-xs text-gray-500 mt-0.5 italic">{section.instruction}</p>
                </div>
                <span className="text-sm font-bold text-gray-600 border border-gray-400 px-3 py-1 rounded">
                  [{section.totalMarks} Marks]
                </span>
              </div>

              {/* Questions */}
              <div className="space-y-5">
                {section.questions.map((q, qIdx) => (
                  <div key={q.id} className="flex gap-3">
                    <span className="text-sm font-bold text-gray-600 flex-shrink-0 w-7 pt-0.5">
                      {qIdx + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm leading-relaxed text-gray-900 flex-1">{q.text}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Print-visible marks */}
                          <span className="text-xs font-bold text-gray-600 border border-gray-300 px-2 py-0.5 rounded whitespace-nowrap">
                            [{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}]
                          </span>
                          {/* Difficulty badge - screen only */}
                          <span className="no-print">
                            <DifficultyBadge difficulty={q.difficulty} size="xs" />
                          </span>
                        </div>
                      </div>

                      {/* MCQ options */}
                      {q.options && q.options.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-1">
                          {q.options.map((opt, oIdx) => (
                            <p key={oIdx} className="text-sm text-gray-700 pl-2">
                              {opt}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* True/False */}
                      {q.type === 'true_false' && !q.options && (
                        <div className="mt-2 flex gap-6">
                          <span className="text-sm text-gray-600">○ True</span>
                          <span className="text-sm text-gray-600">○ False</span>
                        </div>
                      )}

                      {/* Answer line for short answer */}
                      {(q.type === 'short_answer' || q.type === 'fill_blank') && (
                        <div className="mt-3 space-y-1">
                          {[1, 2].map((l) => (
                            <div key={l} className="border-b border-gray-300 w-full h-5" />
                          ))}
                        </div>
                      )}

                      {/* Answer lines for long answer */}
                      {q.type === 'long_answer' && (
                        <div className="mt-3 space-y-1">
                          {[1, 2, 3, 4, 5].map((l) => (
                            <div key={l} className="border-b border-gray-300 w-full h-6" />
                          ))}
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
        <div className="px-8 py-4 bg-gray-100 border-t border-gray-300 text-center">
          <p className="text-xs text-gray-500">
            *** End of Question Paper *** &nbsp;|&nbsp; Generated by VedaAI &nbsp;|&nbsp;{' '}
            {new Date(paper.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
