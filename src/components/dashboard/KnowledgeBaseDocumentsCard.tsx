import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon as FileText,
  TrashBinMinimalisticIcon as Trash2,
  EyeIcon,
  CloseCircleIcon as CloseIcon,
  CheckCircleIcon as CheckCircle2,
  RefreshIcon as SpinnerIcon,
  Widget5Icon as GridIcon,
} from '@solar-icons/react/bold-duotone';
import { KnowledgeDocument } from '../../types';
import { parseDocumentFile } from '../../lib/documentParser';
import { FieldLabel, FieldHint } from './FieldHelp';

interface KnowledgeBaseDocumentsCardProps {
  documents: KnowledgeDocument[];
  onChange: (docs: KnowledgeDocument[]) => void;
}

export const KnowledgeBaseDocumentsCard: React.FC<KnowledgeBaseDocumentsCardProps> = ({
  documents = [],
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingFileName, setParsingFileName] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<KnowledgeDocument | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      await processFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = async (files: File[]) => {
    setErrorMessage(null);
    const validExtensions = ['pdf', 'docx', 'doc', 'txt', 'md', 'csv'];

    const newDocs: KnowledgeDocument[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!validExtensions.includes(ext)) {
        setErrorMessage(`Файл «${file.name}» имеет неподдерживаемый формат. Поддерживаются PDF, Word (DOCX), TXT, MD, CSV.`);
        continue;
      }

      setIsParsing(true);
      setParsingFileName(file.name);
      try {
        const parsed = await parseDocumentFile(file);
        newDocs.push(parsed);
      } catch (err: any) {
        console.error('File parsing error:', err);
        setErrorMessage(`Не удалось прочитать файл «${file.name}». Попробуйте сохранить в PDF или TXT.`);
      }
    }

    setIsParsing(false);
    setParsingFileName(null);

    if (newDocs.length > 0) {
      const merged = [...documents, ...newDocs];
      onChange(merged);
    }
  };

  const handleDelete = (id: string) => {
    const next = documents.filter((d) => d.id !== id);
    onChange(next);
    if (previewDoc?.id === id) {
      setPreviewDoc(null);
    }
  };

  const getFormatBadge = (type: KnowledgeDocument['type']) => {
    switch (type) {
      case 'pdf':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">PDF</span>;
      case 'docx':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">WORD</span>;
      case 'txt':
      case 'csv':
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{(type || 'txt').toUpperCase()}</span>;
    }
  };

  return (
    <section aria-labelledby="section-kb-heading" className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
      <div className="pb-2.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 id="section-kb-heading" className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>5. База знаний из файлов (Прайс-листы PDF, Word, FAQ)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Загрузите PDF или Word — бот автоматически изучит документ и будет отвечать по нему клиентам.
          </p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto shrink-0">
          Приоритет 2 • Индексация 0.3 сек
        </span>
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-600 bg-blue-50/70 scale-[0.99]'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.md,.csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center">
            {isParsing ? (
              <SpinnerIcon className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="text-xs font-bold text-slate-800">
              {isParsing ? (
                <span>Анализируем и разбиваем на смысловые фрагменты: {parsingFileName}...</span>
              ) : (
                <span>Перетащите PDF, Word или FAQ сюда, либо нажмите для выбора</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Поддерживаются форматы: .pdf, .docx, .doc, .txt, .csv (до 15 МБ)
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 ? (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Загруженные документы ({documents.length}):</span>
            <span className="text-emerald-600 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Подключено к ответам бота
            </span>
          </div>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/30 overflow-hidden">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-2">
                      <span className="truncate">{doc.name}</span>
                      {getFormatBadge(doc.type)}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.chunks?.length || 1} фрагментов текста</span>
                      <span>•</span>
                      <span>{doc.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Просмотреть распознанный текст"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Удалить документ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
          Документы еще не загружены. Вы можете прикрепить файл с перечнем цен, регламентом или правилами гарантии вашей компании.
        </div>
      )}

      {/* Preview Modal for extracted text */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-h-[85vh] flex flex-col"
            >
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{previewDoc.name}</h4>
                    <span className="text-[11px] text-slate-500">{previewDoc.size} • {previewDoc.chunks?.length || 1} фрагментов</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 text-xs leading-relaxed text-slate-800">
                <div className="font-semibold text-slate-900">Распознанный текст для ассистента:</div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {previewDoc.parsedText}
                </div>

                {previewDoc.chunks && previewDoc.chunks.length > 0 && (
                  <div>
                    <div className="font-semibold text-slate-900 mb-1.5">Семантические фрагменты ({previewDoc.chunks.length}):</div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {previewDoc.chunks.map((chunk, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-slate-700">
                          <span className="font-bold text-blue-700 mr-1.5">#{idx + 1}</span>
                          {chunk}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Закрыть просмотр
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
