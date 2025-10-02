
import { z } from 'zod';

// For Employee Master Data
export const employeeSchema = (t: (key: string, options?: any) => string) => z.object({
  employeeId: z.string().min(1, t('validation.required', { field: t('pages.settings.employees.dialog_form_label_id') })),
  name: z.string().min(1, t('validation.required', { field: t('pages.settings.employees.dialog_form_label_name') })),
  email: z.string().email(t('validation.invalid_email')).min(1, t('validation.required', { field: t('pages.settings.employees.dialog_form_label_email') })),
  department: z.string().optional(),
  location: z.string().optional(),
  projects: z.array(z.string()).optional(),
});
export type EmployeeFormValues = z.infer<ReturnType<typeof employeeSchema>>;
export type Employee = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department?: string;
  location?: string;
  projects?: string[];
};

// For System Users (connected to Firebase Auth)
export const systemUserSchema = z.object({
  uid: z.string(),
  displayName: z.string(),
  email: z.string().email(),
  photoURL: z.string().url().optional(),
  role: z.enum(['Admin', 'Member']),
  lastLogin: z.any(), // Can be Firestore Timestamp
});
export type SystemUser = z.infer<typeof systemUserSchema> & { id: string };

// For Database Users (from Laravel users table)
export const databaseUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  email_verified_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DatabaseUser = z.infer<typeof databaseUserSchema>;


// For Custom Asset Fields
export const assetFieldSchema = z.object({
  id: z.string(),
  systemName: z.string(),
  displayName: z.string().min(1, "Display Name is required."),
  dataType: z.enum(["Text", "Number", "Date"]),
  visible: z.boolean(),
  notes: z.string().optional().nullable(),
  order: z.number(),
});

export const assetFieldsUpdateSchema = z.array(assetFieldSchema);

export type AssetField = z.infer<typeof assetFieldSchema>;
