"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Argon2idHasher = void 0;
exports.createDefaultHasher = createDefaultHasher;
const argon2_1 = __importDefault(require("argon2"));
const crypto_1 = require("crypto");
const DEFAULTS = {
    type: argon2_1.default.argon2id,
    timeCost: 3,
    memoryCost: 65536,
    parallelism: 2,
    saltLength: 16,
};
class Argon2idHasher {
    constructor(config) {
        var _a, _b, _c, _d;
        this.timeCost = (_a = config === null || config === void 0 ? void 0 : config.timeCost) !== null && _a !== void 0 ? _a : DEFAULTS.timeCost;
        this.memoryCost = (_b = config === null || config === void 0 ? void 0 : config.memoryCost) !== null && _b !== void 0 ? _b : DEFAULTS.memoryCost;
        this.parallelism = (_c = config === null || config === void 0 ? void 0 : config.parallelism) !== null && _c !== void 0 ? _c : DEFAULTS.parallelism;
        this.saltLength = (_d = config === null || config === void 0 ? void 0 : config.saltLength) !== null && _d !== void 0 ? _d : DEFAULTS.saltLength;
    }
    async hashPassword(plain) {
        const salt = (0, crypto_1.randomBytes)(this.saltLength);
        return argon2_1.default.hash(plain, {
            type: argon2_1.default.argon2id,
            timeCost: this.timeCost,
            memoryCost: this.memoryCost,
            parallelism: this.parallelism,
            salt,
        });
    }
    async verifyPassword(hash, plain) {
        try {
            return await argon2_1.default.verify(hash, plain);
        }
        catch {
            return false;
        }
    }
    async hashToken(plain) {
        const salt = (0, crypto_1.randomBytes)(this.saltLength);
        return argon2_1.default.hash(plain, {
            type: argon2_1.default.argon2id,
            timeCost: Math.max(1, this.timeCost - 1),
            memoryCost: this.memoryCost,
            parallelism: this.parallelism,
            salt,
        });
    }
    async verifyTokenHash(hash, plain) {
        try {
            return await argon2_1.default.verify(hash, plain);
        }
        catch {
            return false;
        }
    }
}
exports.Argon2idHasher = Argon2idHasher;
function createDefaultHasher() {
    return new Argon2idHasher();
}
