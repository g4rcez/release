import { assertEquals } from "jsr:@std/assert";
import { Cli } from "../src/cli/cli.ts";

Deno.test("CLI Parse", () => {
  const cli = new Cli("program", "0.0.0", "description");
  assertEquals(cli.name, "program");
  assertEquals(cli.version, "0.0.0");
  assertEquals(cli.description, "description");

  cli.option("--all,-a <string>", { default: "all" });
  cli.option("--boolean,-b", {});
  cli.option("--false,-f", {});

  const parse = cli.parse(["--all", "things", "--boolean", "b"]);

  assertEquals(parse.args.all, "things");
  assertEquals(parse.args.boolean, true);
  assertEquals(parse.args.false, false);
});
