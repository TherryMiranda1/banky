import { useState, useEffect, useCallback } from "react";
import {
  ApiKeyItem,
  CreateApiKeyPayload,
  CreateApiKeyResult,
  getApiKeys,
  createApiKey,
  revokeApiKey
} from "@/lib/api/api-keys";

const MAX_KEYS = 10;

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<CreateApiKeyResult | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getApiKeys();
      setKeys(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error cargando API keys";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleCreateKey = useCallback(async (payload: CreateApiKeyPayload): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setError(null);
      const result = await createApiKey(payload);
      setKeys((prev) => [
        {
          id: result.id,
          name: result.name,
          keyPrefix: result.keyPrefix,
          scopes: result.scopes,
          expiresAt: result.expiresAt,
          lastUsedAt: null,
          revokedAt: null,
          createdAt: result.createdAt
        },
        ...prev
      ]);
      setCreatedResult(result);
      setIsCreateModalOpen(false);
      setToastMessage("API Key creada exitosamente");
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creando API key";
      setError(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const openRevokeConfirm = useCallback((id: string) => {
    setConfirmRevokeId(id);
  }, []);

  const closeRevokeConfirm = useCallback(() => {
    setConfirmRevokeId(null);
  }, []);

  const handleConfirmRevoke = useCallback(async () => {
    if (!confirmRevokeId) return;
    const targetId = confirmRevokeId;
    try {
      setRevokingId(targetId);
      await revokeApiKey(targetId);
      const now = new Date().toISOString();
      setKeys((prev) =>
        prev.map((k) => (k.id === targetId ? { ...k, revokedAt: now } : k))
      );
      setToastMessage("API Key revocada exitosamente");
      setConfirmRevokeId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error revocando API key";
      setError(msg);
    } finally {
      setRevokingId(null);
    }
  }, [confirmRevokeId]);

  const dismissCreatedResult = useCallback(() => {
    setCreatedResult(null);
  }, []);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const activeKeysCount = keys.filter((k) => !k.revokedAt).length;

  return {
    keys,
    activeKeysCount,
    maxKeys: MAX_KEYS,
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
    refreshData: loadData,
    dismissToast
  };
}
