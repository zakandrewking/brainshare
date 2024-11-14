import { notFound } from "next/navigation";
import React from "react";

interface PageProps {
  params: {
    url: string;
  };
}

export default async function TablePage({ params }: PageProps) {
  // Decode the URL parameter
  const decodedUrl = decodeURIComponent(
    params.url.replace("github%2B", "")
  ).replace("+", " ");

  try {
    // Fetch the CSV data
    const response = await fetch(decodedUrl);

    if (!response.ok) {
      return notFound();
    }

    const data = await response.text();

    // Check if data size too large
    const MAX_SIZE = 1 * 1024 * 1024; // 10MB in bytes
    if (data.length > MAX_SIZE) {
      return (
        <main className="container mx-auto p-4">
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-semibold mb-2">File Too Large</h2>
            <p>
              This file exceeds the maximum size limit of 1MB. Please try a
              smaller file.
            </p>
          </div>
        </main>
      );
    }

    return (
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Table View</h1>
        <pre className="whitespace-pre-wrap">
          {/* Temporarily display raw data - you'll want to parse and display this properly */}
          {data}
        </pre>
      </main>
    );
  } catch (error) {
    return notFound();
  }
}
