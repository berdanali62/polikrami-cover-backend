import { Router } from 'express';
import { asyncHandler } from '../../shared/helpers/asyncHandler';
import { listMessageCardsController, popularMessageCardsController } from './controller/messageCard.controller';

const router = Router();

router.get('/', asyncHandler(listMessageCardsController));
router.get('/popular', asyncHandler(popularMessageCardsController));

export default router;


