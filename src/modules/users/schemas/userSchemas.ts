import { z } from "zod";

export const USER_SCHEMA = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1).optional().nullable(),
});

export type User = z.infer<typeof USER_SCHEMA>;
