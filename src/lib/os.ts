import { resolve } from "jsr:@std/path";

export const run = async (cwd: string, command: string[]): Promise<string> => {
  const process = new Deno.Command(command[0], {
    cwd,
    stderr: "piped",
    stdout: "piped",
    args: command.slice(1),
  });
  const output = await process.output();
  const error = output.stderr;
  if (output.success) {
    return new TextDecoder().decode(output.stdout).trim();
  }
  const errorString = new TextDecoder().decode(error);
  console.error(errorString.trim());
  throw new Error(errorString);
};

export const getCwd = (cwd?: string) => resolve(cwd || Deno.cwd());
