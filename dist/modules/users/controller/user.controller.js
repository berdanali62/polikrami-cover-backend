"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meController = meController;
exports.updateProfileController = updateProfileController;
exports.changePasswordController = changePasswordController;
exports.sendPhoneCodeController = sendPhoneCodeController;
exports.verifyPhoneCodeController = verifyPhoneCodeController;
exports.firebasePhoneVerifyController = firebasePhoneVerifyController;
const user_service_1 = require("../service/user.service");
const password_dto_1 = require("../dto/password.dto");
const phone_verification_dto_1 = require("../dto/phone-verification.dto");
const userVerification_service_1 = require("../service/userVerification.service");
const phone_verification_dto_2 = require("../dto/phone-verification.dto");
const admin_1 = require("../../../shared/firebase/admin");
const database_1 = require("../../../config/database");
const env_1 = require("../../../config/env");
const service = new user_service_1.UserService();
const verifyService = new userVerification_service_1.UserVerificationService();
async function meController(req, res) {
    const userId = req.user?.id;
    const me = await service.me(userId);
    res.status(200).json({ success: true, data: me });
}
async function updateProfileController(req, res) {
    const userId = req.user?.id;
    const updated = await service.updateProfile(userId, req.body);
    res.status(200).json({ success: true, data: updated });
}
async function changePasswordController(req, res) {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = password_dto_1.changePasswordSchema.parse(req.body);
    const result = await service.changePassword(userId, currentPassword, newPassword);
    if (!result.ok)
        return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: result.message } });
    res.status(200).json({ success: true });
}
async function sendPhoneCodeController(req, res) {
    const userId = req.user?.id;
    const { phone } = phone_verification_dto_1.sendPhoneCodeSchema.parse(req.body);
    await verifyService.sendPhoneCode(userId, phone);
    res.status(200).json({ success: true });
}
async function verifyPhoneCodeController(req, res) {
    const userId = req.user?.id;
    const { phone, code } = phone_verification_dto_1.verifyPhoneCodeSchema.parse(req.body);
    const ok = await verifyService.verifyPhoneCode(userId, phone, code);
    if (!ok)
        return res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid or expired code' } });
    res.status(200).json({ success: true });
}
async function firebasePhoneVerifyController(req, res) {
    if (env_1.env.PHONE_VERIFY_PROVIDER !== 'firebase')
        return res.status(400).json({ success: false, error: { code: 'PROVIDER_DISABLED', message: 'Firebase provider disabled' } });
    const userId = req.user?.id;
    const { idToken } = phone_verification_dto_2.firebaseVerifySchema.parse(req.body);
    const decoded = await (0, admin_1.verifyFirebaseIdToken)(idToken);
    if (!decoded || !decoded.phoneNumber)
        return res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid Firebase token' } });
    await database_1.prisma.userProfile.upsert({
        where: { userId },
        update: { phone: decoded.phoneNumber, phoneVerifiedAt: new Date() },
        create: { userId, phone: decoded.phoneNumber, phoneVerifiedAt: new Date() },
    });
    res.status(200).json({ success: true, data: { phone: decoded.phoneNumber } });
}
