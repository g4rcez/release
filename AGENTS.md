# Agent Instructions for Release CLI

## Build/Lint/Test Commands

- **Build**: `deno task build` - Compiles to binary executable
- **Test all**: `deno test`
- **Test single**: `deno test tests/<filename>.ts`
- **Format**: `deno fmt` - Uses 2 spaces, line width 150
- **Lint**: `deno lint` - Built-in Deno linting
- **Check**: `deno check src/main.ts` - Type checking

## Code Style Guidelines

### General

- **Language**: TypeScript with Deno runtime
- **Imports**: Use JSR imports (`jsr:@std/*`) for standard library
- **Formatting**: 2 spaces, no tabs, line width 150
- **Semicolons**: Omit semicolons (Deno style)
- **Async**: Use async/await for asynchronous operations

### Types and Interfaces

- Use complex TypeScript generics and mapped types
- Define clear interfaces for CLI args and commands
- Use branded types for type safety (e.g., `type CliArgs<T>`)

### Error Handling

- Use try/catch blocks in main functions
- Create custom error classes extending Error
- Use ErrorFormatter for CLI error display
- Exit with appropriate codes (0 for success, 1 for error)

### CLI Patterns

- Command pattern with functional command handlers
- Option parsing with defaults and aliases
- Help generation with descriptions
- Validation and error reporting

### Naming Conventions

- **Files**: kebab-case (e.g., `latest.command.ts`)
- **Classes**: PascalCase (e.g., `Cli`, `ErrorFormatter`)
- **Functions**: camelCase (e.g., `parseArgs`, `getLongParser`)
- **Variables**: camelCase (e.g., `cliArgs`, `commandName`)
- **Types**: PascalCase (e.g., `CliArgs`, `CommandOpts`)

### Architecture

- CLI class handles argument parsing and command routing
- Separate command files for different functionalities
- Library utilities in `lib/` directory
- Error handling centralized in `errors/` directory
