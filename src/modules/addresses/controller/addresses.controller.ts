import { Request, Response } from 'express';
import { AddressService } from '../service/address.service';
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
  setDefaultSchema
} from '../dto/addresses.dto';
import type { CreateAddressDto, UpdateAddressDto } from '../dto/addresses.dto';

const addressService = new AddressService();

/**
 * List user addresses
 * GET /api/v1/addresses
 */
export async function listAddressesController(req: Request, res: Response) {
  const userId = req.user!.id;

  const addresses = await addressService.listAddresses(userId);

  res.status(200).json({ addresses });
}

/**
 * Get single address
 * GET /api/v1/addresses/:id
 */
export async function getAddressController(req: Request, res: Response) {
  const userId = req.user!.id;
  const { id } = addressIdParamSchema.parse(req.params);

  const address = await addressService.getAddress(userId, id);

  res.status(200).json(address);
}

/**
 * Create new address
 * POST /api/v1/addresses
 */
export async function createAddressController(req: Request, res: Response) {
  const userId = req.user!.id;
  const data: CreateAddressDto = createAddressSchema.parse(req.body);

  const address = await addressService.createAddress({
    userId,
    label: data.label,
    fullName: data.fullName,
    phone: data.phone,
    line1: data.line1,
    line2: data.line2,
    city: data.city as unknown as string,
    districtName: data.district, // Changed from district to districtName to match schema
    postalCode: data.postalCode,
    country: data.country,
    isDefault: data.isDefault,
  });

  res.status(201).json(address);
}

/**
 * Update existing address
 * PUT /api/v1/addresses/:id
 */
export async function updateAddressController(req: Request, res: Response) {
  const userId = req.user!.id;
  const { id } = addressIdParamSchema.parse(req.params);
  const data: UpdateAddressDto = updateAddressSchema.parse(req.body);

  const address = await addressService.updateAddress({
    ...data,
    id,
    userId
  });

  res.status(200).json(address);
}

/**
 * Set address as default
 * POST /api/v1/addresses/:id/default
 */
export async function setDefaultAddressController(req: Request, res: Response) {
  const userId = req.user!.id;
  const { id } = addressIdParamSchema.parse(req.params);

  const address = await addressService.setDefault(userId, id);

  res.status(200).json(address);
}

/**
 * Delete address
 * DELETE /api/v1/addresses/:id
 */
export async function deleteAddressController(req: Request, res: Response) {
  const userId = req.user!.id;
  const { id } = addressIdParamSchema.parse(req.params);

  await addressService.deleteAddress(userId, id);

  res.status(204).send();
}

/**
 * Get default address
 * GET /api/v1/addresses/default
 */
export async function getDefaultAddressController(req: Request, res: Response) {
  const userId = req.user!.id;

  const address = await addressService.getDefaultAddress(userId);

  if (!address) {
    return res.status(404).json({
      message: 'Varsayılan adres bulunamadı.'
    });
  }

  res.status(200).json(address);
}