import React from "react";
import { Link } from "react-router-dom";
import {
  Key,
  Plus,
  RefreshCw,
  Shield,
  Layers,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { ApiKeyList } from "@/components/api-keys/ApiKeyList";
import { CreateApiKeyModal } from "@/components/api-keys/CreateApiKeyModal";
import { ApiKeySecretModal } from "@/components/api-keys/ApiKeySecretModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ActionToast } from "@/components/ui/ActionToast";

export const ApiKeysPage: React.FC = () => {
  const {
    keys,
    activeKeysCount,
    maxKeys,
    loading,
    error,
    toastMessage,
    isCreateModalOpen,
    isSubmitting,
    revokingId,
    confirmRevokeId,
    createdResult,
    openCreateModal,
    closeCreateModal,
    handleCreateKey,
    openRevokeConfirm,
    closeRevokeConfirm,
    handleConfirmRevoke,
    dismissCreatedResult,
    refreshData,
    dismissToast
  } = useApiKeys();

  return (
    <div className="space-y-5 max-w-5xl mx-auto animate-in fade-in duration-150">
      <ActionToast
        isOpen={!!toastMessage}
        message={toastMessage || ""}
        onDismiss={dismissToast}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted font-mono">
            <Link to="/" className="hover:text-text transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-accent">API Keys</span>
          </div>
          <h1 className="text-xl font-bold text-text tracking-tight flex items-center gap-2">
            <Key className="w-5 h-5 text-accent" />
            <span>Acceso Programático & API Keys</span>
          </h1>
          <p className="text-xs text-muted max-w-xl">
            Gestiona tokens de autenticación para consultar saldos, movimientos y automatizaciones con permisos granulares.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={refreshData}
            disabled={loading}
            className="p-2 rounded-xl bg-surface border border-border hover:border-accent/40 text-muted hover:text-text transition-colors cursor-pointer disabled:opacity-50"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-accent" : ""}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            disabled={activeKeysCount >= maxKeys}
            className="px-3.5 py-2 rounded-xl bg-accent text-bg font-semibold text-xs hover:bg-accent/90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md hover:shadow-accent/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva API Key</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-negative/10 border border-negative/20 text-negative text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-muted font-mono uppercase tracking-wider">Keys Activas</p>
            <p className="text-2xl font-bold font-mono text-text">{activeKeysCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Key className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-muted font-mono uppercase tracking-wider">Capacidad Límite</p>
            <p className="text-2xl font-bold font-mono text-text">
              {activeKeysCount} / {maxKeys}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-muted font-mono uppercase tracking-wider">Seguridad</p>
            <p className="text-sm font-semibold text-text">SHA-256 Hashing</p>
            <p className="text-[11px] text-muted font-mono">Scoped & Isolated</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-text font-mono uppercase tracking-wider">
            Tus Claves ({keys.length})
          </h2>
        </div>

        <ApiKeyList
          keys={keys}
          revokingId={revokingId}
          onRevoke={openRevokeConfirm}
          onOpenCreate={openCreateModal}
        />
      </div>

      <CreateApiKeyModal
        isOpen={isCreateModalOpen}
        isSubmitting={isSubmitting}
        onClose={closeCreateModal}
        onSubmit={handleCreateKey}
      />

      <ApiKeySecretModal
        result={createdResult}
        onClose={dismissCreatedResult}
      />

      <ConfirmModal
        isOpen={!!confirmRevokeId}
        title="¿Revocar API Key?"
        description="Esta clave dejará de funcionar inmediatamente. Cualquier script o servicio que la esté utilizando recibirá un error de autenticación 401."
        confirmLabel="Sí, revocar clave"
        cancelLabel="Cancelar"
        isDestructive={true}
        isLoading={!!revokingId}
        onConfirm={handleConfirmRevoke}
        onCancel={closeRevokeConfirm}
      />
    </div>
  );
};
