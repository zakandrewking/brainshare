"use client";

import React from "react";

import { toast } from "sonner";
import { mutate } from "swr";

import { suggestCustomType } from "@/actions/suggest-custom-type";
import { MiniLoadingSpinner } from "@/components/mini-loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTableStore } from "@/stores/table-store";
import createClient from "@/utils/supabase/client";

export interface CustomTypeContext {
  columnIndex: number;
  columnName: string;
  sampleValues: string[];
  prefixedId: string;
}

interface CustomTypeFormProps {
  context: CustomTypeContext;
  onClose: () => void;
}

export function CustomTypeForm({ context, onClose }: CustomTypeFormProps) {
  const supabase = createClient();

  const [typeName, setTypeName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [rules, setRules] = React.useState("");
  const [examples, setExamples] = React.useState("");
  const [notExamples, setNotExamples] = React.useState("");
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { dispatch, actions } = useTableStore();

  const handleGetSuggestions = async () => {
    setIsSuggesting(true);
    try {
      const suggestions = await suggestCustomType(
        context.columnName,
        context.sampleValues
      );
      setTypeName(suggestions.name);
      setDescription(suggestions.description);
      setRules(suggestions.rules.map((rule) => `- ${rule}`).join("\n"));
      setExamples(suggestions.examples.map((ex) => `- ${ex}`).join("\n"));
      setNotExamples(
        suggestions.not_examples.map((ex) => `- ${ex}`).join("\n")
      );
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

      // Transform form data
      const transformedRules = rules
        .split("\n")
        .filter(Boolean)
        .map((rule) => rule.replace(/^-\s*/, ""));
      const transformedExamples = examples
        .split("\n")
        .filter(Boolean)
        .map((ex) => ex.replace(/^-\s*/, ""));
      const transformedNotExamples = notExamples
        .split("\n")
        .filter(Boolean)
        .map((ex) => ex.replace(/^-\s*/, ""));

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
          rules: transformedRules,
          examples: transformedExamples,
          not_examples: transformedNotExamples,
          sample_values: context.sampleValues,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error("A custom type with this name already exists");
        }
        throw insertError;
      }

      await mutate("/custom-types");

      //   update the identifications
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
            {context.sampleValues.map((value, i) => (
              <li key={i}>{value}</li>
            ))}
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="space-y-2">
          <Label htmlFor="rules">Validation Rules</Label>
          <Textarea
            id="rules"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Enter each validation rule on a new line"
            required
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            Enter each rule on a new line
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="examples">Valid Examples</Label>
          <Textarea
            id="examples"
            value={examples}
            onChange={(e) => {
              const uniqueExamples = Array.from(
                new Set(
                  e.target.value
                    .split("\n")
                    .filter(Boolean)
                    .map((ex) => {
                      // If line doesn't start with a dash, add one
                      return ex.trim().startsWith("-")
                        ? ex.trim()
                        : `- ${ex.trim()}`;
                    })
                )
              ).join("\n");
              setExamples(uniqueExamples);
            }}
            placeholder="Enter each valid example on a new line"
            required
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            Enter each example on a new line. Duplicates will be automatically
            removed.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notExamples">Invalid Examples</Label>
          <Textarea
            id="notExamples"
            value={notExamples}
            onChange={(e) => {
              const uniqueNotExamples = Array.from(
                new Set(
                  e.target.value
                    .split("\n")
                    .filter(Boolean)
                    .map((ex) => {
                      // If line doesn't start with a dash, add one
                      return ex.trim().startsWith("-")
                        ? ex.trim()
                        : `- ${ex.trim()}`;
                    })
                )
              ).join("\n");
              setNotExamples(uniqueNotExamples);
            }}
            placeholder="Enter each invalid example on a new line"
            required
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            Enter each example on a new line. Duplicates will be automatically
            removed.
          </p>
        </div>

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
