import displayConfig from "../displayConfig";

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
