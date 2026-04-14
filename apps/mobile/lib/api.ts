import type {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  ProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  PageImageResponse,
  SceneResponse,
  TextRegionInput,
  VoiceResponse,
  AudioTrackResponse,
  PlaylistItemResponse,
} from '@book-scanner/shared';
import { tokenStorage } from './token-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.message || `Request failed: ${res.status}`) as Error & {
      status: number;
    };
    error.status = res.status;
    throw error;
  }

  return res.json() as Promise<T>;
}

export const api = {
  register(data: RegisterRequest) {
    return apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login(data: LoginRequest) {
    return apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout() {
    return apiFetch<{ message: string }>('/auth/logout', { method: 'POST' });
  },

  resetPassword(email: string) {
    return apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getMe() {
    return apiFetch<{ user: { id: string; email: string } }>('/auth/me');
  },

  getProjects() {
    return apiFetch<ProjectResponse[]>('/projects');
  },

  getProject(id: string) {
    return apiFetch<ProjectResponse>(`/projects/${id}`);
  },

  createProject(data: CreateProjectRequest) {
    return apiFetch<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateProject(id: string, data: UpdateProjectRequest) {
    return apiFetch<ProjectResponse>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteProject(id: string) {
    return apiFetch<{ message: string }>(`/projects/${id}`, { method: 'DELETE' });
  },

  async uploadImages(projectId: string, files: { uri: string; name: string; type: string }[]) {
    const token = await tokenStorage.getAccessToken();
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);
    }

    const res = await fetch(`${API_URL}/projects/${projectId}/images`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Upload failed: ${res.status}`);
    }

    return res.json() as Promise<PageImageResponse[]>;
  },

  getImages(projectId: string) {
    return apiFetch<PageImageResponse[]>(`/projects/${projectId}/images`);
  },

  reorderImages(projectId: string, imageIds: string[]) {
    return apiFetch<PageImageResponse[]>(`/projects/${projectId}/images/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ imageIds }),
    });
  },

  deleteImage(projectId: string, imageId: string) {
    return apiFetch<{ message: string }>(`/projects/${projectId}/images/${imageId}`, {
      method: 'DELETE',
    });
  },

  processOcr(projectId: string) {
    return apiFetch<SceneResponse[]>(`/projects/${projectId}/scenes/process-ocr`, {
      method: 'POST',
    });
  },

  getScenes(projectId: string) {
    return apiFetch<SceneResponse[]>(`/projects/${projectId}/scenes`);
  },

  saveTextRegions(projectId: string, regions: TextRegionInput[]) {
    return apiFetch<unknown>(`/projects/${projectId}/scenes/text-regions`, {
      method: 'POST',
      body: JSON.stringify({ regions }),
    });
  },

  getScene(projectId: string, sceneId: string) {
    return apiFetch<
      SceneResponse & {
        pageImage: {
          id: string;
          storagePath: string;
          thumbnailPath: string | null;
          imageUrl: string;
          thumbnailUrl: string | null;
          originalFilename: string | null;
        };
      }
    >(`/projects/${projectId}/scenes/${sceneId}`);
  },

  updateScene(projectId: string, sceneId: string, data: { editedText?: string | null; status?: string }) {
    return apiFetch<SceneResponse>(`/projects/${projectId}/scenes/${sceneId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getVoices(language?: string) {
    const qs = language ? `?language=${language}` : '';
    return apiFetch<VoiceResponse[]>(`/voices${qs}`);
  },

  generateAudio(projectId: string) {
    return apiFetch<SceneResponse[]>(`/projects/${projectId}/generate-audio`, {
      method: 'POST',
    });
  },

  getAudioTracks(projectId: string) {
    return apiFetch<AudioTrackResponse[]>(`/projects/${projectId}/audio-tracks`);
  },

  buildPlaylist(projectId: string) {
    return apiFetch<{ message: string; itemCount: number }>(`/projects/${projectId}/build-playlist`, {
      method: 'POST',
    });
  },

  getPlaylist(projectId: string) {
    return apiFetch<PlaylistItemResponse[]>(`/projects/${projectId}/playlist`);
  },

  shareProject(projectId: string, email: string) {
    return apiFetch<{ id: string; sharedWithEmail: string; role: string }>(`/projects/${projectId}/share`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getShares(projectId: string) {
    return apiFetch<{ id: string; sharedWithUserId: string; sharedWithEmail: string; role: string; createdAt: string }[]>(
      `/projects/${projectId}/shares`,
    );
  },

  revokeShare(projectId: string, userId: string) {
    return apiFetch<{ message: string }>(`/projects/${projectId}/share/${userId}`, {
      method: 'DELETE',
    });
  },

  generateQr(projectId: string) {
    return apiFetch<{
      id: string;
      deepLinkUrl: string;
      webFallbackUrl: string;
      qrImageUrl: string;
    }>(`/projects/${projectId}/qr`, { method: 'POST' });
  },

  getQr(projectId: string) {
    return apiFetch<{ id: string; deepLinkUrl: string; qrImageUrl: string }>(`/projects/${projectId}/qr`);
  },

  getPricing() {
    return apiFetch<{ type: string; name: string; price: number; limits: { maxActiveProjects: number; maxPagesPerMonth: number }; features: string[] }[]>('/pricing');
  },

  getMyPlan() {
    return apiFetch<{ planType: string; pagesLimit: number; projectsLimit: number }>('/me/plan');
  },

  getMyUsage() {
    return apiFetch<{
      plan: string;
      pagesUsed: number;
      pagesLimit: number;
      projectsUsed: number;
      projectsLimit: number;
      periodMonth: string;
    }>('/me/usage');
  },
};
