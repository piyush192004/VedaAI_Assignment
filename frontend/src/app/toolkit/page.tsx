"use client";

import { useState, useRef } from "react";
import AppShell from "@/components/AppShell";
import { useProfileStore } from "@/store/profileStore";
import {
  Upload,
  X,
  FileText,
  Loader2,
  CheckCircle2,
  Download,
  Sparkles,
  Key,
  BookOpen,
  Lightbulb,
  AlertCircle,
} from "lucide-react";

interface AnswerKeyItem {
  questionNumber: string;
  questionText: string;
  answer: string;
  explanation: string;
  marks: number;
}
interface AnswerKey {
  title: string;
  subject: string;
  totalMarks: number;
  answers: AnswerKeyItem[];
  generatedAt: string;
}
type Status = "idle" | "reading" | "generating" | "done" | "error";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ToolkitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [answerKey, setAnswerKey] = useState<AnswerKey | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addNotification = useProfileStore((s) => s.addNotification);

  const handleFileSelect = (f: File | null) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }
    setFile(f);
    setStatus("idle");
    setAnswerKey(null);
    setError("");
  };

  const reset = () => {
    setFile(null);
    setAnswerKey(null);
    setStatus("idle");
    setError("");
    setStatusMsg("");
  };

  const handleGenerate = async () => {
    if (!file) return;
    setError("");
    setStatusMsg("");

    // ── Step 1: Try PDF.js text extraction ──
    setStatus("reading");
    setStatusMsg("Extracting text from PDF...");
    let extractedText = "";

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url
      ).toString();
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      let txt = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        txt += content.items.map((x: any) => x.str).join(" ") + "\n";
      }
      extractedText = txt.trim();
      console.log("PDF.js text length:", extractedText.length);
    } catch (e) {
      console.warn("PDF.js failed:", e);
    }

    // ── Step 2: If no text, try canvas OCR ──
    if (extractedText.length < 30) {
      setStatusMsg("PDF has no text layer — running OCR...");
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url
        ).toString();
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

        const Tesseract = await import("tesseract.js");
        let ocrText = "";

        for (let i = 1; i <= Math.min(pdf.numPages, 4); i++) {
          setStatusMsg(
            `OCR scanning page ${i} of ${Math.min(pdf.numPages, 4)}...`
          );
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.5 });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;

          await page.render({ canvasContext: ctx, viewport }).promise;

          const dataUrl = canvas.toDataURL("image/png");
          const result = await Tesseract.recognize(dataUrl, "eng", {
            logger: () => {},
          });
          ocrText += result.data.text + "\n";
          console.log(`Page ${i} OCR length:`, result.data.text.length);
        }

        extractedText = ocrText.trim();
        console.log("Total OCR text length:", extractedText.length);
      } catch (ocrErr) {
        console.error("OCR failed:", ocrErr);
      }
    }

    // ── Step 3: Send to backend ──
    setStatus("generating");
    setStatusMsg("Generating answer key with AI...");

    try {
      let res: globalThis.Response;

      if (extractedText.length > 30) {
        // Send extracted/OCR text as JSON
        res = await fetch(`${API_URL}/api/toolkit/answer-key-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: extractedText, filename: file.name }),
        });
      } else {
        // Last resort: send raw PDF
        const fd = new FormData();
        fd.append("file", file, file.name);
        res = await fetch(`${API_URL}/api/toolkit/answer-key`, {
          method: "POST",
          body: fd,
        });
      }

      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || `Error ${res.status}`);

      setAnswerKey(json.data);
      setStatus("done");
      setStatusMsg("");
      addNotification({
        type: "answer_key_created",
        title: "Answer Key Generated!",
        message: `Ready: ${json.data.answers?.length || 0} answers for "${
          file.name
        }"`,
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to generate answer key"
      );
      setStatus("error");
      setStatusMsg("");
    }
  };

  const handleDownload = () => {
    if (!answerKey) return;
    const lines = [
      `ANSWER KEY — ${answerKey.title}`,
      `Subject: ${answerKey.subject} | Total: ${answerKey.totalMarks} Marks`,
      "",
      "─".repeat(60),
      "",
      ...(answerKey.answers || []).map(
        (a, i) =>
          `Q${a.questionNumber || i + 1}. ${a.questionText}\n   Answer: ${
            a.answer
          }\n${a.explanation ? `   Explanation: ${a.explanation}\n` : ""}   [${
            a.marks
          } Marks]\n`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AnswerKey_${(answerKey.title || "paper").replace(
      /\s+/g,
      "_"
    )}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="AI Teacher's Toolkit">
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h1 className="text-lg font-bold text-gray-900">
            AI Teacher's Toolkit
          </h1>
        </div>
        <p className="text-sm text-gray-500 mb-6 pl-4">
          Powerful AI tools to help you teach smarter.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {[
            {
              icon: Key,
              title: "Answer Key Generator",
              desc: "Upload a question paper PDF and get instant answers",
              active: true,
            },
            {
              icon: BookOpen,
              title: "Rubric Builder",
              desc: "Create marking rubrics for any assignment",
              active: false,
            },
            {
              icon: Lightbulb,
              title: "Quiz Maker",
              desc: "Convert notes into quizzes automatically",
              active: false,
            },
          ].map(({ icon: Icon, title, desc, active }) => (
            <div
              key={title}
              className={`rounded-xl border p-4 ${
                active
                  ? "border-gray-900 bg-gray-900"
                  : "border-gray-200 bg-white opacity-60"
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-2 ${
                  active ? "text-amber-400" : "text-gray-300"
                }`}
              />
              <p
                className={`text-sm font-semibold ${
                  active ? "text-white" : "text-gray-500"
                }`}
              >
                {title}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  active ? "text-gray-300" : "text-gray-400"
                }`}
              >
                {desc}
              </p>
              {!active && (
                <span className="inline-block mt-2 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              )}
            </div>
          ))}
        </div>

        <div
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-gray-900">
              Answer Key Generator
            </h2>
            <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>

          <div className="p-6 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                handleFileSelect(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
              className="hidden"
            />

            {!file ? (
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileSelect(e.dataTransfer.files?.[0] ?? null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                  isDragging
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 mx-auto mb-3 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {isDragging ? "Drop it here!" : "Upload Question Paper PDF"}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Drag & drop or click browse · PDF only · Max 20MB
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-lg transition-colors"
                >
                  Browse Files
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB · PDF ready
                  </p>
                </div>
                {(status === "idle" || status === "error") && (
                  <button
                    onClick={reset}
                    className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Processing status */}
            {(status === "reading" || status === "generating") && statusMsg && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                <p className="text-sm text-blue-700">{statusMsg}</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Error</p>
                  <p className="text-xs text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {file && status !== "done" && (
              <button
                onClick={handleGenerate}
                disabled={status === "reading" || status === "generating"}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-xl transition-all"
              >
                {status === "reading" || status === "generating" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {statusMsg || "Processing..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Answer Key
                  </>
                )}
              </button>
            )}

            {status === "done" && answerKey && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Answer Key Ready!
                      </p>
                      <p className="text-xs text-gray-500">
                        {answerKey.answers?.length || 0} questions ·{" "}
                        {answerKey.totalMarks} marks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={reset}
                      className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      New
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 text-xs bg-gray-900 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-wrap gap-3 text-sm">
                  <span className="font-semibold text-gray-900">
                    {answerKey.title}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-600">{answerKey.subject}</span>
                  <span className="text-gray-300">·</span>
                  <span className="font-semibold text-gray-900">
                    {answerKey.totalMarks} Marks
                  </span>
                </div>

                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {(answerKey.answers || []).map((item, i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold">
                          {item.questionNumber || i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm text-gray-700 leading-relaxed flex-1">
                              {item.questionText}
                            </p>
                            <span className="flex-shrink-0 text-[10px] font-bold border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 whitespace-nowrap">
                              [{item.marks} {item.marks === 1 ? "Mk" : "Mks"}]
                            </span>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-1.5">
                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-0.5">
                              Answer
                            </p>
                            <p className="text-sm text-gray-900">
                              {item.answer}
                            </p>
                          </div>
                          {item.explanation && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-0.5">
                                Explanation
                              </p>
                              <p className="text-xs text-gray-700 leading-relaxed">
                                {item.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
