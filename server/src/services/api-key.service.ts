import crypto from "node:crypto";
import {
  getDb,
  apiKeys,
  eq,
  and,
  isNull,
  desc,
  count
} from "../db/index.js";
import type {
  IApiKeyService,
  CreatedApiKeyResult,
  ApiKeyItem,
  VerifiedApiKey
} from "../core/ports/IApiKeyService.js";
import type { CreateApiKeyInput, ApiKeyScope } from "../core/ports/api-key-scopes.js";
import {
  generateRawApiKey,
  extractKeyPrefix,
  hashApiKey
} from "../core/domain/api-key-generator.js";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";

const MAX_ACTIVE_KEYS = 10;
const DEFAULT_EXPIRATION_DAYS = 90;
const TOUCH_THROTTLE_MS = 5 * 60 * 1000;

export class ApiKeyService implements IApiKeyService {
  async create(userId: string, input: CreateApiKeyInput): Promise<CreatedApiKeyResult> {
    const db = getDb();

    const [activeCountRow] = await db
      .select({ val: count() })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)));

    if ((activeCountRow?.val ?? 0) >= MAX_ACTIVE_KEYS) {
      throw new BadRequestError(`Maximum active API keys limit reached (${MAX_ACTIVE_KEYS})`);
    }

    const rawKey = generateRawApiKey();
    const keyHash = await hashApiKey(rawKey);
    const keyPrefix = extractKeyPrefix(rawKey);

    const expirationDays = input.expiresInDays ?? DEFAULT_EXPIRATION_DAYS;
    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();
    const id = `apk_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const scopesJson = JSON.stringify(input.scopes);

    await db.insert(apiKeys).values({
      id,
      userId,
      name: input.name,
      keyPrefix,
      keyHash,
      scopes: scopesJson,
      expiresAt,
      lastUsedAt: null,
      revokedAt: null,
      createdAt
    });

    return {
      id,
      name: input.name,
      key: rawKey,
      keyPrefix,
      scopes: input.scopes,
      expiresAt,
      createdAt
    };
  }

  async list(userId: string): Promise<ApiKeyItem[]> {
    const db = getDb();
    const rows = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        expiresAt: apiKeys.expiresAt,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
        createdAt: apiKeys.createdAt
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));

    return rows.map((row) => ({
      ...row,
      scopes: JSON.parse(row.scopes) as ApiKeyScope[]
    }));
  }

  async revoke(userId: string, keyId: string): Promise<boolean> {
    const db = getDb();

    const [existing] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundError(`API key '${keyId}' not found`);
    }

    const now = new Date().toISOString();
    await db
      .update(apiKeys)
      .set({ revokedAt: now })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));

    return true;
  }

  async verify(rawKey: string): Promise<VerifiedApiKey | null> {
    if (!rawKey || !rawKey.startsWith("bky_live_")) {
      return null;
    }

    const keyHash = await hashApiKey(rawKey);
    const db = getDb();

    const [record] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (!record) {
      return null;
    }

    if (record.revokedAt) {
      return null;
    }

    if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
      return null;
    }

    const shouldTouch =
      !record.lastUsedAt ||
      Date.now() - new Date(record.lastUsedAt).getTime() > TOUCH_THROTTLE_MS;

    if (shouldTouch) {
      await db
        .update(apiKeys)
        .set({ lastUsedAt: new Date().toISOString() })
        .where(eq(apiKeys.id, record.id));
    }

    let parsedScopes: ApiKeyScope[] = [];
    try {
      parsedScopes = JSON.parse(record.scopes) as ApiKeyScope[];
    } catch {
      return null;
    }

    return {
      keyId: record.id,
      userId: record.userId,
      name: record.name,
      scopes: parsedScopes
    };
  }
}

export const apiKeyService = new ApiKeyService();
