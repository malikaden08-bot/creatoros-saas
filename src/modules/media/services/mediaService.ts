import { multiStorageRegistry } from '../storage/multiStorageRegistry';
import { AISearchEngine } from '../search/aiSearchEngine';
import { VersionManager } from '../versions/versionManager';
import { MediaPermissionsEngine } from '../permissions/mediaPermissionsEngine';
import {
  MediaAssetRecord,
  MediaFolderRecord,
  MediaCollectionRecord,
  CreateMediaAssetOptions,
  MediaFilterParams,
  MediaType,
  MediaVersionRecord
} from '../types';
import { logger } from '../../../services/logger';
import { SecurityAuditLogger } from '../../../services/security/auditLogger';

export class MediaService {
  private static instance: MediaService;
  private inMemoryAssets: Map<string, MediaAssetRecord> = new Map();
  private inMemoryFolders: Map<string, MediaFolderRecord> = new Map();
  private inMemoryCollections: Map<string, MediaCollectionRecord> = new Map();

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  public async createAsset(options: CreateMediaAssetOptions): Promise<MediaAssetRecord> {
    const startTime = Date.now();
    logger.info({ title: options.title, type: options.fileType }, '[MediaService] Creating asset via Media Service facade');

    const storageRes = await multiStorageRegistry.upload({
      rawUrlOrBase64: options.url,
      prefix: `creatoros/${(options.fileType || 'IMAGE').toLowerCase()}`
    });

    const assetId = `ast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const asset: MediaAssetRecord = {
      id: assetId,
      title: options.title,
      fileType: options.fileType || 'IMAGE',
      mimeType: options.mimeType || (options.fileType === 'VIDEO' ? 'video/mp4' : 'image/png'),
      sizeBytes: options.sizeBytes || storageRes.sizeBytes || 1024 * 512,
      url: storageRes.url,
      cdnUrl: storageRes.cdnUrl,
      thumbnailUrl: options.thumbnailUrl || storageRes.cdnUrl,
      storageBucket: storageRes.bucket,
      storageProvider: storageRes.provider,
      width: options.width || 1280,
      height: options.height || 720,
      durationSec: options.durationSec,
      prompt: options.aiMetadata?.prompt,
      negativePrompt: options.aiMetadata?.negativePrompt,
      aiProvider: options.aiMetadata?.aiProvider,
      model: options.aiMetadata?.model,
      seed: options.aiMetadata?.seed,
      steps: options.aiMetadata?.steps,
      aspectRatio: options.aiMetadata?.aspectRatio,
      creditsCost: options.aiMetadata?.creditsCost || 0,
      latencyMs: options.aiMetadata?.latencyMs || Date.now() - startTime,
      folderId: options.folderId,
      collectionId: options.collectionId,
      ownerId: options.ownerId || 'usr-1',
      workspaceId: options.workspaceId || 'ws-default',
      isFavorite: false,
      isArchived: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
      tags: options.tags || ['ai-generated']
    };

    VersionManager.addVersion(asset, asset.url, 'Initial creation V1', asset.ownerId);

    this.inMemoryAssets.set(asset.id, asset);

    SecurityAuditLogger.logEvent({
      eventType: 'MEDIA_ASSET_CREATED',
      severity: 'INFO',
      userId: asset.ownerId,
      details: `Created media asset "${asset.title}" (${asset.fileType}) via ${asset.storageProvider}`
    });

    logger.info({ assetId: asset.id, title: asset.title }, '[MediaService] Asset created successfully');
    return asset;
  }

  public getAssets(filters?: MediaFilterParams): { assets: MediaAssetRecord[]; total: number } {
    let all = Array.from(this.inMemoryAssets.values());
    const filtered = AISearchEngine.filterAssets(all, filters?.search, filters);
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const paginated = filtered.slice((page - 1) * limit, page * limit);
    return { assets: paginated, total: filtered.length };
  }

  public getAssetById(id: string): MediaAssetRecord | null {
    return this.inMemoryAssets.get(id) || null;
  }

  public updateAsset(id: string, updates: Partial<MediaAssetRecord>): MediaAssetRecord {
    const asset = this.inMemoryAssets.get(id);
    if (!asset) throw new Error(`Media Asset ${id} not found.`);
    Object.assign(asset, updates, { updatedAt: new Date().toISOString() });
    this.inMemoryAssets.set(id, asset);
    return asset;
  }

  public softDeleteAsset(id: string): boolean {
    const asset = this.inMemoryAssets.get(id);
    if (!asset) return false;
    asset.isDeleted = true;
    asset.deletedAt = new Date().toISOString();
    this.inMemoryAssets.set(id, asset);
    return true;
  }

  public restoreAsset(id: string): boolean {
    const asset = this.inMemoryAssets.get(id);
    if (!asset) return false;
    asset.isDeleted = false;
    asset.deletedAt = undefined;
    this.inMemoryAssets.set(id, asset);
    return true;
  }

  public moveAsset(id: string, targetFolderId?: string, targetCollectionId?: string): MediaAssetRecord {
    const asset = this.inMemoryAssets.get(id);
    if (!asset) throw new Error(`Media Asset ${id} not found.`);
    asset.folderId = targetFolderId;
    asset.collectionId = targetCollectionId;
    asset.updatedAt = new Date().toISOString();
    this.inMemoryAssets.set(id, asset);
    return asset;
  }

  public createVersion(assetId: string, newUrl: string, changeSummary?: string): MediaVersionRecord {
    const asset = this.getAssetById(assetId);
    if (!asset) throw new Error(`Media Asset ${assetId} not found.`);
    const version = VersionManager.addVersion(asset, newUrl, changeSummary, asset.ownerId);
    asset.url = newUrl;
    asset.cdnUrl = newUrl;
    asset.updatedAt = new Date().toISOString();
    this.inMemoryAssets.set(asset.id, asset);
    return version;
  }

  public restoreVersion(assetId: string, versionNumber: number): MediaAssetRecord {
    const asset = this.getAssetById(assetId);
    if (!asset) throw new Error(`Media Asset ${assetId} not found.`);
    const restored = VersionManager.restoreVersion(asset, versionNumber);
    this.inMemoryAssets.set(restored.id, restored);
    return restored;
  }

  public toggleFavorite(id: string): boolean {
    const asset = this.inMemoryAssets.get(id);
    if (!asset) return false;
    asset.isFavorite = !asset.isFavorite;
    this.inMemoryAssets.set(id, asset);
    return asset.isFavorite;
  }

  public getFolders(): MediaFolderRecord[] {
    return Array.from(this.inMemoryFolders.values());
  }

  public createFolder(name: string, color = '#6366f1', icon = 'folder'): MediaFolderRecord {
    const id = `fld_${Date.now()}`;
    const folder: MediaFolderRecord = {
      id, name, workspaceId: 'ws-default', ownerId: 'usr-1', color, icon,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    this.inMemoryFolders.set(id, folder);
    return folder;
  }

  public getCollections(): MediaCollectionRecord[] {
    return Array.from(this.inMemoryCollections.values());
  }

  private seedDemoData() {
    const now = new Date().toISOString();
    this.createFolder('AI Generated Art', '#ec4899', 'wand');
    this.createFolder('Video Clips & Loops', '#8b5cf6', 'film');
    this.createFolder('Brand Assets & Logos', '#3b82f6', 'palette');

    const demoAssets: CreateMediaAssetOptions[] = [
      {
        title: 'Futuristic Cyberpunk Cityscape', fileType: 'IMAGE', mimeType: 'image/png', sizeBytes: 2450000,
        url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80',
        width: 1920, height: 1080,
        aiMetadata: { prompt: 'Futuristic cyberpunk neon city with flying sports cars at midnight, ultra realistic 8k', aiProvider: 'flux', model: 'flux-1.1-pro', seed: 482910, steps: 30, aspectRatio: '16:9', creditsCost: 20 },
        tags: ['cyberpunk', 'neon', 'city', 'flux']
      },
      {
        title: 'Cinematic Aerial Mountain Ridge', fileType: 'VIDEO', mimeType: 'video/mp4', sizeBytes: 15400000,
        url: 'https://cdn.creatoros.io/demo/mountain_drone.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
        width: 1280, height: 720, durationSec: 8.5,
        aiMetadata: { prompt: 'Cinematic aerial drone shot passing over snow capped mountain peak during sunrise', aiProvider: 'kling', model: 'kling-v1.6-pro', seed: 918237, aspectRatio: '16:9', creditsCost: 100 },
        tags: ['aerial', 'mountains', 'cinematic', 'video']
      },
      {
        title: 'CreatorOS Vector Brand Logo', fileType: 'IMAGE', mimeType: 'image/svg+xml', sizeBytes: 45000,
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        width: 800, height: 800,
        aiMetadata: { prompt: 'Modern minimalist vector logo emblem for AI creative platform', aiProvider: 'recraft', model: 'recraft-v3', creditsCost: 15 },
        tags: ['logo', 'vector', 'brand']
      }
    ];

    demoAssets.forEach((opts) => {
      const assetId = `ast_${Math.random().toString(36).slice(2, 9)}`;
      const asset: MediaAssetRecord = {
        id: assetId, title: opts.title, fileType: opts.fileType || 'IMAGE', mimeType: opts.mimeType || 'image/png', sizeBytes: opts.sizeBytes || 1024 * 1024,
        url: opts.url, cdnUrl: opts.url, thumbnailUrl: opts.thumbnailUrl || opts.url, storageBucket: 'creatoros-cdn', storageProvider: 'CLOUDINARY',
        width: opts.width, height: opts.height, durationSec: opts.durationSec, prompt: opts.aiMetadata?.prompt, aiProvider: opts.aiMetadata?.aiProvider,
        model: opts.aiMetadata?.model, seed: opts.aiMetadata?.seed, steps: opts.aiMetadata?.steps, aspectRatio: opts.aiMetadata?.aspectRatio,
        creditsCost: opts.aiMetadata?.creditsCost || 0, latencyMs: 1200, ownerId: 'usr-1', workspaceId: 'ws-default', isFavorite: opts.title.includes('Vector'),
        isArchived: false, isDeleted: false, createdAt: now, updatedAt: now, tags: opts.tags
      };
      VersionManager.addVersion(asset, asset.url, 'Initial seed version V1');
      this.inMemoryAssets.set(assetId, asset);
    });
  }
}

export const mediaService = MediaService.getInstance();
