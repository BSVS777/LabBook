import { z } from 'zod';

export const labDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  capacity: z.number().int().positive(),
});

export const labListResponseSchema = z.object({ labs: z.array(labDtoSchema) });

export type LabDto = z.infer<typeof labDtoSchema>;
export type LabListResponse = z.infer<typeof labListResponseSchema>;
