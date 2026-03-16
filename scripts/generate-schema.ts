import { zodToJsonSchema } from "zod-to-json-schema"
import { writeFileSync } from "node:fs"
import { CommandInjectConfigSchema } from "../src/config/schema"

const schema = zodToJsonSchema(CommandInjectConfigSchema, "command-inject")

writeFileSync(
  "command-inject.schema.json",
  JSON.stringify(schema, null, 2)
)

console.log("Generated command-inject.schema.json")
