import { z } from 'zod';

export const createShipmentSchema = z.object({
  carrierCode: z.string().min(2),
  carrierName: z.string().optional(),
  trackingNumber: z.string().min(3),
});


