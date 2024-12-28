"use client";

import React from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mutate } from "swr";

import { createCustomType } from "@/actions/custom-type";
import { suggestCustomType } from "@/actions/suggest-custom-type";
import { MiniLoadingSpinner } from "@/components/mini-loading-spinner";
import { Button } from "@/components/ui/button";
import Container from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CustomTypeContext {
  columnIndex: number;
  columnName: string;
  sampleValues: string[];
  returnUrl: string;
}

export default function NewCustomTypePage() {
  const [context, setContext] = React.useState<CustomTypeContext | null>(null);
  const [typeName, setTypeName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [rules, setRules] = React.useState("");
  const [examples, setExamples] = React.useState("");
  const [notExamples, setNotExamples] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [stateCreateCustomType, formActionCreateCustomType] =
    React.useActionState(createCustomType, { error: null });

  const router = useRouter();

  const isLoadingOrSuggesting = isLoading || isSuggesting;

  const handleGetSuggestions = async (ctx: CustomTypeContext) => {
    setIsSuggesting(true);
    try {
      const suggestions = await suggestCustomType(
        ctx.columnName,
        ctx.sampleValues
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
      mutate("/custom-types");
    }
  };

  // Load the context from localStorage on mount
  React.useEffect(() => {
    const savedContext = localStorage.getItem("custom_type_context");
    if (savedContext) {
      const parsedContext = JSON.parse(savedContext);
      setContext(parsedContext);
      // Automatically get suggestions
      handleGetSuggestions(parsedContext);
    } else {
      toast.error("No context found");
    }
    setIsLoading(false);
  }, []);

  // Show error toast
  React.useEffect(() => {
    if (stateCreateCustomType.error) {
      toast.error(stateCreateCustomType.error);
    }
  }, [stateCreateCustomType.error]);

  // Clear the context when the page is unmounted
  React.useEffect(() => {
    return () => {
      localStorage.removeItem("custom_type_context");
    };
  }, []);

  return (
    <Container>
      {isLoadingOrSuggesting && <MiniLoadingSpinner />}
      <h1 className="text-2xl font-bold mb-6">Create a New Custom Type</h1>

      <div className="bg-muted/50 p-4 rounded-lg mb-6">
        <h2 className="font-medium mb-2">Column Context</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Creating a custom type for column:{" "}
          <strong>{context?.columnName}</strong>
        </p>
        <div className="text-sm text-muted-foreground">
          Sample values:
          <ul className="list-disc list-inside mt-1">
            {context?.sampleValues.map((value, i) => (
              <li key={i}>{value}</li>
            ))}
          </ul>
        </div>
      </div>

      <form action={formActionCreateCustomType} className="space-y-6">
        <input
          type="hidden"
          name="columnInfo"
          value={JSON.stringify(context)}
        />

        <div className="space-y-2">
          <Label htmlFor="typeName">Type Name</Label>
          <Input
            id="typeName"
            name="name"
            value={typeName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTypeName(e.target.value)
            }
            placeholder="e.g., protein-sequences"
            required
            disabled={isLoadingOrSuggesting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this type represents and when it should be used"
            required
            disabled={isLoadingOrSuggesting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rules">Validation Rules</Label>
          <Textarea
            id="rules"
            name="rules"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Enter each validation rule on a new line"
            required
            disabled={isLoadingOrSuggesting}
          />
          <p className="text-sm text-muted-foreground">
            Enter each rule on a new line
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="examples">Valid Examples</Label>
          <Textarea
            id="examples"
            name="examples"
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
            disabled={isLoadingOrSuggesting}
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
            name="not_examples"
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
            disabled={isLoadingOrSuggesting}
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
            onClick={() => {
              localStorage.removeItem("custom_type_context");
              router.push(context!.returnUrl);
            }}
            disabled={isLoadingOrSuggesting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleGetSuggestions(context!)}
            disabled={isLoadingOrSuggesting}
          >
            {isSuggesting ? "Getting suggestions..." : "Get new suggestions"}
          </Button>
          <Button type="submit" disabled={isLoadingOrSuggesting}>
            {isLoading ? "Creating..." : "Create Custom Type"}
          </Button>
        </div>
      </form>

      {stateCreateCustomType.error && <p>{stateCreateCustomType.error}</p>}
    </Container>
  );
}
