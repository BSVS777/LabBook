import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt only considers the first 72 bytes of a password. */
export const PASSWORD_MAX_LENGTH = 72;
export const NAME_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 254;

export const userRoleSchema = z.enum(['student', 'admin']);

const emailSchema = z.string().trim().max(EMAIL_MAX_LENGTH).pipe(z.email());

export const registerBodySchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(1).max(NAME_MAX_LENGTH),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: userRoleSchema,
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type UserDto = z.infer<typeof userDtoSchema>;
