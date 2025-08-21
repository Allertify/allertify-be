import Joi from "joi";

export const registerSchema = Joi.object({
    full_name: Joi.string().trim().min(3).max(100).required(),
    email: Joi.string().trim().lowercase().email().max(100).required(),
    password: Joi.string()
        .min(8)
        .max(255)
        .pattern(/[a-z]/) //lowcase
        .pattern(/[A-Z]/) //upcase
        .pattern(/[0-9]/) //number
        .required(),
    phone_number: Joi.string().trim().pattern(/[0-9+\-]{8,20}$/).required()
})

export const otpSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().max(100).required(),
    otp: Joi.string().length(6).pattern(/^\d{6}$/).required(),
})

export const loginSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().max(100).required(),
    password: Joi.string().min(8).max(255).required(),
});

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().max(100).required(),
});

export const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string()
        .min(8)
        .max(255)
        .pattern(/[a-z]/) //lowercase
        .pattern(/[A-Z]/) //uppercase
        .pattern(/[0-9]/) //number
        .required(),
});