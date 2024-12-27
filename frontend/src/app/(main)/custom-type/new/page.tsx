"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

  useEffect(() => {
    // Load the context from localStorage
    const savedContext = localStorage.getItem("custom_type_context");
    if (savedContext) {
      setContext(JSON.parse(savedContext));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!context) return;

    setIsLoading(true);
    try {
      // TODO: Add API endpoint to save the custom type
      const response = await fetch("/api/custom-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: typeName,
          description,
          rules: rules.split("\n").filter(Boolean),
          examples: examples.split("\n").filter(Boolean),
          not_examples: notExamples.split("\n").filter(Boolean),
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

  if (!context) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container max-w-2xl py-8">
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
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            placeholder="Describe what this type represents and its format"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rules">Validation Rules</Label>
          <Textarea
            id="rules"
            value={rules}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setRules(e.target.value)
            }
            placeholder="Enter each rule on a new line"
            required
          />
          <p className="text-sm text-muted-foreground">
            Enter each rule on a new line. These rules will be used to validate
            values.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="examples">Valid Examples</Label>
          <Textarea
            id="examples"
            value={examples}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setExamples(e.target.value)
            }
            placeholder="Enter each example on a new line"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notExamples">Invalid Examples</Label>
          <Textarea
            id="notExamples"
            value={notExamples}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setNotExamples(e.target.value)
            }
            placeholder="Enter each invalid example on a new line"
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              localStorage.removeItem("custom_type_context");
              router.push(context.returnUrl);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Custom Type"}
          </Button>
        </div>
      </form>
    </div>
  );
}
