"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShipmentService = void 0;
const database_1 = require("../../../config/database");
const ApiError_1 = require("../../../shared/errors/ApiError");
const client_1 = require("@prisma/client");
const env_1 = require("../../../config/env");
const provider_1 = require("../provider");
class ShipmentService {
    /**
     * Get all shipments for an order (user must own the order)
     */
    async getOrderShipments(userId, orderId) {
        // Verify order ownership
        const order = await database_1.prisma.order.findUnique({
            where: { id: orderId },
            select: { userId: true }
        });
        if (!order) {
            throw (0, ApiError_1.notFound)('Sipariş bulunamadı');
        }
        if (order.userId !== userId) {
            throw (0, ApiError_1.forbidden)('Bu siparişe erişim yetkiniz yok');
        }
        const shipments = await database_1.prisma.shipment.findMany({
            where: { orderId },
            select: {
                id: true,
                carrierCode: true,
                carrierName: true,
                trackingNumber: true,
                status: true,
                estimatedDeliveryAt: true,
                createdAt: true,
                updatedAt: true,
                lastSyncAt: true
            },
            orderBy: { createdAt: 'asc' }
        });
        return shipments;
    }
    /**
     * Get shipment events (user must own the order)
     */
    async getShipmentEvents(userId, shipmentId) {
        const shipment = await database_1.prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: {
                order: {
                    select: { userId: true, id: true }
                }
            }
        });
        if (!shipment) {
            throw (0, ApiError_1.notFound)('Kargo kaydı bulunamadı');
        }
        if (shipment.order.userId !== userId) {
            throw (0, ApiError_1.forbidden)('Bu kargoya erişim yetkiniz yok');
        }
        const events = await database_1.prisma.shipmentEvent.findMany({
            where: { shipmentId },
            select: {
                id: true,
                occurredAt: true,
                status: true,
                description: true,
                location: true,
                createdAt: true
                // Don't expose raw data and providerEventId to users
            },
            orderBy: { occurredAt: 'desc' }
        });
        return {
            shipment: {
                id: shipment.id,
                status: shipment.status,
                carrierCode: shipment.carrierCode,
                carrierName: shipment.carrierName,
                trackingNumber: shipment.trackingNumber,
                estimatedDeliveryAt: shipment.estimatedDeliveryAt,
                orderId: shipment.order.id
            },
            events
        };
    }
    /**
     * Public tracking endpoint (with rate limiting)
     * SECURITY: Should require email/phone verification or tracking token
     */
    async getShipmentEventsPublic(shipmentId, verificationToken) {
        const shipment = await database_1.prisma.shipment.findUnique({
            where: { id: shipmentId },
            select: {
                id: true,
                status: true,
                carrierCode: true,
                carrierName: true,
                trackingNumber: true,
                estimatedDeliveryAt: true,
                order: {
                    select: {
                        id: true,
                        // Don't expose user info
                    }
                }
            }
        });
        if (!shipment) {
            throw (0, ApiError_1.notFound)('Kargo kaydı bulunamadı');
        }
        // TODO: Implement verification
        // - Generate tracking token when shipment created
        // - Send to customer via email/SMS
        // - Verify token here
        if (verificationToken) {
            // Placeholder for future implementation
            const isValid = await this.verifyTrackingToken(shipmentId, verificationToken);
            if (!isValid) {
                throw (0, ApiError_1.forbidden)('Geçersiz doğrulama kodu');
            }
        }
        const events = await database_1.prisma.shipmentEvent.findMany({
            where: { shipmentId },
            select: {
                id: true,
                occurredAt: true,
                status: true,
                description: true,
                location: true
            },
            orderBy: { occurredAt: 'desc' }
        });
        return {
            shipment: {
                id: shipment.id,
                status: shipment.status,
                carrierCode: shipment.carrierCode,
                carrierName: shipment.carrierName,
                trackingNumber: shipment.trackingNumber,
                estimatedDeliveryAt: shipment.estimatedDeliveryAt
            },
            events
        };
    }
    /**
     * Create and register shipment with carrier
     * Admin only
     */
    async createAndRegisterShipment(params) {
        // Validate carrier against allowed list
        const allowedCarriers = new Set(env_1.env.SHIPMENT_CARRIERS.map(c => c.code));
        if (!allowedCarriers.has(params.carrierCode)) {
            throw (0, ApiError_1.badRequest)(`Desteklenmeyen kargo firması: ${params.carrierCode}. ` +
                `Geçerli kodlar: ${Array.from(allowedCarriers).join(', ')}`);
        }
        // Verify order exists
        const order = await database_1.prisma.order.findUnique({
            where: { id: params.orderId },
            select: { id: true, status: true }
        });
        if (!order) {
            throw (0, ApiError_1.notFound)('Sipariş bulunamadı');
        }
        // Check for duplicate tracking number
        const existing = await database_1.prisma.shipment.findFirst({
            where: {
                carrierCode: params.carrierCode,
                trackingNumber: params.trackingNumber
            }
        });
        if (existing) {
            throw (0, ApiError_1.badRequest)('Bu takip numarası zaten kayıtlı');
        }
        // Create shipment
        const shipment = await database_1.prisma.shipment.create({
            data: {
                orderId: params.orderId,
                carrierCode: params.carrierCode,
                carrierName: params.carrierName,
                trackingNumber: params.trackingNumber,
                status: client_1.ShipmentStatus.created
            }
        });
        // Register with provider (async, don't block response)
        void this.registerWithProvider(shipment.id).catch(err => {
            console.error('[Shipment] Provider registration failed:', err);
        });
        return shipment;
    }
    /**
     * Register shipment with external provider
     */
    async registerWithProvider(shipmentId) {
        const shipment = await database_1.prisma.shipment.findUnique({
            where: { id: shipmentId }
        });
        if (!shipment)
            return;
        try {
            const provider = (0, provider_1.getShipmentProvider)();
            const result = await provider.registerTracking({
                carrierCode: shipment.carrierCode,
                trackingNumber: shipment.trackingNumber,
                orderId: shipment.orderId
            });
            if (result?.externalId) {
                await database_1.prisma.shipment.update({
                    where: { id: shipment.id },
                    data: { externalId: result.externalId }
                });
            }
        }
        catch (err) {
            console.error('[Shipment] Registration error:', err);
            // Don't throw - registration can be retried later
        }
    }
    /**
     * Sync shipment status from provider
     * Admin only
     */
    async syncShipment(shipmentId) {
        const shipment = await database_1.prisma.shipment.findUnique({
            where: { id: shipmentId }
        });
        if (!shipment) {
            throw (0, ApiError_1.notFound)('Kargo kaydı bulunamadı');
        }
        const provider = (0, provider_1.getShipmentProvider)();
        const ref = {
            carrierCode: shipment.carrierCode,
            trackingNumber: shipment.trackingNumber,
            externalId: shipment.externalId
        };
        // Fetch current status and events
        const [statusSnapshot, events] = await Promise.all([
            provider.fetchCurrentStatus(ref).catch(() => null),
            provider.fetchEvents(ref).catch(() => [])
        ]);
        // Update database in transaction
        await database_1.prisma.$transaction(async (tx) => {
            // Update shipment status
            if (statusSnapshot?.status) {
                await tx.shipment.update({
                    where: { id: shipment.id },
                    data: {
                        status: statusSnapshot.status,
                        estimatedDeliveryAt: statusSnapshot.estimatedDeliveryAt || shipment.estimatedDeliveryAt,
                        lastSyncAt: new Date()
                    }
                });
            }
            // Insert new events (use upsert to avoid duplicates)
            if (Array.isArray(events)) {
                for (const event of events) {
                    try {
                        await tx.shipmentEvent.upsert({
                            where: {
                                providerEventId: event.providerEventId || `${shipmentId}-${event.occurredAt.getTime()}`
                            },
                            update: {
                                // Update if provider sends updated data
                                status: event.status,
                                description: event.description,
                                location: event.location
                            },
                            create: {
                                shipmentId: shipment.id,
                                occurredAt: event.occurredAt,
                                status: event.status,
                                description: event.description,
                                location: event.location,
                                raw: event.raw,
                                providerEventId: event.providerEventId || `${shipmentId}-${event.occurredAt.getTime()}`
                            }
                        });
                    }
                    catch (err) {
                        console.error('[Shipment] Event upsert error:', err);
                        // Continue with other events
                    }
                }
            }
        });
        return { success: true, syncedAt: new Date() };
    }
    /**
     * Handle webhook from shipping provider
     */
    async handleWebhook(providerName, req) {
        const provider = (0, provider_1.getShipmentProvider)(providerName);
        // Verify webhook signature
        const isValid = await provider.verifyWebhookSignature(req);
        if (!isValid) {
            console.warn('[Shipment] Invalid webhook signature');
            return false;
        }
        // Parse webhook payload
        const payload = await provider.parseWebhookPayload(req);
        if (!payload) {
            console.warn('[Shipment] Invalid webhook payload');
            return false;
        }
        // Find shipment by external ID or tracking composite
        const shipment = await database_1.prisma.shipment.findFirst({
            where: {
                OR: [
                    { externalId: payload.trackingRef.externalId || '' },
                    {
                        carrierCode: payload.trackingRef.carrierCode,
                        trackingNumber: payload.trackingRef.trackingNumber
                    }
                ]
            }
        });
        if (!shipment) {
            console.warn('[Shipment] Webhook for unknown shipment:', payload.trackingRef);
            return false;
        }
        // Update shipment and events in transaction
        await database_1.prisma.$transaction(async (tx) => {
            // Update shipment status
            if (payload.status) {
                await tx.shipment.update({
                    where: { id: shipment.id },
                    data: {
                        status: payload.status,
                        lastSyncAt: new Date()
                    }
                });
            }
            // Insert new events
            for (const event of payload.events || []) {
                try {
                    await tx.shipmentEvent.upsert({
                        where: {
                            providerEventId: event.providerEventId || `${shipment.id}-${event.occurredAt.getTime()}`
                        },
                        update: {
                            status: event.status,
                            description: event.description,
                            location: event.location
                        },
                        create: {
                            shipmentId: shipment.id,
                            occurredAt: event.occurredAt,
                            status: event.status,
                            description: event.description,
                            location: event.location,
                            raw: event.raw,
                            providerEventId: event.providerEventId || `${shipment.id}-${event.occurredAt.getTime()}`
                        }
                    });
                }
                catch (err) {
                    console.error('[Shipment] Webhook event error:', err);
                }
            }
        });
        // TODO: Send notification to user about status change
        void this.notifyUserAboutUpdate(shipment.id, payload.status);
        return true;
    }
    /**
     * Get list of supported carriers
     */
    getCarriersList() {
        return env_1.env.SHIPMENT_CARRIERS;
    }
    /**
     * Verify tracking token (placeholder for future implementation)
     */
    async verifyTrackingToken(shipmentId, token) {
        // TODO: Implement token verification
        // Option 1: Store hashed token in shipment table
        // Option 2: JWT-based token with shipmentId claim
        // Option 3: Check if token matches order email/phone hash
        // For now, always return true (insecure!)
        console.warn('[Shipment] Token verification not implemented');
        return true;
    }
    /**
     * Notify user about shipment update
     */
    async notifyUserAboutUpdate(shipmentId, newStatus) {
        // TODO: Implement notification
        // - Email notification
        // - SMS notification
        // - In-app notification
        console.log('[Shipment] TODO: Notify user about status change:', { shipmentId, newStatus });
    }
}
exports.ShipmentService = ShipmentService;
