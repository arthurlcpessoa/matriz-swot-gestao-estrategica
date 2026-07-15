import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Info } from "lucide-react";
import { motion } from "motion/react";
import { SwotItem } from "../types";
import { parseSwotSpreadsheet } from "../utils/exporter";

interface SwotUploadProps {
  onSwotLoaded: (items: SwotItem[], templateName?: string) => void;
  currentTemplateName?: string;
  swotCount: number;
  isEditingLocked?: boolean;
}

export default function SwotUpload({ 
  onSwotLoaded, 
  currentTemplateName, 
  swotCount,
  isEditingLocked = false
}: SwotUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag over handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isEditingLocked) return;
    setIsDragging(true);
  };

  // Drag leave handler
  const handleDragLeave = () => {
    if (isEditingLocked) return;
    setIsDragging(false);
  };

  // Handle dropped file
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (isEditingLocked) return;
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  // Handle selected file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEditingLocked) return;
    setError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  // Process the uploaded file
  const processFile = async (file: File) => {
    if (isEditingLocked) return;
    setLoading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'csv' && ext !== 'xls') {
        throw new Error("Formato inválido! Por favor envie um arquivo Excel (.xlsx, .xls) ou CSV.");
      }

      const items = await parseSwotSpreadsheet(file);
      onSwotLoaded(items, `Planilha Importada: ${file.name}`);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao processar o arquivo.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger file selection dialog
  const triggerFileSelect = () => {
    if (isEditingLocked) return;
    fileInputRef.current?.click();
  };

  return (
    <div id="swot-upload-section" className="space-y-6">
      {/* Upload Box */}
      <div
        id="drag-drop-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 min-h-[220px] flex flex-col justify-center items-center ${
          isEditingLocked
            ? "border-slate-200 bg-slate-100/50 cursor-not-allowed opacity-75"
            : isDragging
              ? "border-indigo-500 bg-indigo-50/40 cursor-pointer"
              : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
        }`}
      >
        <input
          id="file-input-element"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls, .csv"
          className="hidden"
          disabled={isEditingLocked}
        />

        <div className={`p-4 bg-white shadow-sm rounded-full mb-4 border border-slate-100/70 ${
          isEditingLocked ? "text-slate-400" : "text-indigo-600"
        }`}>
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-semibold text-slate-800">
          {isEditingLocked ? "🔒 Importação de Planilha Desabilitada" : "Importe sua Planilha SWOT"}
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          {isEditingLocked
            ? "O modo de segurança está ativo. Habilite a edição no banner superior para enviar arquivos."
            : <>Arraste e solte seu arquivo <strong className="text-indigo-600">Excel (.xlsx)</strong> ou <strong className="text-indigo-600">CSV</strong> aqui, ou clique para navegar.</>}
        </p>

        <div className="flex items-center gap-6 mt-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Excel (.xlsx)
          </span>
          <span className="flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" /> CSV delimitado por ponto e vírgula
          </span>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/80 rounded-2xl flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mb-2"></div>
            <p className="text-sm font-medium text-slate-700">Processando e validando planilha...</p>
          </div>
        )}
      </div>

      {error && (
        <motion.div
          id="upload-error-box"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex gap-2 items-start"
        >
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Erro de Importação:</span> {error}
            <div className="text-xs text-rose-600 mt-2">
              A estrutura recomendada é ter pelo menos as colunas <strong>Categoria</strong> (valores: Força, Fraqueza, Oportunidade, Ameaça) e <strong>Descrição</strong>.
            </div>
          </div>
        </motion.div>
      )}    </div>
  );
}
