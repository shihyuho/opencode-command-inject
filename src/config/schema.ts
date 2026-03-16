import { z } from "zod"

const SourceConfigSchema = z.object({
  enabled: z.boolean().optional(),
  prompt: z.string().optional(),
  prompt_append: z.string().optional(),
})

export const CommandInjectConfigSchema = z.object({
  sources: z
    .object({
      makefile: SourceConfigSchema.optional(),
      "npm-scripts": SourceConfigSchema.optional(),
      skill: SourceConfigSchema.optional(),
    })
    .optional(),
})
