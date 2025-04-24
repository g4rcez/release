import { parseArgs } from "@std/cli/parse-args";
import { css, ErrorFormatter } from "../errors/error-formatter.ts";

type DefaultParsedArgs = { _: string[] };

type Pretty<T> = { [K in keyof T]: T[K] };

type Params = Record<string, any>;

export type CliArgs<T extends Params = Params> = T;

export type CliCommand<T extends Params> = (
  args: CliArgs<
    T & DefaultParsedArgs
  >,
) => Promise<any> | any;

type Arg<T extends string> = T extends `${infer Long}|${infer Short}` ? (Long extends `--${infer Name}` ? Name
  : Short extends `-${infer SName}` ? SName
  : never)
  : never;

type MappedPrimitives = {
  string: string;
  number: number;
};

type NeedDefaultValue<T extends string> = T extends `${string}[${infer Defaults}]${string}`
  ? Defaults extends keyof MappedPrimitives ? MappedPrimitives[Defaults] : "_"
  : "_";

const hasOptional = /\[\w+]/;

type Command<T extends CliArgs> = {
  name: string;
  fn: CliCommand<T>;
  opts?: { description: string };
};

const regex = /(<\w+>|\[\w+])/;

const isStringParam = (s: string) => regex.test(s);

type CommonCommandOpts = Partial<{ description: string }>;

type CommandOpts<T, Optional extends boolean> =
  & CommonCommandOpts
  & (Optional extends true ? { default?: unknown }
    : { default: T });

type ParsedArgs<T> = { arg: string; default: T; applyDefaults: boolean } & CommonCommandOpts;

const CMD_SEPARATOR = ",";

const getLongParser = (text: string) => text.split(CMD_SEPARATOR)[0]?.replace(/^--/g, "");

export class Cli<OwnArgs extends CliArgs, OwnCommands extends Record<string, Command<OwnArgs>>> {
  private options: ParsedArgs<any>[] = [];
  private commands: Command<OwnArgs>[] = [];
  private _version: string;
  private _name: string;
  private _description: string;

  public get description(): string {
    return this._description;
  }

  public set description(value: string) {
    this._description = value;
  }

  public get name(): string {
    return this._name;
  }

  public set name(value: string) {
    this._name = value;
  }

  public get version() {
    return this._version;
  }

  public set version(v: string) {
    this._version = v;
  }

  public constructor(name: string, version?: string, description?: string) {
    this._name = name;
    this._version = version ?? "";
    this._description = description ?? "";
  }

  public option<
    S extends `--${string},${string}${"" | ` [${keyof MappedPrimitives}]` | ` <${keyof MappedPrimitives}>`}`,
    D extends NeedDefaultValue<S>,
  >(
    string: S,
    opts?: CommandOpts<D, D extends "_" ? true : false>,
  ): Cli<OwnArgs & { [key in Arg<S>]: NeedDefaultValue<S> }, OwnCommands> {
    this.options.push({ ...opts, arg: string, default: opts?.default, applyDefaults: hasOptional.test(string) });
    return this as any;
  }

  public command<N extends string, A extends CliArgs>(
    name: N,
    fn: CliCommand<A>,
    opts?: Command<OwnArgs>["opts"],
  ): Cli<OwnArgs, OwnCommands & { [key in N]: any }> {
    this.commands.push({ name, opts, fn: fn as any });
    return this as any;
  }

  public parse(argv: string[]): Pretty<{
    args: OwnArgs & DefaultParsedArgs;
    command?: Command<OwnArgs>;
  }> {
    const types = this.options.reduce((acc, x) => {
      const isString = isStringParam(x.arg);
      if (isString) acc.strings.push(getLongParser(x.arg));
      else acc.booleans.push(getLongParser(x.arg));
      return acc;
    }, { strings: [] as string[], booleans: [] as string[] });
    const defaults = this.options.reduce((acc, el) => {
      const key = getLongParser(el.arg);
      return el.applyDefaults ? { ...acc, [key]: el.default } : acc;
    }, {});
    const aliases = this.options.reduce((acc, el) => {
      const key = getLongParser(el.arg);
      const alias = el.arg.split(CMD_SEPARATOR)[1].split(" ")[0].replace(/^-/g, "");
      return { ...acc, [key]: [alias] };
    }, {});
    const x = parseArgs(argv, { string: types.strings, boolean: types.booleans, default: defaults, alias: aliases });
    if (this.commands.length === 0) {
      return { command: undefined, args: x as any };
    }
    const command = this.commands.find((x) => x.name === argv[0]);
    if (command === undefined) {
      this.help()
      return { command: undefined, args: {} as any }
    }
    return {
      command,
      args: { ...x, _: x._.slice(1) } as any,
    };
  }

  public async run(args: string[]): Promise<boolean> {
    const parse = this.parse(args);
    if (parse.command) {
      try {
        await parse.command.fn(parse.args as any);
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    }
    return false;
  }

  private spaces = (" ").repeat(2);

  public help(error?: unknown) {
    console.log(`%c\r${this.description}`, css`color: blue`);
    console.log(
      `\r\nUsage: ${this.name}${this.commands.length === 0 ? "" : " <command>"}${this.options.length === 0 ? "" : " [options]"}`,
    );
    if (this.commands.length > 0) {
      console.log("\r\n%cCommands", css`text-decoration: underline;font-weight: bold`);
      this.commands.toSorted((a, b) => a.name.localeCompare(b.name)).forEach((x) => {
        console.log(`\r${this.spaces}${x.name}: ${x.opts?.description || "-"}`);
      });
    }
    if (this.options.length > 0) {
      console.log("\r\n%cOptions", css`text-decoration: underline;font-weight: bold`);
      this.options.toSorted((a, b) => a.arg.localeCompare(b.arg)).forEach((x) => {
        const [first, rest] = x.arg.split(CMD_SEPARATOR);
        console.log(`\r${this.spaces}${first}, ${rest.split(" ")[0]}: ${x.description || "-"}`);
      });
    }
    console.log("");
    if (error instanceof ErrorFormatter) error.log();
    if (error instanceof Error) console.error(error);
  }
}
