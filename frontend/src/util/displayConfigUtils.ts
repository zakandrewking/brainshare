import displayConfig from "../displayConfig";
import { Database } from "../database.types";

export type TableName = typeof displayConfig.topLevelResources[number] &
  keyof Database["public"]["Tables"];

// `T extends any` is a trick to use distributive conditional types on T if T is
// a union
type GetResult<T extends Object, K extends string, U> = T extends any
  ? K extends keyof T
    ? T[K]
    : U
  : U;
export function get<T extends Object, K extends string, U>(
  obj: T,
  key: K,
  def: U
): GetResult<T, K, U> {
  if (obj.hasOwnProperty(key)) {
    return (obj as any)[key as any] as GetResult<T, K, U>;
  } else {
    return def as GetResult<T, K, U>;
  }
}

type propertyDefinitionKeys = keyof typeof displayConfig["propertyDefinitions"];

interface EntryObject {
  property: propertyDefinitionKeys;
  propertyKey?: string;
}

type NormalizedObject = {
  property: propertyDefinitionKeys;
  propertyKey: string;
};

type NormalizedEntry<T extends string | EntryObject> = T extends string
  ? NormalizedObject
  : NormalizedObject & T;

/**
 * Add the required fields for an entry in listProperties or detailProperties
 */
export function normalizeEntry<T extends string | EntryObject>(
  entryRaw: T
): NormalizedEntry<T> {
  const [property, propertyKey, entryVals] =
    typeof entryRaw === "string"
      ? [entryRaw, entryRaw, {}]
      : [
          entryRaw.property,
          entryRaw.propertyKey || entryRaw.property,
          entryRaw,
        ];
  return {
    ...entryVals,
    property,
    propertyKey,
  } as NormalizedEntry<T>;
}
