import { Cli } from "./cli/cli.ts";
import { latestTagCommand } from "./commands/latest.command.ts";
import { releaseCommand } from "./commands/release.command.ts";
import { gitDateCommand, semverCommand } from "./commands/versioning.command.ts";
import { ErrorFormatter } from "./errors/error-formatter.ts";

async function main() {
  const cli = new Cli("release")
    .arg("--changelog|-c [string]", { default: "CHANGELOG" })
    .arg("--git|-g", { default: null })
    .arg("--cwd|-p [string]", { default: "." })
    .arg("--increment|-i [string]", { default: "" })
    .arg("--decrement|-d [string]", { default: "" })
    .arg("--length|-l [number]", { default: 6 })
    .command("changelog", releaseCommand)
    .command("release", releaseCommand)
    .command("semver", semverCommand)
    .command("gitdate", gitDateCommand)
    .command("tag", latestTagCommand);
  const parse = cli.parse(Deno.args);
  try {
    await parse.command?.fn(parse.args);
    Deno.exit(0);
  } catch (error) {
    if (error instanceof ErrorFormatter) error.log();
    Deno.exit(1);
  }
}

main();
