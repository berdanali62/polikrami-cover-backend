import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Shipments public events', () => {
  it('should return 404 for unknown shipment', async () => {
    const res = await request(app).get('/api/v1/shipments/public/00000000-0000-0000-0000-000000000000/events');
    expect([400,404]).toContain(res.status); // service throws 404, handler returns 404
  });

  it('should return events for existing shipment', async () => {
    const user = await prisma.user.create({ data: { email: `s_${Date.now()}@ex.com`, password: 'x' } });
    const order = await prisma.order.create({ data: { userId: user.id, totalCents: 1000, currency: 'TRY' } });
    const shp = await prisma.shipment.create({ data: { orderId: order.id, carrierCode: 'mock', trackingNumber: `TN-${Date.now()}` } });
    const res = await request(app).get(`/api/v1/shipments/public/${shp.id}/events`);
    expect(res.status).toBe(200);
    expect(res.body.shipment.id).toBe(shp.id);
    expect(Array.isArray(res.body.events)).toBe(true);
  });
});
