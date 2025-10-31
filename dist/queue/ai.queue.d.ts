export type AiJobData = {
    jobId: string;
    draftId: string;
    userId: string;
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
    costCredits: number;
};
export declare const AI_QUEUE_NAME = "ai:generate";
export declare const aiQueue: any;
export declare const defaultJobOptions: {
    attempts: number;
    backoff: {
        type: string;
        delay: number;
    };
    removeOnComplete: number;
    removeOnFail: number;
};
