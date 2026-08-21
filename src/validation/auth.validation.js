import zod from "zod"

export const registerSchema = z.object({
  name: z.string().required("name is required").trim().min(2).max(50),
  lastname: z.string().trim().min(2).max(50),
  username: z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9_]+$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(12, "minimumof 12 characters").max(128)
}).strict();

