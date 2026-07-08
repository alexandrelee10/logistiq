import { z } from "zod";

export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]{7,15}$/, "Invalid phone number"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum([
    "DRIVER",
    "BROKER",
    "DRIVERLEADER",
    "MAINTENANCE",
    "DISPATCH",
    "FLEET",
    "COMPLIANCE",
    "ACCOUNTING",
  ]),
});