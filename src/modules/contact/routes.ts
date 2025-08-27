import { Router } from 'express';
import { validateBody } from '../../middlewares/validation';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { contactSchema } from './dto/contact.dto';
import { contactController } from './controller/contact.controller';

const router = Router();

router.post('/', validateBody(contactSchema), asyncHandler(contactController));

export default router;


