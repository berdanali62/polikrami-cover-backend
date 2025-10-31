"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = require("../../middlewares/validation");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const auth_1 = require("../../middlewares/auth");
const contact_dto_1 = require("./dto/contact.dto");
const contact_controller_1 = require("./controller/contact.controller");
const contactRateLimit_1 = require("./middlewares/contactRateLimit");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Admin middleware
const adminMw = (req, res, next) => {
    void (0, auth_1.requireRole)('admin')(req, res, next);
};
/**
 * @route   POST /api/v1/contact
 * @desc    Submit contact form
 * @access  Public (rate limited)
 * @rateLimit 3 requests per 10 minutes per IP
 */
router.post('/', contactRateLimit_1.contactRateLimit, (0, validation_1.validateBody)(contact_dto_1.contactSchema), (0, asyncHandler_1.asyncHandler)(contact_controller_1.contactController));
/**
 * @route   GET /api/v1/contact/submissions
 * @desc    Get all contact submissions (admin only)
 * @access  Admin
 */
router.get('/submissions', adminMw, (0, validation_1.validateQuery)(zod_1.z.object({
    status: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().default(1),
    limit: zod_1.z.coerce.number().default(20)
})), (0, asyncHandler_1.asyncHandler)(contact_controller_1.getSubmissionsController));
/**
 * @route   PATCH /api/v1/contact/submissions/:id
 * @desc    Update submission status (admin only)
 * @access  Admin
 */
router.patch('/submissions/:id', adminMw, (0, validation_1.validateBody)(zod_1.z.object({
    status: zod_1.z.enum(['pending', 'read', 'replied', 'spam', 'archived']),
    notes: zod_1.z.string().optional()
})), (0, asyncHandler_1.asyncHandler)(contact_controller_1.updateSubmissionController));
exports.default = router;
