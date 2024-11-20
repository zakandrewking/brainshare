"use client";

import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Stack } from "./ui/stack";

/**
 * Turn any CSV URL into a raw URL. Raises an error if the URL is not a valid
 * Github CSV URL.
 */
function normalizeUrl(url: string) {
  // handle
  // https://raw.githubusercontent.com/sher1203/Protein-Folding/refs/heads/main/protein_interactions.csv
  if (url.startsWith("https://raw.githubusercontent.com/")) {
    return url;
  } else if (url.startsWith("https://github.com/") && url.includes("/blob/")) {
    // handle
    // https://github.com/sher1203/Protein-Folding/blob/main/protein_interactions.csv
    const parts = url.replace("https://github.com/", "").split("/");
    const repo = parts.slice(0, 2).join("/");
    const filename = parts.slice(3).join("/");
    return `https://raw.githubusercontent.com/${repo}/refs/heads/${filename}`;
  } else if (url.startsWith("https://github.com/") && url.includes("/raw/")) {
    // handle
    // https://github.com/sher1203/Protein-Folding/raw/main/protein_interactions.csv
    const parts = url.replace("https://github.com/", "").split("/");
    const repo = parts.slice(0, 2).join("/");
    const filename = parts.slice(3).join("/");
    return `https://raw.githubusercontent.com/${repo}/refs/heads/${filename}`;
  } else {
    throw new Error("Invalid GitHub CSV URL");
  }
}

export default function UrlEntry() {
  const [url, setUrl] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleGo = async () => {
    let rawUrl;
    try {
      rawUrl = normalizeUrl(url);
    } catch (error) {
      toast.error("Invalid GitHub CSV URL", {
        description: "Please enter a valid GitHub URL.",
        dismissible: true,
      });
      return;
    }

    try {
      const response = await fetch(rawUrl, { method: "HEAD" });
      if (response.ok) {
        router.push(
          `/table/github+${encodeURIComponent(rawUrl).replace(" ", "+")}`
        );
      } else {
        toast.error("Failed to fetch file", {
          description: "Please check the URL and try again.",
        });
      }
    } catch (error) {
      toast.error("Error fetching file", {
        description: "An error occurred while fetching the file.",
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleGo();
      }}
      className="w-full"
    >
      <Stack direction="row" className="w-full">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="URL"
        />
        <Button type="submit" disabled={checking}>
          Go
        </Button>
      </Stack>
    </form>
  );
}
