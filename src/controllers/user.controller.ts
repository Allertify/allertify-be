import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
import asyncHandler from '../middlewares/asyncHandler';

const prisma = new PrismaClient();

// Validation schemas
const updateProfileSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional(),
  phone_number: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  profile_picture_url: Joi.string().uri().optional().allow(null)
});

const updateAllergiesSchema = Joi.object({
  allergies: Joi.array().items(Joi.string().min(1).max(50)).max(20).required()
});

const createContactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone_number: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  relationship: Joi.string().min(2).max(50).required()
});

const updateContactSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone_number: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  relationship: Joi.string().min(2).max(50).optional()
});

/**
 * GET /api/v1/users/me
 * Mendapatkan detail profil pengguna yang sedang login
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      full_name: true,
      phone_number: true,
      profile_picture_url: true,
      is_verified: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: user
  });
});

/**
 * PUT /api/v1/users/me
 * Memperbarui detail profil pengguna
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);
  
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: value,
    select: {
      id: true,
      email: true,
      full_name: true,
      phone_number: true,
      profile_picture_url: true,
      is_verified: true,
      role: true,
      updatedAt: true
    }
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

/**
 * GET /api/v1/users/me/allergies
 * Mendapatkan daftar alergi milik pengguna
 */
export const getUserAllergies = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);

  const allergies = await prisma.user_allergen.findMany({
    where: { user_id: userId },
    include: {
      allergen: {
        select: {
          id: true,
          name: true,
          description: true
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    message: 'User allergies retrieved successfully',
    data: allergies.map(allergy => ({
      id: allergy.id,
      allergen: allergy.allergen,
      security_level: allergy.security_level
    }))
  });
});

/**
 * PUT /api/v1/users/me/allergies
 * Mengatur/memperbarui daftar alergi pengguna
 */
export const updateUserAllergies = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);
  
  const { error, value } = updateAllergiesSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  const { allergies } = value;

  // Start transaction
  await prisma.$transaction(async (tx) => {
    // Remove existing allergies
    await tx.user_allergen.deleteMany({
      where: { user_id: userId }
    });

    // Add new allergies
    if (allergies.length > 0) {
      // First, ensure allergens exist in master data
      for (const allergenName of allergies) {
        await tx.allergen.upsert({
          where: { name: allergenName },
          update: {},
          create: {
            name: allergenName,
            description: `User-defined allergen: ${allergenName}`,
            is_custom: true
          }
        });
      }

      // Get allergen IDs
      const allergenRecords = await tx.allergen.findMany({
        where: { name: { in: allergies } },
        select: { id: true, name: true }
      });

      // Create user allergies
      await tx.user_allergen.createMany({
        data: allergenRecords.map(allergen => ({
          user_id: userId,
          allergen_id: allergen.id,
          security_level: 'MEDIUM' // Default security level
        }))
      });
    }
  });

  res.status(200).json({
    success: true,
    message: 'User allergies updated successfully'
  });
});

/**
 * GET /api/v1/users/me/contacts
 * Mendapatkan daftar kontak darurat
 */
export const getEmergencyContacts = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);

  const contact = await prisma.emergency_contact.findUnique({
    where: { user_id: userId }
  });

  res.status(200).json({
    success: true,
    message: contact ? 'Emergency contact retrieved successfully' : 'No emergency contact found',
    data: contact
  });
});

/**
 * POST /api/v1/users/me/contacts
 * Menambahkan kontak darurat baru
 */
export const createEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);
  
  const { error, value } = createContactSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  // Check if user already has an emergency contact
  const existingContact = await prisma.emergency_contact.findUnique({
    where: { user_id: userId }
  });

  if (existingContact) {
    return res.status(400).json({
      success: false,
      message: 'User already has an emergency contact. Please update the existing one instead.'
    });
  }

  const contact = await prisma.emergency_contact.create({
    data: {
      user_id: userId,
      ...value
    }
  });

  res.status(201).json({
    success: true,
    message: 'Emergency contact created successfully',
    data: contact
  });
});

/**
 * PUT /api/v1/users/me/contacts/:contactId
 * Memperbarui kontak darurat
 */
export const updateEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);
  const contactIdParam = req.params.contactId;
  
  if (!contactIdParam) {
    return res.status(400).json({
      success: false,
      message: 'Contact ID is required'
    });
  }
  
  const contactId = parseInt(contactIdParam);
  
  if (isNaN(contactId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid contact ID'
    });
  }

  const { error, value } = updateContactSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(d => d.message)
    });
  }

  // Check if value is not empty
  if (!value || Object.keys(value).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one field must be provided for update'
    });
  }

  // Check if contact exists and belongs to user
  const existingContact = await prisma.emergency_contact.findFirst({
    where: { 
      id: contactId,
      user_id: userId
    }
  });

  if (!existingContact) {
    return res.status(404).json({
      success: false,
      message: 'Emergency contact not found'
    });
  }

  // Filter out undefined values
  const updateData = Object.fromEntries(
    Object.entries(value).filter(([_, v]) => v !== undefined)
  );

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid data provided for update'
    });
  }

  const updatedContact = await prisma.emergency_contact.update({
    where: { id: contactId },
    data: updateData
  });

  res.status(200).json({
    success: true,
    message: 'Emergency contact updated successfully',
    data: updatedContact
  });
});

/**
 * DELETE /api/v1/users/me/contacts/:contactId
 * Menghapus kontak darurat
 */
export const deleteEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.user!.userId);
  const contactIdParam = req.params.contactId;
  
  if (!contactIdParam) {
    return res.status(400).json({
      success: false,
      message: 'Contact ID is required'
    });
  }
  
  const contactId = parseInt(contactIdParam);
  
  if (isNaN(contactId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid contact ID'
    });
  }

  // Check if contact exists and belongs to user
  const existingContact = await prisma.emergency_contact.findFirst({
    where: { 
      id: contactId,
      user_id: userId 
    }
  });

  if (!existingContact) {
    return res.status(404).json({
      success: false,
      message: 'Emergency contact not found'
    });
  }

  await prisma.emergency_contact.delete({
    where: { id: contactId }
  });

  res.status(200).json({
    success: true,
    message: 'Emergency contact deleted successfully'
  });
});

