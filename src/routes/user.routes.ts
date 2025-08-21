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
 *     summary: Get user's emergency contact
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Emergency contact retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Emergency contact retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/EmergencyContact'
 *       200:
 *         description: No emergency contact found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "No emergency contact found"
 *                 data:
 *                   type: null
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
 *               name: 
 *                 type: string
 *                 description: Contact name
 *                 example: "John Doe"
 *               phone_number: 
 *                 type: string
 *                 description: Contact phone number
 *                 example: "+6281234567890"
 *               relationship: 
 *                 type: string
 *                 description: Relationship with user
 *                 example: "Father"
 *     responses:
 *       201:
 *         description: Emergency contact created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Emergency contact created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/EmergencyContact'
 *       400:
 *         description: Validation error or user already has emergency contact
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: 
 *                 type: string
 *                 description: Contact name
 *               phone_number: 
 *                 type: string
 *                 description: Contact phone number
 *               relationship: 
 *                 type: string
 *                 description: Relationship with user
 *     responses:
 *       200:
 *         description: Emergency contact updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Emergency contact updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/EmergencyContact'
 *       400:
 *         description: Validation error or no data provided
 *       404:
 *         description: Emergency contact not found
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
 *     responses:
 *       200:
 *         description: Emergency contact deleted successfully
 *       404:
 *         description: Emergency contact not found
 */
router.get('/me/contacts', asyncHandler(getEmergencyContacts));
router.post('/me/contacts', asyncHandler(createEmergencyContact));
router.put('/me/contacts/:contactId', asyncHandler(updateEmergencyContact));
router.delete('/me/contacts/:contactId', asyncHandler(deleteEmergencyContact));

export default router;

