export declare function checkPromptSafety(text: string | undefined): {
    ok: true;
} | {
    ok: false;
    reason: string;
};
