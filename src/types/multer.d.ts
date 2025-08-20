declare module 'multer' {
  import { Request } from 'express';

  export interface File {
    /** Field name specified in the form */
    fieldname: string;
    /** Name of the file on the user's computer */
    originalname: string;
    /** Encoding type of the file */
    encoding: string;
    /** Mime type of the file */
    mimetype: string;
    /** Size of the file in bytes */
    size: number;
    /** The folder to which the file has been saved (diskStorage) */
    destination: string;
    /** The name of the file within the destination (diskStorage) */
    filename: string;
    /** Location of the uploaded file (diskStorage) */
    path: string;
    /** A Buffer of the entire file (memoryStorage) */
    buffer: Buffer;
  }

  export type FileFilterCallback = (error: Error | null, acceptFile?: boolean) => void;

  export interface StorageEngine {
    _handleFile(req: Request, file: File, callback: (error?: any, info?: Partial<File>) => void): void;
    _removeFile(req: Request, file: File, callback: (error: Error | null) => void): void;
  }

  export interface MulterOptions {
    storage?: StorageEngine;
    limits?: { fileSize?: number };
    fileFilter?: (req: Request, file: File, cb: FileFilterCallback) => void;
  }

  export interface DiskStorageOptions {
    destination?: string | ((req: Request, file: File, cb: (error: Error | null, destination: string) => void) => void);
    filename?: (req: Request, file: File, cb: (error: Error | null, filename: string) => void) => void;
  }

  export interface MulterInstance {
    single(fieldname: string): any;
    array(fieldname: string, maxCount?: number): any;
    fields(fields: Array<{ name: string; maxCount?: number }>): any;
    any(): any;
    none(): any;
  }

  function multer(options?: MulterOptions): MulterInstance;
  namespace multer {
    function diskStorage(options: DiskStorageOptions): StorageEngine;
  }

  export default multer;
  export { File, FileFilterCallback };
}


