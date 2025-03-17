"use client";

import { useEffect, useRef } from "react";

interface SandboxProps {
  code?: string;
  width?: string;
  height?: string;
}

export default function Sandbox({
  code = "console.log('Hello, world!');",
  width = "100%",
  height = "400px",
}: SandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    // Create a basic HTML structure with necessary security settings
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <!-- Strict Content Security Policy -->
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none';">
          <style>
            body { margin: 0; padding: 0; }
            #root { width: 100%; height: 100vh; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script>
            // Create a secure environment by limiting JavaScript capabilities
            // Prevent access to sensitive APIs
            window.alert = () => {};
            window.confirm = () => {};
            window.prompt = () => {};
            window.open = () => null;

            // Restrict access to storage
            delete window.localStorage;
            delete window.sessionStorage;

            // Prevent navigation
            delete window.location;

            // Prevent network requests
            window.fetch = () => Promise.reject(new Error('fetch is disabled'));
            window.XMLHttpRequest = () => { throw new Error('XMLHttpRequest is disabled'); };

            // Run the untrusted code in a try-catch block
            try {
              ${code}
            } catch (error) {
              console.error('Error in sandbox:', error);

              // Display error in the sandbox
              const rootEl = document.getElementById('root');
              rootEl.innerHTML = '<div style="color: red; padding: 10px; border: 1px solid red; margin: 10px; font-family: monospace;">' +
                                 '<strong>Error:</strong> ' + error.message + '</div>';
            }
          </script>
        </body>
      </html>
    `;

    // Create a blob URL with the HTML content
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // Set the iframe source to the blob URL
    iframeRef.current.src = url;

    // Clean up when component unmounts
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [code]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        width,
        height,
        border: "none",
        backgroundColor: "white",
      }}
      sandbox="allow-scripts allow-modals"
      title="Code Sandbox"
    />
  );
}
