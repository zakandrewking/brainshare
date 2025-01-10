"use client";

import React from "react";

import { toast } from "sonner";
import { mutate } from "swr";

import { createTypeValues } from "@/actions/custom-type-values";
import { suggestCustomType } from "@/actions/suggest-custom-type";
import { MiniLoadingSpinner } from "@/components/mini-loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTableStore } from "@/stores/table-store";
import { createClient } from "@/utils/supabase/client";

export interface CustomTypeContext {
  columnIndex: number;
  columnName: string;
  allValues: string[];
  prefixedId: string;
  initialKind?: "decimal" | "integer" | "enum";
  initialMinValue?: number;
  initialMaxValue?: number;
  initialLogScale?: boolean;
}

interface CustomTypeFormProps {
  context: CustomTypeContext;
  onClose: () => void;
}

export function CustomTypeForm({ context, onClose }: CustomTypeFormProps) {
  const supabase = createClient();

  const [typeName, setTypeName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [kind, setKind] = React.useState<"decimal" | "integer" | "enum">(
    context.initialKind ?? "enum"
  );
  const [minValue, setMinValue] = React.useState<number | undefined>(
    context.initialMinValue
  );
  const [maxValue, setMaxValue] = React.useState<number | undefined>(
    context.initialMaxValue
  );
  const [logScale, setLogScale] = React.useState<boolean>(
    context.initialLogScale ?? false
  );
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { dispatch, actions } = useTableStore();

  const handleGetSuggestions = async () => {
    setIsSuggesting(true);
    try {
      // Get all unique values from the column
      const uniqueSampleValues = Array.from(
        new Set(
          context.allValues.filter(
            (value) => value !== null && value !== undefined && value !== ""
          )
        )
      ).slice(0, 10);

      const suggestions = await suggestCustomType(
        context.columnName,
        uniqueSampleValues,
        kind === "decimal" || kind === "integer"
          ? {
              needsMinMax: minValue === undefined || maxValue === undefined,
              needsLogScale: logScale === undefined,
              kind,
            }
          : undefined
      );
      setTypeName(suggestions.name);
      setDescription(suggestions.description);

      // Only update numeric fields if they're undefined and suggestions exist
      if (suggestions.min_value !== undefined && minValue === undefined) {
        setMinValue(suggestions.min_value);
      }
      if (suggestions.max_value !== undefined && maxValue === undefined) {
        setMaxValue(suggestions.max_value);
      }
      if (suggestions.log_scale !== undefined && logScale === undefined) {
        setLogScale(suggestions.log_scale);
      }
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast.error("Failed to get suggestions");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      // Validate required fields
      if (!typeName || !description) {
        toast.error("Name and description are required");
        return;
      }

      // Create the custom type
      const { data: customType, error: insertError } = await supabase
        .from("custom_type")
        .insert({
          name: typeName,
          description,
          kind,
          user_id: user.id,
          min_value: minValue,
          max_value: maxValue,
          log_scale: logScale,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      // Only store values in Redis for enum types
      if (kind === "enum") {
        await createTypeValues(customType.id, context.allValues);
      }

      //  update the custom types in UI
      await mutate("/custom-types");

      // update the identifications
      dispatch(
        actions.setIdentification(context.columnIndex, {
          type: typeName,
          description,
        })
      );

      toast.success("Custom type created successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to create custom type:", error);
      toast.error("Failed to create custom type");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get suggestions on mount
  React.useEffect(() => {
    handleGetSuggestions();
  }, []);

  const isLoading = isSuggesting || isSubmitting;

  return (
    <div>
      {isLoading && <MiniLoadingSpinner />}
      <h1 className="text-2xl font-bold mb-6">Create a New Custom Type</h1>

      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <h2 className="font-medium mb-2">Column Context</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Creating a custom type for column:{" "}
          <strong>{context.columnName}</strong>
        </p>
        <div className="text-sm text-muted-foreground">
          Sample values:
          <ul className="list-disc list-inside mt-1">
            {context.allValues.slice(0, 3).map((value, i) => (
              <li key={i}>{value}</li>
            ))}
            {context.allValues.length > 3 && (
              <li className="list-none text-muted-foreground italic">
                {context.allValues.length - 3} more values...
              </li>
            )}
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="kind">Type Kind</Label>
          <Select
            value={kind}
            onValueChange={(value: "decimal" | "integer" | "enum") => {
              setKind(value);
              // Reset numeric fields when switching to enum
              if (value === "enum") {
                setMinValue(undefined);
                setMaxValue(undefined);
                setLogScale(false);
              } else if (
                (value === "decimal" || value === "integer") &&
                (minValue === undefined ||
                  maxValue === undefined ||
                  logScale === undefined)
              ) {
                // Get suggestions for numeric fields if they're not set
                handleGetSuggestions();
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type kind" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="enum">
                Enum - List of specific values
              </SelectItem>
              <SelectItem value="decimal">
                Decimal - Floating point numbers
              </SelectItem>
              <SelectItem value="integer">Integer - Whole numbers</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-2">
            {kind === "enum"
              ? "Enum types store a list of allowed values. All values in this column will be matched against this list."
              : kind === "decimal"
              ? "Decimal types ensure values are valid floating point numbers."
              : "Integer types ensure values are valid whole numbers."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="typeName">Type Name</Label>
          <Input
            id="typeName"
            value={typeName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTypeName(e.target.value)
            }
            placeholder="e.g., protein-sequences"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this type represents and when it should be used"
            required
            disabled={isLoading}
          />
        </div>

        {(kind === "decimal" || kind === "integer") && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minValue">Min Value</Label>
                <Input
                  id="minValue"
                  type="number"
                  step={kind === "integer" ? "1" : "any"}
                  value={minValue ?? ""}
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? undefined
                        : kind === "integer"
                        ? Math.round(Number(e.target.value))
                        : Number(e.target.value);
                    setMinValue(value);
                  }}
                  placeholder={"−∞"}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxValue">Max Value</Label>
                <Input
                  id="maxValue"
                  type="number"
                  step={kind === "integer" ? "1" : "any"}
                  value={maxValue ?? ""}
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? undefined
                        : kind === "integer"
                        ? Math.round(Number(e.target.value))
                        : Number(e.target.value);
                    setMaxValue(value);
                  }}
                  placeholder={"∞"}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="logScale"
                checked={logScale}
                onCheckedChange={setLogScale}
                disabled={isLoading}
              />
              <Label htmlFor="logScale">Use logarithmic scale</Label>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGetSuggestions}
            disabled={isLoading}
          >
            {isSuggesting ? "Getting suggestions..." : "Get new suggestions"}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isSubmitting ? "Creating..." : "Create Custom Type"}
          </Button>
        </div>
      </form>
    </div>
  );
}
