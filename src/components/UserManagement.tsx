import React, { useEffect, useState } from "react";
import { X, UserPlus, ShieldCheck, Eye, Ban, CheckCircle2 } from "lucide-react";
import { Profile } from "../types";
import { listProfiles, createUserAsAdmin, updateProfileRole, updateProfileActive } from "../lib/supabase";

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export default function UserManagement({ isOpen, onClose, currentUserId }: UserManagementProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "viewer">("viewer");
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const refreshProfiles = async () => {
    setIsLoadingList(true);
    const data = await listProfiles();
    setProfiles(data);
    setIsLoadingList(false);
  };

  useEffect(() => {
    if (isOpen) {
      refreshProfiles();
      setActionError(null);
      setCreateSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setCreateSuccess(null);

    if (newPassword.length < 6) {
      setActionError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsCreating(true);
    const result = await createUserAsAdmin(newEmail.trim(), newPassword, newRole);
    setIsCreating(false);

    if (!result.success) {
      setActionError(result.error || "Não foi possível criar o usuário.");
      return;
    }

    setCreateSuccess(`Usuário "${newEmail.trim()}" criado como ${newRole === "admin" ? "administrador" : "visualizador"}.`);
    setNewEmail("");
    setNewPassword("");
    setNewRole("viewer");
    await refreshProfiles();
  };

  const handleToggleRole = async (profile: Profile) => {
    setActionError(null);
    const nextRole = profile.role === "admin" ? "viewer" : "admin";
    const result = await updateProfileRole(profile.id, nextRole);
    if (!result.success) {
      setActionError(result.error || "Não foi possível atualizar o papel.");
      return;
    }
    await refreshProfiles();
  };

  const handleToggleActive = async (profile: Profile) => {
    setActionError(null);
    const result = await updateProfileActive(profile.id, !profile.active);
    if (!result.success) {
      setActionError(result.error || "Não foi possível atualizar o status.");
      return;
    }
    await refreshProfiles();
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-100 p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-slate-900">Gerenciar Usuários</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Crie novos acessos e defina quem é administrador ou visualizador. Só administradores ativos veem esta tela.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário de criação */}
        <form onSubmit={handleCreate} className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
          <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            Criar Novo Acesso
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@aclf.com.br"
              required
              className="text-xs p-2.5 border border-slate-200 rounded-lg bg-white outline-hidden focus:border-indigo-400"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Senha (mínimo 6 caracteres)"
              required
              minLength={6}
              className="text-xs p-2.5 border border-slate-200 rounded-lg bg-white outline-hidden focus:border-indigo-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="radio"
                checked={newRole === "viewer"}
                onChange={() => setNewRole("viewer")}
              />
              Visualizador
            </label>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="radio"
                checked={newRole === "admin"}
                onChange={() => setNewRole("admin")}
              />
              Administrador
            </label>

            <button
              type="submit"
              disabled={isCreating}
              className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              {isCreating ? "Criando..." : "Criar Usuário"}
            </button>
          </div>

          {createSuccess && (
            <p className="text-[11px] font-bold text-emerald-600">{createSuccess}</p>
          )}
        </form>

        {actionError && (
          <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2.5">
            {actionError}
          </p>
        )}

        {/* Lista de usuários */}
        <div className="space-y-1.5">
          <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
            Usuários Cadastrados {isLoadingList ? "(carregando...)" : `(${profiles.length})`}
          </h5>

          <div className="divide-y divide-slate-100 border border-slate-150 rounded-xl overflow-hidden">
            {profiles.length === 0 && !isLoadingList && (
              <div className="p-4 text-xs text-slate-400 italic text-center">Nenhum usuário encontrado.</div>
            )}
            {profiles.map((profile) => {
              const isSelf = profile.id === currentUserId;
              return (
                <div key={profile.id} className="flex items-center justify-between gap-3 p-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">
                      {profile.email || "(sem e-mail)"}
                      {isSelf && <span className="ml-1.5 text-[10px] font-bold text-indigo-500">(você)</span>}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {profile.role === "admin" ? "Administrador" : "Visualizador"} · {profile.active ? "Ativo" : "Desativado"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleRole(profile)}
                      title={profile.role === "admin" ? "Rebaixar para visualizador" : "Promover a administrador"}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer transition-all"
                    >
                      {profile.role === "admin" ? <Eye className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(profile)}
                      disabled={isSelf}
                      title={isSelf ? "Você não pode desativar seu próprio acesso" : profile.active ? "Desativar acesso" : "Reativar acesso"}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      {profile.active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[10.5px] text-slate-400 leading-relaxed">
          Dica: para desativar o acesso master temporário, promova outro administrador normal primeiro, saia dessa conta e desative-a por aqui (ou entre com outro admin e desative-a).
        </p>
      </div>
    </div>
  );
}
