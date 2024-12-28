"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { suggestCustomType } from "@/actions/suggest-custom-type";
import { MiniLoadingSpinner } from "@/components/mini-loading-spinner";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();
  const [context, setContext] = useState<CustomTypeContext | null>(null);
  const [typeName, setTypeName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [examples, setExamples] = useState("");
  const [notExamples, setNotExamples] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const isLoadingOrSuggesting = isLoading || isSuggesting || !context;

  useEffect(() => {
    // Load the context from localStorage
    const savedContext = localStorage.getItem("custom_type_context");
    if (savedContext) {
      const parsedContext = JSON.parse(savedContext);
      setContext(parsedContext);

      // Automatically get suggestions
      handleGetSuggestions(parsedContext);
    }
  }, []);

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!context) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/custom-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: typeName,
          description,
          rules: rules
            .split("\n")
            .filter(Boolean)
            .map((rule) => rule.replace(/^-\s*/, "")),
          examples: examples
            .split("\n")
            .filter(Boolean)
            .map((ex) => ex.replace(/^-\s*/, "")),
          not_examples: notExamples
            .split("\n")
            .filter(Boolean)
            .map((ex) => ex.replace(/^-\s*/, "")),
          sample_values: context.sampleValues,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create custom type");
      }

      toast.success("Custom type created successfully!");

      // Clear the context from localStorage
      localStorage.removeItem("custom_type_context");

      // Return to the previous page
      router.push(context.returnUrl);
    } catch (error) {
      console.error("Error creating custom type:", error);
      toast.error("Failed to create custom type");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8 relative">
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
            disabled={isLoadingOrSuggesting}
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
            disabled={isLoadingOrSuggesting}
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
    </div>
  );
}
