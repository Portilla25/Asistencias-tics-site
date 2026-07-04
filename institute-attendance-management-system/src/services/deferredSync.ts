export type DeferredSyncTaskType =
  | 'legacyModule'
  | 'session'
  | 'sessionsBatch'
  | 'notes'
  | 'personalizados';

export type DeferredSyncTask = {
  id: string;
  type: DeferredSyncTaskType;
  payload: any;
  queuedAtMs: number;
  updatedAtMs: number;
  attempts: number;
  lastError?: string;
};

export type DeferredSyncSettings = {
  enabled: boolean;
  time: string;
  nextRunAtMs?: number;
  lastRunAtMs?: number;
  lastRunDate?: string;
  lastError?: string;
};

export type DeferredSyncStatus = DeferredSyncSettings & {
  pendingCount: number;
  pendingTypes: Record<string, number>;
};

type SyncRunner = (tasks: DeferredSyncTask[]) => Promise<void>;

const QUEUE_KEY = 'asist_deferred_sync_queue_v1';
const SETTINGS_KEY = 'asist_deferred_sync_settings_v1';
const DEFAULT_SYNC_TIME = '23:00';
const CHECK_INTERVAL_MS = 60 * 1000;

let syncRunner: SyncRunner | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let checkInterval: ReturnType<typeof setInterval> | null = null;
let isFlushing = false;
let memoryQueue: DeferredSyncTask[] = [];
let memorySettings: DeferredSyncSettings | null = null;

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const readQueue = (): DeferredSyncTask[] => {
  if (typeof window === 'undefined') return memoryQueue;
  const stored = safeParse<DeferredSyncTask[]>(window.localStorage.getItem(QUEUE_KEY), memoryQueue);
  memoryQueue = stored;
  return stored
    .filter((task) => task?.id && task?.type);
};

const writeQueue = (tasks: DeferredSyncTask[]) => {
  memoryQueue = tasks;
  if (typeof window === 'undefined') return;
  try {
    if (tasks.length === 0) {
      window.localStorage.removeItem(QUEUE_KEY);
      return;
    }
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.warn('[DEFERRED_SYNC] No se pudo persistir la cola; se mantiene en memoria.', error);
  }
};

const todayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeTime = (value: string | undefined) => {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return DEFAULT_SYNC_TIME;
  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const nextScheduledAt = (time: string, from = new Date()) => {
  const [hours, minutes] = normalizeTime(time).split(':').map(Number);
  const next = new Date(from);
  next.setHours(hours, minutes, 0, 0);
  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
};

export const getDeferredSyncSettings = (): DeferredSyncSettings => {
  if (typeof window === 'undefined') {
    return memorySettings || { enabled: true, time: DEFAULT_SYNC_TIME };
  }
  const stored = safeParse<DeferredSyncSettings>(window.localStorage.getItem(SETTINGS_KEY), {
    ...(memorySettings || {}),
    enabled: true,
    time: DEFAULT_SYNC_TIME,
  });
  const normalized = {
    ...stored,
    enabled: stored.enabled !== false,
    time: normalizeTime(stored.time),
  };
  memorySettings = normalized;
  return normalized;
};

const saveSettings = (settings: DeferredSyncSettings) => {
  const normalized = {
    ...settings,
    time: normalizeTime(settings.time),
  };
  memorySettings = normalized;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.warn('[DEFERRED_SYNC] No se pudo persistir la configuracion; se mantiene en memoria.', error);
  }
};

export const updateDeferredSyncSettings = (patch: Partial<DeferredSyncSettings>) => {
  const current = getDeferredSyncSettings();
  const queue = readQueue();
  const next: DeferredSyncSettings = {
    ...current,
    ...patch,
    time: normalizeTime(patch.time || current.time),
  };

  if (queue.length > 0 && (patch.time || patch.enabled !== undefined)) {
    next.nextRunAtMs = next.enabled ? nextScheduledAt(next.time) : undefined;
  }

  saveSettings(next);
  scheduleDeferredSyncCheck();
  return next;
};

export const getDeferredSyncStatus = (): DeferredSyncStatus => {
  const queue = readQueue();
  const pendingTypes = queue.reduce<Record<string, number>>((acc, task) => {
    acc[task.type] = (acc[task.type] || 0) + 1;
    return acc;
  }, {});

  return {
    ...getDeferredSyncSettings(),
    pendingCount: queue.length,
    pendingTypes,
  };
};

