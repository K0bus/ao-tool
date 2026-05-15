# Development Guidelines

## Coding Standards

- **TypeScript**: Mandatory for all new code. Avoid `any`.
- **Formatting**: Two-space indentation, single quotes, no semicolons.
- **Vue**: Use `<script setup>` and Composition API.
- **API**: Use Nitro routes in `server/api/v1/`.

## Command Reference

| Command | Description |
| :--- | :--- |
| `pnpm install` | Install all workspace dependencies |
| `pnpm dev` | Start development server |
| `pnpm build` | Build all packages and apps |
| `pnpm typecheck` | Run TypeScript validation |
| `pnpm test` | Run Vitest suite |
| `pnpm lint` | Run ESLint check |
| `pnpm db:studio` | Open Prisma Studio |

## Testing

We use **Vitest** for unit and integration testing.

- Tests are located in `__tests__` directories within each package.
- Run tests: `pnpm test`
- Coverage report: `pnpm test:coverage`

## Pull Request Guidelines

1. **Atomic Commits**: Keep changes focused.
2. **Type Safety**: Ensure `pnpm typecheck` passes.
3. **Documentation**: Update relevant docs if architecture or setup changes.
