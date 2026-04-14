import { Platform } from 'react-native';
import type { PlaylistItemResponse } from '@book-scanner/shared';

const CACHE_PREFIX = 'bookscanner_audio_';

interface CacheEntry {
  projectId: string;
  items: { id: string; localUri: string; audioUrl: string; durationMs: number }[];
  cachedAt: string;
  totalSize: number;
}

function getCacheKey(projectId: string) {
  return `${CACHE_PREFIX}${projectId}`;
}

async function getFileSystem() {
  if (Platform.OS === 'web') return null;
  return await import('expo-file-system');
}

export const offlineCache = {
  async downloadProject(
    projectId: string,
    playlist: PlaylistItemResponse[],
    onProgress?: (downloaded: number, total: number) => void,
  ): Promise<void> {
    const fs = await getFileSystem();

    if (!fs) {
      const entries: CacheEntry['items'] = playlist.map((item) => ({
        id: item.id,
        localUri: item.audioUrl,
        audioUrl: item.audioUrl,
        durationMs: item.durationMs,
      }));
      const entry: CacheEntry = {
        projectId,
        items: entries,
        cachedAt: new Date().toISOString(),
        totalSize: 0,
      };
      localStorage.setItem(getCacheKey(projectId), JSON.stringify(entry));
      onProgress?.(playlist.length, playlist.length);
      return;
    }

    const cacheDir = `${fs.documentDirectory}audio_cache/${projectId}/`;
    const dirInfo = await fs.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await fs.makeDirectoryAsync(cacheDir, { intermediates: true });
    }

    const entries: CacheEntry['items'] = [];
    let totalSize = 0;

    for (let i = 0; i < playlist.length; i++) {
      const item = playlist[i];
      const ext = item.audioUrl.split('.').pop() || 'mp3';
      const localPath = `${cacheDir}${item.id}.${ext}`;

      const existing = await fs.getInfoAsync(localPath);
      if (existing.exists) {
        entries.push({ id: item.id, localUri: localPath, audioUrl: item.audioUrl, durationMs: item.durationMs });
        totalSize += existing.size || 0;
        onProgress?.(i + 1, playlist.length);
        continue;
      }

      const download = await fs.downloadAsync(item.audioUrl, localPath);
      const info = await fs.getInfoAsync(download.uri);
      totalSize += info.exists ? (info.size || 0) : 0;

      entries.push({ id: item.id, localUri: download.uri, audioUrl: item.audioUrl, durationMs: item.durationMs });
      onProgress?.(i + 1, playlist.length);
    }

    const entry: CacheEntry = {
      projectId,
      items: entries,
      cachedAt: new Date().toISOString(),
      totalSize,
    };

    await fs.writeAsStringAsync(
      `${cacheDir}manifest.json`,
      JSON.stringify(entry),
    );
  },

  async getCachedPlaylist(projectId: string): Promise<CacheEntry | null> {
    const fs = await getFileSystem();

    if (!fs) {
      const raw = localStorage.getItem(getCacheKey(projectId));
      return raw ? JSON.parse(raw) : null;
    }

    const manifestPath = `${fs.documentDirectory}audio_cache/${projectId}/manifest.json`;
    const info = await fs.getInfoAsync(manifestPath);
    if (!info.exists) return null;

    const raw = await fs.readAsStringAsync(manifestPath);
    return JSON.parse(raw) as CacheEntry;
  },

  async isProjectCached(projectId: string): Promise<boolean> {
    const entry = await this.getCachedPlaylist(projectId);
    return entry !== null && entry.items.length > 0;
  },

  async deleteProjectCache(projectId: string): Promise<void> {
    const fs = await getFileSystem();

    if (!fs) {
      localStorage.removeItem(getCacheKey(projectId));
      return;
    }

    const cacheDir = `${fs.documentDirectory}audio_cache/${projectId}/`;
    const info = await fs.getInfoAsync(cacheDir);
    if (info.exists) {
      await fs.deleteAsync(cacheDir, { idempotent: true });
    }
  },

  async getCacheSize(projectId: string): Promise<number> {
    const entry = await this.getCachedPlaylist(projectId);
    return entry?.totalSize || 0;
  },

  async getTotalCacheSize(): Promise<number> {
    const fs = await getFileSystem();

    if (!fs) {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
          total += localStorage.getItem(key)?.length || 0;
        }
      }
      return total;
    }

    const cacheRoot = `${fs.documentDirectory}audio_cache/`;
    const info = await fs.getInfoAsync(cacheRoot);
    if (!info.exists) return 0;

    const dirs = await fs.readDirectoryAsync(cacheRoot);
    let total = 0;
    for (const dir of dirs) {
      const manifest = `${cacheRoot}${dir}/manifest.json`;
      const mInfo = await fs.getInfoAsync(manifest);
      if (mInfo.exists) {
        const raw = await fs.readAsStringAsync(manifest);
        const entry = JSON.parse(raw) as CacheEntry;
        total += entry.totalSize;
      }
    }
    return total;
  },
};
