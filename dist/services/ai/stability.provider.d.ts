export type StabilityParams = {
    prompt: string;
    negative?: string;
    params: {
        width: number;
        height: number;
        steps?: number;
        guidance?: number;
        model?: string;
    };
    count: number;
};
export declare class StabilityProvider {
    private apiKey;
    constructor(apiKey: string);
    private mapModel;
    generate(input: StabilityParams): Promise<Buffer[]>;
}
