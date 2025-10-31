export type PromptTemplate = {
    id: string;
    name: string;
    description?: string;
    ratio: '2:3' | '1:1' | '16:9';
    fields: Array<{
        key: string;
        label: string;
        type: 'string' | 'enum';
        options?: string[];
        hint?: string;
        required?: boolean;
    }>;
    defaults: {
        negative: string;
        params: {
            width: number;
            height: number;
            steps: number;
            guidance: number;
            model?: string;
        };
    };
    render: (fields: Record<string, unknown>) => string;
};
export declare const TEMPLATES: PromptTemplate[];
