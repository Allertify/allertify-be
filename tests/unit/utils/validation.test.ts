import Joi from 'joi';
import { formatJoiError, validateRequest } from '../../../src/utils/validation';

describe('Validation Utils', () => {
  describe('formatJoiError', () => {
    it('should format Joi validation error correctly', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        age: Joi.number().min(18).required()
      });

      const { error } = schema.validate({
        email: 'invalid-email',
        password: '123',
        age: 15
      }, { abortEarly: false });

      const formattedErrors = formatJoiError(error!);

      expect(formattedErrors).toHaveLength(3);
      expect(formattedErrors[0]).toEqual({
        field: 'email',
        message: expect.stringContaining('valid email')
      });
      expect(formattedErrors[1]).toEqual({
        field: 'password',
        message: expect.stringContaining('at least 8 characters')
      });
      expect(formattedErrors[2]).toEqual({
        field: 'age',
        message: expect.stringContaining('greater than or equal to 18')
      });
    });

    it('should handle nested field paths', () => {
      const schema = Joi.object({
        user: Joi.object({
          profile: Joi.object({
            name: Joi.string().required()
          }).required()
        }).required()
      });

      const { error } = schema.validate({
        user: {
          profile: {}
        }
      });

      const formattedErrors = formatJoiError(error!);

      expect(formattedErrors[0]).toEqual({
        field: 'user.profile.name',
        message: expect.stringContaining('required')
      });
    });
  });

  describe('validateRequest', () => {
    const testSchema = Joi.object({
      name: Joi.string().min(2).required(),
      email: Joi.string().email().required(),
      age: Joi.number().min(18).optional()
    }).unknown(true);

    it('should return valid result for correct data', () => {
      const testData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        extraField: 'should be stripped'
      };

      const result = validateRequest(testSchema, testData);

      expect(result.isValid).toBe(true);
      expect(result.value).toEqual(expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      }));
      expect(result.errors).toBeUndefined();
    });

    it('should return invalid result with errors for incorrect data', () => {
      const testData = {
        name: 'J',
        email: 'invalid-email',
        age: 15
      };

      const result = validateRequest(testSchema, testData);

      expect(result.isValid).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.errors).toHaveLength(3);
      expect(result.errors![0].field).toBe('name');
      expect(result.errors![1].field).toBe('email');
      expect(result.errors![2].field).toBe('age');
    });

    it('should handle missing required fields', () => {
      const testData = {
        age: 25
      };

      const result = validateRequest(testSchema, testData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors!.find(e => e.field === 'name')).toBeDefined();
      expect(result.errors!.find(e => e.field === 'email')).toBeDefined();
    });

    it('should use custom validation options', () => {
      const testData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        extraField: 'should be kept'
      };

      const result = validateRequest(testSchema, testData, { stripUnknown: false });

      if (!result.isValid) {
        console.log('Validation errors:', result.errors);
      }

      expect(result.isValid).toBe(true);
      expect(result.value).toEqual(expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        extraField: 'should be kept'
      }));
    });

    it('should stop at first error when abortEarly is true', () => {
      const testData = {
        name: 'J',
        email: 'invalid-email'
      };

      const result = validateRequest(testSchema, testData, { abortEarly: true });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
});
