import { z } from "zod"

const TopLevelCommandNamePrefixConfigSchema = z.object({
  disable: z.boolean().optional(),
}).strict()

const SourceCommandNamePrefixConfigSchema = z.object({
  disable: z.boolean().optional(),
  value: z.string().optional(),
}).strict()

const SourceConfigSchema = z.object({
  disable: z.boolean().optional(),
  prompt: z.string().optional(),
  prompt_append: z.string().optional(),
  command_name_prefix: SourceCommandNamePrefixConfigSchema.optional(),
}).strict()

export const CommandInjectConfigSchema = z.object({
  command_name_prefix: TopLevelCommandNamePrefixConfigSchema.optional(),
  sources: z
    .object({
      makefile: SourceConfigSchema.optional(),
      "npm-scripts": SourceConfigSchema.optional(),
      skill: SourceConfigSchema.optional(),
    })
    .strict()
    .optional(),
}).strict()
