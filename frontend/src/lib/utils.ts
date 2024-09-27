import { ClassValue, clsx } from "clsx";
import { customAlphabet } from "nanoid";
import { twMerge } from "tailwind-merge";

export const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7
); // 7-character random string

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
