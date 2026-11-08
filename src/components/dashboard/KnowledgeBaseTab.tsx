import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon as FileText,
  DisketteIcon as Save,
  CheckCircleIcon as CheckCircle2,
  MagicWand3Icon as Sparkles,
  QuestionCircleIcon as HelpCircle
} from '@solar-icons/react/bold-duotone';
import { AgentConfig, KnowledgeDocument } from '../../types';
import { KnowledgeBaseUploader } from './KnowledgeBaseUploader';
import { queryKnowledgeDocuments } from '../../lib/documentParser';

interface KnowledgeBaseTabProps {
  agent: AgentConfig;
  onSaveAgent: (agent: AgentConfig) => void;
}

export const KnowledgeBaseTab: React.FC<KnowledgeBaseTabProps> = ({
  agent,
  onSaveAgent
}) => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(
    agent.knowledgeDocuments || []
  );
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<{ answer: string; sourceDocument: string } | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleDocumentsChange = (newDocs: KnowledgeDocument[]) => {
    setDocuments(newDocs);
    const updated = {
      ...agent,
      knowledgeDocuments: newDocs,
      updatedAt: new Date().toISOString()
    };
    onSaveAgent(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...agent,
      knowledgeDocuments: documents,
      updatedAt: new Date().toISOString()
    };
    onSaveAgent(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleTestSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!testQuery.trim()) return;
    const res = queryKnowledgeDocuments(testQuery, documents);
    setTestResult(res);
  };

  const totalChunks = documents.reduce(
    (acc, d) => acc + (d.chunkCount || d.chunks?.length || 1),
    0
  );

  return (
    <form id="active-workspace-form" onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              База знаний и регламенты
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Загружайте PDF-прайсы, Word-регламенты и инструкции. Бот за 0.55 секунды находит точные ответы на вопросы клиентов.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>Сохранить базу</span>
        </button>
      </div>

      {/* Save Notification */}
      <AnimatePresence>
        {savedNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>База знаний успешно сохранена и синхронизирована с ИИ-ассистентом!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Документов в базе</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{documents.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX, TXT</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Семантических фрагментов</div>
          <div className="text-xl font-bold text-blue-600 mt-0.5">{totalChunks}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Индексируются в памяти браузера</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Скорость выборки ответа</div>
          <div className="text-xl font-bold text-emerald-600 mt-0.5">~0.04 сек</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Прямой доступ к фактам без задержек</div>
        </div>
      </div>

      {/* Main Drag & Drop Uploader */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Загрузка документов в базу знаний
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Поддерживаются файлы PDF (прайс-листы), DOCX (регламенты) и TXT (FAQ).
            </p>
          </div>
        </div>

        <KnowledgeBaseUploader
          documents={documents}
          onChange={handleDocumentsChange}
        />
      </section>

      {/* Interactive Semantic Search Tester */}
      <section className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Проверка знаний ассистента по загруженным файлам
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Задайте тестовый вопрос клиента, чтобы убедиться, что нужный фрагмент извлекается из документов:
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTestSearch();
              }
            }}
            placeholder="Например: Какая стоимость категории B и есть ли рассрочка?"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => handleTestSearch()}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Найти в документах</span>
          </button>
        </div>

        {testResult && (
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-indigo-900 font-semibold">
              <span>Найден подходящий фрагмент:</span>
              <span className="text-[11px] font-mono text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                {testResult.sourceDocument}
              </span>
            </div>
            <p className="text-slate-800 leading-relaxed font-sans bg-white p-3 rounded-lg border border-indigo-100">
              «{testResult.answer}»
            </p>
          </div>
        )}
      </section>
    </form>
  );
};
