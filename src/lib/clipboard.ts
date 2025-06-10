import { run } from "./os.ts";

export async function copyToClipboard(text: string) {
  const platform = Deno.build.os;
  let command: string[] = [];
  if (platform === "darwin") {
    command = ["echo", text, "|", "pbcopy"];
  } else if (platform === "windows") {
    command = ["echo", text, "|", "clip"];
  } else if (platform === "linux") {
    command = ["echo", text, "|", "xclip", "-selection", "clipboard"];
  } else {
    throw new Error("Unsupported platform");
  }
  await run(Deno.cwd(), command);
}
