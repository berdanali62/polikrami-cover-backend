import { z } from 'zod';
export declare const toggleLikeSchema: z.ZodObject<{
    messageCardId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    messageCardId: string;
}, {
    messageCardId: string;
}>;
export declare const likeSummaryParamsSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type ToggleLikeDto = z.infer<typeof toggleLikeSchema>;
export type LikeSummaryParamsDto = z.infer<typeof likeSummaryParamsSchema>;
