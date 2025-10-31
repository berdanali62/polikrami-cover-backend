"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPromptSafety = checkPromptSafety;
const BANNED_PATTERNS = [
    // Sexual / Adult (EN)
    /\bnsfw\b/i,
    /\bporn(?:o|ography)?\b/i,
    /\bnude|nudity\b/i,
    /\bsex(?:ual)?\b/i,
    /\berotic|erotica\b/i,
    /\bexplicit\b/i,
    /\bboobs|tits|nipples?|breasts?\b/i,
    /\bbutt|ass\b/i,
    /\bpenis|vagina|clitoris\b/i,
    /\banal|oral\b/i,
    /\bblowjob|handjob\b/i,
    /\bcumshot|orgasm\b/i,
    /\bmasturbat(?:e|ion)\b/i,
    /\bfetish|bdsm\b/i,
    /\bincest\b/i,
    /\brape|molest\b/i,
    /\bpedoph(?:ile|ilia)|loli\b/i,
    // Sexual / Adult (TR)
    /\bporno|pornograf/i,
    /\bçıplak|çıplaklık/i,
    /\bcinsel|seks\b/i,
    /\berotik\b/i,
    /\bmeme ucu|göğüs ucu|göğüs\b/i,
    /\bkalça|popo\b/i,
    /\bsikiş|sikis|s\.k|s\*k/i,
    /\bam|vajina|penis|dildo\b/i,
    /\boral|anal\b/i,
    /\btecavüz|zorla\b/i,
    /\bensest\b/i,
    /\bpedofili|reşit değil|küçük kız|küçük erkek\b/i,
    // Violence / Gore (EN)
    /\bviolence|violent\b/i,
    /\bgore\b/i,
    /\bblood|bloody\b/i,
    /\bdismember|decapitat|behead\b/i,
    /\bkill|murder|execute\b/i,
    /\btorture\b/i,
    // Violence / Gore (TR)
    /\bşiddet\b/i,
    /\bkan|kanlı\b/i,
    /\bparçala|parçalan|dekapitasyon|kafa kes/i,
    /\böldür|cinayet|idam\b/i,
    /\bişkence\b/i,
    // Self-harm (EN)
    /\bsuicide\b/i,
    /\bself[- ]?harm\b/i,
    /\bkill myself\b/i,
    /\bcut myself\b/i,
    // Self-harm (TR)
    /\bintihar\b/i,
    /\bkendini öldür|kendimi öldür/i,
    /\bkendine zarar|kendimi kes|bilek kes/i,
    // Hate / Harassment (generic)
    /\bhate speech\b/i,
    /\bhate\b/i,
    /\bgenocide\b/i,
    /\bslur\b/i,
    /\bnefret\b/i,
    /\bırkçı|ırkçılık\b/i,
];
function checkPromptSafety(text) {
    if (!text)
        return { ok: true };
    for (const pat of BANNED_PATTERNS) {
        if (pat.test(text)) {
            return { ok: false, reason: `unsafe_content:${pat.source}` };
        }
    }
    return { ok: true };
}
