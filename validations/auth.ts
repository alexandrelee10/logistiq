import { z } from "zod";

export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().regex(/^\+?[\d\s\-\(\)]{7,15}$/, "Invalid phone number"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum([
    "ADMIN",
    "MANAGER",
    "WAREHOUSE_STAFF",
    "PURCHASING",
    "ACCOUNTING",
    "VIEWER",
  ]),
  companyName: z.string().min(1, "Company name is required"),
  
});

export const signinSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});