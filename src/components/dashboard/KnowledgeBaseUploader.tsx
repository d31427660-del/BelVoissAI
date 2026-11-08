import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon as FileText,
  UploadIcon,
  TrashBinTrashIcon as Trash2,
  CheckCircleIcon as CheckCircle2,
  EyeIcon,
  EyeClosedIcon,
  RefreshIcon as RefreshCw
} from '@solar-icons/react/bold-duotone';
import { KnowledgeDocument } from '../../types';
import { parseDocumentFile } from '../../lib/documentParser';

interface KnowledgeBaseUploaderProps {
  documents: KnowledgeDocument[];
  onChange: (docs: KnowledgeDocument[]) => void;
  className?: string;
}

export const KnowledgeBaseUploader: React.FC<KnowledgeBaseUploaderProps> = ({
  documents = [],
  onChange,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setIsProcessing(true);
    setFeedbackNotice(`Индексируем ${fileList.length} ${fileList.length === 1 ? 'документ' : 'документов'}...`);

    try {
      const parsedDocs: KnowledgeDocument[] = [];
      for (const file of fileList) {
        const doc = await parseDocumentFile(file);
        parsedDocs.push(doc);
      }

      const updated = [...documents, ...parsedDocs];
      onChange(updated);
      setFeedbackNotice(`Успешно добавлено ${parsedDocs.length} ${parsedDocs.length === 1 ? 'документ' : 'документов'} в базу знаний!`);
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch (err) {
      console.error('[KnowledgeBaseUploader] Upload error:', err);
      setFeedbackNotice('Ошибка при чтении файлов. Проверьте формат документа.');
      setTimeout(() => setFeedbackNotice(null), 4000);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = (id: string, name: string) => {
    const next = documents.filter((d) => d.id !== id);
    onChange(next);
    setFeedbackNotice(`Документ «${name}» удалён из базы знаний.`);
    setTimeout(() => setFeedbackNotice(null), 2500);
  };

  const handleCopyText = (id: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const formatFileSize = (doc: KnowledgeDocument): string => {
    if (doc.size) return doc.size;
    if (doc.sizeKb) {
      return doc.sizeKb >= 1024
        ? `${(doc.sizeKb / 1024).toFixed(1)} МБ`
        : `${doc.sizeKb} КБ`;
    }
    return '120 КБ';
  };

  const getDocTypeBadge = (type: KnowledgeDocument['type']) => {
    const t = String(type).toLowerCase();
    if (t.includes('pdf')) {
      return { label: 'PDF', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' };
    }
    if (t.includes('doc')) {
      return { label: 'DOCX', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' };
    }
    if (t.includes('csv')) {
      return { label: 'CSV', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
    }
    return { label: 'TXT', bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.txt,.csv"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
        }}
      />

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 scale-[1.005]'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-slate-50'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isDragging ? 'bg-blue-600 text-white scale-110' : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}
          >
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <UploadIcon className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900">
              {isDragging ? 'Отпустите файлы для загрузки' : 'Перетащите PDF, DOCX или TXT файлы сюда'}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Загружайте прайс-листы, регламенты услуг, условия рассрочки и инструкции. Бот автоматически извлечет факты для ответов клиентам.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
              PDF
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
              Word (.docx)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs">
              Текстовые (.txt)
            </span>
            <span className="text-[11px] text-slate-400">до 15 МБ</span>
          </div>

          <span className="mt-1 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors">
            Выбрать файл с компьютера
          </span>
        </div>
      </div>

      {/* Status Notice */}
      <AnimatePresence>
        {feedbackNotice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium flex items-center justify-between"
          >
            <span>{feedbackNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List of Uploaded Documents */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Загруженные документы ({documents.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Индексируются семантически для ответов за 0.55 сек
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 text-center text-xs text-slate-500">
            Пока нет загруженных файлов. Добавьте первый документ выше, чтобы расширить знания голосового ассистента.
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const badge = getDocTypeBadge(doc.type);
              const isExpanded = expandedDocId === doc.id;
              const contentText = doc.extractedText || doc.parsedText || '';

              return (
                <div
                  key={doc.id}
                  className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all overflow-hidden"
                >
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-700">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 truncate max-w-sm" title={doc.name}>
                            {doc.name}
                          </h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatFileSize(doc)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          <span>Загружен: {doc.uploadedAt || 'Недавно'}</span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Готов ({doc.chunkCount || doc.chunks?.length || 1} фрагм.)</span>
                          </span>
                          {doc.summary && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600 italic truncate max-w-xs">{doc.summary}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                        title={isExpanded ? 'Скрыть текст' : 'Посмотреть извлечённый текст'}
                      >
                        {isExpanded ? <EyeClosedIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                        <span>{isExpanded ? 'Скрыть' : 'Текст'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id, doc.name)}
                        aria-label={`Удалить документ ${doc.name}`}
                        className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center transition-colors"
                        title="Удалить из базы знаний"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Extracted Text Preview */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-100 bg-slate-50/70 p-4 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold">Извлеченный текст для ИИ-ассистента:</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(doc.id, contentText)}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            {copiedId === doc.id ? '✓ Скопировано' : 'Скопировать текст'}
                          </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto voxi-scroll p-3 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {contentText || 'Текст документа пуст или ещё индексируется.'}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
