export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'AI_MODEL';
export type StorageProvider = 'CLOUDINARY' | 'R2' | 'S3' | 'PASSTHROUGH';
export type SharePermission = 'VIEWER' | 'EDITOR' | 'ADMIN';

export interface AIMetadata {
  prompt?: string;
  negativePrompt?: string;
  aiProvider?: string;
  model?: string;
  seed?: number;
  steps?: number;
  aspectRatio?: string;
  creditsCost?: number;
  latencyMs?: number;
}

export interface MediaAssetRecord {
  id: string;
  title: string;
  description?: string;
  fileType: MediaType;
  mimeType: string;
  sizeBytes: number;
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  storageBucket: string;
  storageProvider: StorageProvider;
  
  width?: number;
  height?: number;
  durationSec?: number;
  
  prompt?: string;
  negativePrompt?: string;
  aiProvider?: string;
  model?: string;
  seed?: number;
  steps?: number;
  aspectRatio?: string;
  creditsCost?: number;
  latencyMs?: number;
  
  folderId?: string;
  collectionId?: string;
  ownerId: string;
  workspaceId: string;
  
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  tags?: string[];
  versionCount?: number;
  versions?: MediaVersionRecord[];
  comments?: MediaCommentRecord[];
  shares?: MediaShareRecord[];
}

export interface MediaVersionRecord {
  id: string;
  assetId: string;
  versionNumber: number;
  url: string;
  cdnUrl?: string;
  storageProvider: StorageProvider;
  sizeBytes: number;
  changeSummary?: string;
  createdById: string;
  createdAt: string;
}

export interface MediaFolderRecord {
  id: string;
  name: string;
  parentId?: string;
  workspaceId: string;
  ownerId: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  assetCount?: number;
}

export interface MediaCollectionRecord {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  assetCount?: number;
}

export interface MediaCommentRecord {
  id: string;
  assetId: string;
  userId: string;
  userName: string;
  text: string;
  timestampMs?: number;
  createdAt: string;
}

export interface MediaShareRecord {
  id: string;
  assetId: string;
  sharedWithUserId?: string;
  permission: SharePermission;
  accessLinkToken: string;
  expiresAt?: string;
  createdAt: string;
}

export interface MediaFilterParams {
  fileType?: MediaType;
  folderId?: string;
  collectionId?: string;
  search?: string;
  isFavorite?: boolean;
  isTrash?: boolean;
  isArchived?: boolean;
  workspaceId?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'title' | 'sizeBytes' | 'creditsCost';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateMediaAssetOptions {
  title: string;
  fileType?: MediaType;
  mimeType?: string;
  sizeBytes?: number;
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  storageBucket?: string;
  storageProvider?: StorageProvider;
  width?: number;
  height?: number;
  durationSec?: number;
  aiMetadata?: AIMetadata;
  folderId?: string;
  collectionId?: string;
  ownerId?: string;
  workspaceId?: string;
  tags?: string[];
}
