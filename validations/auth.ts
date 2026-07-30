import { z } from "zod";

// Note: there is no `role` field here anymore. An org creator is always the
// first admin of their new organization — letting them self-select a role
// (including low-privilege ones like VIEWER) allowed people to lock
// themselves out of their own org. See docs/product/logistiq-audit.md #3.
export const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]{7,15}$/, "Invalid phone number"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    companyName: z.string().min(1, "Company name is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const signinSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// Used by the "join an organization" path (accept-invite). Role and email
// come from the Invite record, not user input.
export const acceptInviteSchema = z
  .object({
    token: z.string().min(1, "Invite token is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]{7,15}$/, "Invalid phone number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });