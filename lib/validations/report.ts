import { z } from "zod";

export const reportSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter").max(100, "Judul maksimal 100 karakter"),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  report_type: z.enum(["plastic", "waste", "hazardous", "other"], {
    errorMap: () => ({ message: "Jenis sampah tidak valid" }),
  }),
  severity: z.enum(["low", "medium", "high"], {
    errorMap: () => ({ message: "Tingkat urgency tidak valid" }),
  }),
  latitude: z.number({ required_error: "Lokasi wajib dipilih" }),
  longitude: z.number({ required_error: "Lokasi wajib dipilih" }),
  address: z.string().optional(),
  is_anonymous: z.boolean().default(true),
  user_name: z.string().optional(),
  user_email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  user_phone: z.string().optional(),
  image_urls: z.array(z.string().url("URL gambar tidak valid")).max(3, "Maksimal 3 foto"),
});

export type ReportFormData = z.infer<typeof reportSchema>;
