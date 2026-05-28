export type ProjectStatus = 'draft' | 'ocr_processing' | 'ready_for_tts' | 'completed';

export type SceneStatus =
  | 'queued'
  | 'ocr_processing'
  | 'ocr_done'
  | 'ocr_error'
  | 'needs_review'
  | 'ready_for_audio'
  | 'audio_generating'
  | 'audio_done'
  | 'audio_error';

export type PlanType = 'free' | 'premium' | 'max';

export type ShareRole = 'owner' | 'viewer';

export type PlaylistItemType = 'scene' | 'interstitial';

export type SupportedLanguage = 'pl' | 'en';

export interface ApiHealthResponse {
  status: 'ok';
  timestamp: string;
  version: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

export interface ResetPasswordRequest {
  email: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ProjectResponse {
  id: string;
  title: string;
  coverUrl: string | null;
  language: SupportedLanguage;
  voiceId: string | null;
  interstitialPreset: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  title: string;
  language: SupportedLanguage;
  coverUrl?: string;
  voiceId?: string;
  interstitialPreset?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  language?: SupportedLanguage;
  coverUrl?: string | null;
  voiceId?: string | null;
  interstitialPreset?: string | null;
}

export interface PageImageResponse {
  id: string;
  projectId: string;
  storagePath: string;
  thumbnailPath: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  orderIndex: number;
  originalFilename: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
}

export interface ReorderImagesRequest {
  imageIds: string[];
}

export interface SceneResponse {
  id: string;
  projectId: string;
  pageImageId: string;
  ocrText: string | null;
  editedText: string | null;
  status: SceneStatus;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface TextRegionInput {
  pageImageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  orderIndex?: number;
}

export interface SaveTextRegionsRequest {
  regions: TextRegionInput[];
}

export interface TextRegionResponse {
  id: string;
  pageImageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  orderIndex: number;
}

export interface VoiceResponse {
  id: string;
  elevenlabsVoiceId: string;
  name: string;
  language: string;
  previewUrl: string | null;
}

export interface InterstitialPresetResponse {
  id: string;
  name: string;
  audioUrl: string;
  durationMs: number;
}

export interface AudioTrackResponse {
  id: string;
  sceneId: string;
  storagePath: string;
  audioUrl: string;
  durationMs: number;
  fileSize: number;
  createdAt: string;
}

export interface PlaylistItemResponse {
  id: string;
  projectId: string;
  type: PlaylistItemType;
  referenceId: string;
  orderIndex: number;
  audioUrl: string;
  durationMs: number;
  sceneText?: string;
  sceneOrderIndex?: number;
}
