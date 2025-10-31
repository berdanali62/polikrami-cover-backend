"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StabilityProvider = void 0;
class StabilityProvider {
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    mapModel(model) {
        // simple mapping; can be extended
        if (!model)
            return 'sdxl-1.0';
        const m = model.toLowerCase();
        if (m.includes('sdxl'))
            return 'sdxl-1.0';
        return 'sdxl-1.0';
    }
    async generate(input) {
        if (!this.apiKey)
            throw new Error('STABILITY_API_KEY is required');
        const model = this.mapModel(input.params.model);
        const url = `https://api.stability.ai/v2beta/stable-image/generate/creative`; // Using a generic endpoint; adjust as needed
        const body = new URLSearchParams();
        body.append('prompt', input.prompt);
        if (input.negative)
            body.append('negative_prompt', input.negative);
        body.append('output_format', 'png');
        body.append('model', model);
        body.append('width', String(input.params.width));
        body.append('height', String(input.params.height));
        if (input.params.steps)
            body.append('steps', String(input.params.steps));
        if (input.params.guidance)
            body.append('guidance', String(input.params.guidance));
        body.append('samples', String(input.count));
        // Simple timeout + retry with backoff
        const attempts = 3;
        const timeoutMs = 60_000;
        let lastErr;
        for (let i = 0; i < attempts; i++) {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), timeoutMs);
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        Accept: 'image/*',
                    },
                    body,
                    signal: controller.signal,
                });
                clearTimeout(timer);
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Stability API error ${res.status}: ${text}`);
                }
                const ct = res.headers.get('content-type') || '';
                if (ct.startsWith('image/')) {
                    const buf = Buffer.from(await res.arrayBuffer());
                    return [buf];
                }
                // Basic multipart/mixed support: split by boundary and extract image parts
                if (ct.includes('multipart')) {
                    const boundaryMatch = ct.match(/boundary=(.*)$/);
                    const boundary = boundaryMatch ? boundaryMatch[1] : undefined;
                    const raw = Buffer.from(await res.arrayBuffer());
                    if (boundary) {
                        const parts = raw.toString('binary').split(`--${boundary}`);
                        const images = [];
                        for (const part of parts) {
                            const headerEnd = part.indexOf('\r\n\r\n');
                            if (headerEnd === -1)
                                continue;
                            const header = part.slice(0, headerEnd);
                            if (/Content-Type:\s*image\//i.test(header)) {
                                const contentBinary = part.slice(headerEnd + 4);
                                // remove trailing CRLF if present
                                const trimmed = contentBinary.replace(/\r\n$/, '');
                                images.push(Buffer.from(trimmed, 'binary'));
                            }
                        }
                        if (images.length)
                            return images;
                    }
                    // fallback: return raw as single buffer
                    return [raw];
                }
                const buf = Buffer.from(await res.arrayBuffer());
                return [buf];
            }
            catch (err) {
                lastErr = err;
                // Backoff: 500ms, 1500ms, 2500ms
                await new Promise((r) => setTimeout(r, 500 + i * 1000));
            }
        }
        throw lastErr instanceof Error ? lastErr : new Error('Stability request failed');
    }
}
exports.StabilityProvider = StabilityProvider;
