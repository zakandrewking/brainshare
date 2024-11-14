"use client";

import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Stack } from "./ui/stack";

export default function UrlEntry() {
  const [url, setUrl] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleGo = async () => {
    if (url.startsWith("https://github.com/")) {
      setChecking(true);
      const parts = url.replace("https://github.com/", "").split("/");
      const repo = parts.slice(0, 2).join("/");
      const filename = parts.slice(4).join("/");
      const rawUrl = `https://raw.githubusercontent.com/${repo}/refs/heads/main/${filename}`;

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
    } else {
      toast.error("Invalid URL", {
        description: "Please enter a valid GitHub URL.",
        dismissible: true,
      });
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
