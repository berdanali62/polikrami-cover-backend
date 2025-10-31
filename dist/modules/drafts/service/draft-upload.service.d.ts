export declare class DraftUploadService {
    private readonly allowedMimeTypes;
    private readonly maxSizeMB;
    private readonly uploadDir;
    constructor();
    createUploadUrl(draftId: string, contentType?: string): Promise<{
        url: string;
        method: "POST";
        key: string;
        contentType: string;
        maxSizeMB: number;
        fields: {
            key: string;
        };
    }>;
    handleFileUpload(file: Express.Multer.File, draftId: string): Promise<{
        key: string;
        url: string;
        metadata: any;
    }>;
    deleteFiles(draftId: string): Promise<void>;
    private validateAndGetMimeType;
    private getExtensionForMimeType;
    private isImage;
    private validateFile;
    private validateMagicBytes;
    private processImage;
    private getFileMetadata;
}
