export abstract class Strings {
  static padDate = (str: string | number) => str.toString().padStart(2, "0");
}
