import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import asyncHandler from '../middlewares/asyncHandler';
import {
  getProfile,
  updateProfile,
  getUserAllergies,
  updateUserAllergies,
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact
} from '../controllers/user.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Profile routes
/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *   put:
 *     tags: [Users]
 *     summary: Update current user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 */
router.get('/me', asyncHandler(getProfile));
router.put('/me', asyncHandler(updateProfile));

// Allergy routes
/**
 * @swagger
 * /api/v1/users/me/allergies:
 *   get:
 *     tags: [Users]
 *     summary: Get user's allergies
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Allergies retrieved
 *   put:
 *     tags: [Users]
 *     summary: Replace user's allergies
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.get('/me/allergies', asyncHandler(getUserAllergies));
router.put('/me/allergies', asyncHandler(updateUserAllergies));

// Emergency contact routes
/**
 * @swagger
 * /api/v1/users/me/contacts:
 *   get:
 *     tags: [Users]
 *     summary: Get user's emergency contacts
 *     security:
 *       - bearerAuth: []
 *   post:
 *     tags: [Users]
 *     summary: Create an emergency contact
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone_number, relationship]
 *             properties:
 *               name: { type: string }
 *               phone_number: { type: string }
 *               relationship: { type: string }
 * /api/v1/users/me/contacts/{contactId}:
 *   put:
 *     tags: [Users]
 *     summary: Update an emergency contact
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema: { type: integer }
 *   delete:
 *     tags: [Users]
 *     summary: Delete an emergency contact
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema: { type: integer }
 */
router.get('/me/contacts', asyncHandler(getEmergencyContacts));
router.post('/me/contacts', asyncHandler(createEmergencyContact));
router.put('/me/contacts/:contactId', asyncHandler(updateEmergencyContact));
router.delete('/me/contacts/:contactId', asyncHandler(deleteEmergencyContact));

export default router;

