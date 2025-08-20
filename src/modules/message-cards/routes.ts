import { Router } from 'express';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { listMessageCardsController } from './controller/messageCard.controller';

const router = Router();

router.get('/', asyncHandler(listMessageCardsController));

export default router;


