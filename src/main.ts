import { Cli } from "./cli/cli.ts";
import { latestTagCommand } from "./commands/latest.command.ts";
import { releaseCommand } from "./commands/release.command.ts";

async function main() {
  const cli = new Cli(
    "release",
    "v0.0.0",
    "ReleaseCLI: release process simplified!",
  )
    .option("--changelog,-c [string]", {
      default: "CHANGELOG",
      description: "Path to changelog file",
    })
    .option("--increment,-i [string]", {
      default: "",
      description: "Increment semver tag using the release types",
    })
    .option("--length,-l [number]", {
      description: "Length of hash commit",
      default: 7,
    })
    .option("--with,-w [string]", {
      description: "Tag versioning: gitdate|semver",
      default: "gitdate",
    })
    .command("new", releaseCommand, {
      description:
        "Generate changelog file and publish release (alias for deploy)",
    })
    .command("tag", latestTagCommand, {
      description: "Get the latest tag of a git repository",
    });
  try {
    const parse = cli.parse(Deno.args);
    await parse.command?.fn(parse.args);
  } catch (error) {
    cli.help(error);
    throw error;
  }
}

main()
  .then(() => Deno.exit(0))
  .catch(() => Deno.exit(1));
