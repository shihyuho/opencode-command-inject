# Example: Make + npm Commands

## Input files

`Makefile`

```makefile
build: ## Build app
test:
```

`package.json`

```json
{
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run"
  }
}
```

## Generated commands

- `make:build` -> `make build $ARGUMENTS` (description: `Build app`)
- `make:test` -> `make test $ARGUMENTS` (description: `test`)
- `npm:lint` -> `npm run lint -- $ARGUMENTS`
- `npm:test` -> `npm run test -- $ARGUMENTS`
