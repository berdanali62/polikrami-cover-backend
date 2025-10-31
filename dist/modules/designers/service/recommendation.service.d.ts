export type DesignerStats = {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    ratingAvg: number;
    ratingCount: number;
    recentJobs30d: number;
};
export declare function wilsonLowerBound(avgOutOf5: number, count: number): number;
export declare function getDesignerStats(): Promise<DesignerStats[]>;
export declare function getDesignersBasic(): Promise<Array<{
    id: string;
    name: string | null;
    email: string | null;
    profile: unknown;
}>>;
export declare function buildRecommendedSlate(all: DesignerStats[], slateSize?: number): {
    slate: DesignerStats[];
    rest: DesignerStats[];
};