export const enqueueDeferredSync = (
  type: DeferredSyncTaskType,
  payload: any,
  dedupeKey: string
) => {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const id = `${type}:${dedupeKey}`;
  const queue = readQueue();
  const current = queue.find((task) => task.id === id);
  const nextTask: DeferredSyncTask = {
    id,
    type,
    payload,
    queuedAtMs: current?.queuedAtMs || now,
    updatedAtMs: now,
    attempts: current?.attempts || 0,
  };
  const nextQueue = [...queue.filter((task) => task.id !== id), nextTask];
  writeQueue(nextQueue);

  const settings = getDeferredSyncSettings();
  if (settings.enabled && !settings.nextRunAtMs) {
    saveSettings({
      ...settings,
      nextRunAtMs: nextScheduledAt(settings.time),
      lastError: undefined,
    });
  }

  scheduleDeferredSyncCheck();
};

export const initializeDeferredSync = (runner: SyncRunner) => {
  syncRunner = runner;
  scheduleDeferredSyncCheck();
  void runDeferredSyncIfDue();

  if (!checkInterval && typeof window !== 'undefined') {
    checkInterval = setInterval(() => {
      void runDeferredSyncIfDue();
    }, CHECK_INTERVAL_MS);
  }

  return () => {
    if (syncTimer) clearTimeout(syncTimer);
    if (checkInterval) clearInterval(checkInterval);
    syncTimer = null;
    checkInterval = null;
    syncRunner = null;
  };
};

export const scheduleDeferredSyncCheck = () => {
  if (typeof window === 'undefined') return;
  if (syncTimer) clearTimeout(syncTimer);

  const status = getDeferredSyncStatus();
  if (!status.enabled || status.pendingCount === 0 || !status.nextRunAtMs) return;

  const delay = Math.max(0, Math.min(status.nextRunAtMs - Date.now(), 2_147_483_647));
  syncTimer = setTimeout(() => {
    void runDeferredSyncIfDue();
  }, delay);
};

export const runDeferredSyncIfDue = async () => {
  const settings = getDeferredSyncSettings();
  const queue = readQueue();
  if (!settings.enabled || queue.length === 0) return { ran: false, processed: 0 };

  if (!settings.nextRunAtMs) {
    updateDeferredSyncSettings({ nextRunAtMs: nextScheduledAt(settings.time) });
    return { ran: false, processed: 0 };
  }

  if (Date.now() < settings.nextRunAtMs) return { ran: false, processed: 0 };
  return flushDeferredSyncNow('scheduled');
};

export const flushDeferredSyncNow = async (_reason: 'manual' | 'scheduled' = 'manual') => {
  if (isFlushing) return { ok: false, processed: 0, message: 'Ya hay una sincronizacion en curso.' };

  const queue = readQueue();
  if (queue.length === 0) {
    const settings = getDeferredSyncSettings();
    saveSettings({ ...settings, nextRunAtMs: undefined, lastError: undefined });
    return { ok: true, processed: 0, message: 'No hay cambios pendientes.' };
  }

  if (!syncRunner) {
    return { ok: false, processed: 0, message: 'La sincronizacion aun no esta inicializada.' };
  }

  isFlushing = true;
  try {
    await syncRunner(queue);
    writeQueue([]);
    const now = Date.now();
    const settings = getDeferredSyncSettings();
    saveSettings({
      ...settings,
      nextRunAtMs: undefined,
      lastRunAtMs: now,
      lastRunDate: todayKey(new Date(now)),
      lastError: undefined,
    });
    scheduleDeferredSyncCheck();
    return { ok: true, processed: queue.length, message: 'Cambios subidos a Firebase.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo sincronizar con Firebase.';
    const failedAt = Date.now();
    writeQueue(queue.map((task) => ({
      ...task,
      attempts: task.attempts + 1,
      lastError: message,
    })));
    const settings = getDeferredSyncSettings();
    saveSettings({
      ...settings,
      lastError: message,
      nextRunAtMs: nextScheduledAt(settings.time, new Date(failedAt)),
    });
    scheduleDeferredSyncCheck();
    return { ok: false, processed: 0, message };
  } finally {
    isFlushing = false;
  }
};
