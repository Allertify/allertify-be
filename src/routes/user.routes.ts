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
router.get('/me', asyncHandler(getProfile));
router.put('/me', asyncHandler(updateProfile));

// Allergy routes
router.get('/me/allergies', asyncHandler(getUserAllergies));
router.put('/me/allergies', asyncHandler(updateUserAllergies));

// Emergency contact routes
router.get('/me/contacts', asyncHandler(getEmergencyContacts));
router.post('/me/contacts', asyncHandler(createEmergencyContact));
router.put('/me/contacts/:contactId', asyncHandler(updateEmergencyContact));
router.delete('/me/contacts/:contactId', asyncHandler(deleteEmergencyContact));

export default router;

