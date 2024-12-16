import React from "react";

import { notFound } from "next/navigation";

import CSVTable from "@/components/csv-table";

interface PageProps {
  params: {
    url: string;
  };
}

export default async function GithubTablePage({ params }: PageProps) {
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
      <div className="container mx-auto p-4">
        <div className="rounded-lg border p-4">
          <h2 className="text-xl font-semibold mb-2">File Too Large</h2>
          <p>redirected to {headResponse.url}</p>
        </div>
      </div>;
    }

    const contentLength = headResponse.headers.get("content-length");
    const MAX_SIZE = 1 * 1024 * 1024; // 1MB in bytes

    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
      return (
        <div className="container mx-auto p-4">
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-semibold mb-2">File Too Large</h2>
            <p>
              This file exceeds the maximum size limit of 1MB. Please try a
              smaller file.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="container mx-auto p-4">
          <a
            href={decodedUrl}
            className="text-2xl font-bold mb-4 hover:underline inline-flex items-center gap-2"
            target="_blank"
          >
            {decodedUrl.split("/").pop()}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
        <pre className="whitespace-pre-wrap">
          <CSVTable url={decodedUrl} />
        </pre>
      </div>
    );
  } catch (error) {
    return notFound();
  }
}
