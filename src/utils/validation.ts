import Joi from 'joi';
import { FieldError } from './response';

/**
 * Format Joi validation error to standardized field error format
 */
export const formatJoiError = (error: Joi.ValidationError): FieldError[] => {
  return error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message
  }));
};

/**
 * Validate request data with Joi schema and return formatted errors
 */
export const validateRequest = <T>(
  schema: Joi.ObjectSchema<T>,
  data: any,
  options: Joi.ValidationOptions = { abortEarly: false, stripUnknown: true }
): { isValid: boolean; value?: T; errors?: FieldError[] } => {
  const { error, value } = schema.validate(data, options);
  
  if (error) {
    return {
      isValid: false,
      errors: formatJoiError(error)
    };
  }

  return {
    isValid: true,
    value
  };
};
