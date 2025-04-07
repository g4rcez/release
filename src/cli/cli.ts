import { parseArgs } from "@std/cli/parse-args";

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
  ? Defaults extends keyof MappedPrimitives ? MappedPrimitives[Defaults] : never
  : null;

type ParsedArgs<T> = { arg: string; default: T; applyDefaults: boolean };

const hasOptional = /\[\w+]/g;

type Command<T extends CliArgs> = {
  name: string;
  fn: CliCommand<T>;
  opts?: { help: string };
};

export class Cli<OwnArgs extends CliArgs, OwnCommands extends Record<string, Command<OwnArgs>>> {
  private args: ParsedArgs<any>[] = [];
  private commands: Command<OwnArgs>[] = [];

  public constructor(public readonly name: string, public readonly version?: string) {
  }

  public arg<S extends `--${string}|${string}${"" | ` [${keyof MappedPrimitives}]` | ` <${keyof MappedPrimitives}>`}`>(
    string: S,
    opts: { default: NeedDefaultValue<S> },
  ): Cli<OwnArgs & { [key in Arg<S>]: NeedDefaultValue<S> }, OwnCommands> {
    this.args.push({ arg: string, default: opts.default, applyDefaults: hasOptional.test(string) });
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

  public parse(args: string[]): Pretty<{
    args: OwnArgs & DefaultParsedArgs;
    command?: Command<OwnArgs>;
  }> {
    const getLongParser = (text: string) => text.split("|")[0]?.replace(/^--/g, "");
    const strings = this.args.reduce<string[]>((acc, x) => {
      if (x.arg.includes("[") || x.arg.includes("<")) return [...acc, getLongParser(x.arg)];
      return acc;
    }, []);
    const x = parseArgs(args, {
      string: strings,
      boolean: this.args.reduce<string[]>((acc, x) => {
        if (x.arg.includes("[") || x.arg.includes("<")) return acc;
        return [...acc, getLongParser(x.arg)];
      }, []),
      default: this.args.reduce((acc, el) => {
        const key = getLongParser(el.arg);
        return el.applyDefaults ? { ...acc, [key]: el.default } : acc;
      }, {}),
      alias: this.args.reduce((acc, el) => {
        const key = getLongParser(el.arg);
        const alias = el.arg.split("|")[1].split(" ")[0].replace(/^-/g, "");
        return { ...acc, [key]: [alias] };
      }, {}),
    });
    if (this.commands.length === 0) {
      return { command: undefined, args: x as any };
    }
    const command = this.commands.find((x) => x.name === args[0]);
    if (command === undefined) {
      throw new Error(`Command ${command} not found!`);
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
}
