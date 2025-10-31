export type WatermarkOptions = {
    text?: string;
    logoPath?: string;
    opacity?: number;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
};
export declare function applyWatermark(input: Buffer, opts?: WatermarkOptions): Promise<Buffer>;
