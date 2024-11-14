import { notFound } from "next/navigation";
import React from "react";

import CSVTable from "@/components/csv-table";

interface PageProps {
  params: {
    url: string;
  };
}

export default async function TablePage({ params }: PageProps) {
  const decodedUrl = decodeURIComponent(
    params.url.replace("github%2B", "")
  ).replace("+", " ");

  try {
    // First make a HEAD request to check the file size
    const headResponse = await fetch(decodedUrl, {
      method: "HEAD",
      headers: {
        "Accept-Encoding": "",
      },
    });

    if (!headResponse.ok) {
      return notFound();
    }

    // Check if the response is a redirect
    if (headResponse.status === 302) {
      <main className="container mx-auto p-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-semibold mb-2">File Too Large</h2>
          <p>redirected to {headResponse.url}</p>
        </div>
      </main>;
    }

    const contentLength = headResponse.headers.get("content-length");
    const MAX_SIZE = 100 * 1024; // 100KB in bytes

    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
      return (
        <main className="container mx-auto p-4">
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-semibold mb-2">File Too Large</h2>
            <p>
              This file exceeds the maximum size limit of 100KB. Please try a
              smaller file.
            </p>
          </div>
        </main>
      );
    }

    // If file size is acceptable, proceed with downloading
    const response = await fetch(decodedUrl);

    if (!response.ok) {
      return notFound();
    }

    const data = await response.text();

    return (
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Table View</h1>
        <pre className="whitespace-pre-wrap">
          <CSVTable data={data} />
        </pre>
      </main>
    );
  } catch (error) {
    return notFound();
  }
}
