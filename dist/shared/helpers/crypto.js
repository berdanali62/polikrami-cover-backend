"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.hashToken = hashToken;
exports.verifyTokenHash = verifyTokenHash;
const argon2_1 = __importDefault(require("argon2"));
const crypto_1 = require("crypto");
const isTest = process.env.NODE_ENV === 'test';
const ARGON2_OPTIONS = {
    type: argon2_1.default.argon2id,
    timeCost: isTest ? 2 : 3,
    memoryCost: isTest ? 4096 : 65536,
    parallelism: 2,
};
async function hashPassword(plain) {
    // Use our own 16-byte random salt to avoid relying on library-generated salt
    const salt = (0, crypto_1.randomBytes)(16);
    return argon2_1.default.hash(plain, { ...ARGON2_OPTIONS, salt });
}
async function verifyPassword(hash, plain) {
    try {
        // argon2.verify reads salt from the encoded hash; options like time/memory are hints only
        return await argon2_1.default.verify(hash, plain, ARGON2_OPTIONS);
    }
    catch {
        return false;
    }
}
async function hashToken(plain) {
    const salt = (0, crypto_1.randomBytes)(16);
    return argon2_1.default.hash(plain, { ...ARGON2_OPTIONS, timeCost: 2, salt });
}
async function verifyTokenHash(hash, plain) {
    try {
        return await argon2_1.default.verify(hash, plain);
    }
    catch {
        return false;
    }
}
