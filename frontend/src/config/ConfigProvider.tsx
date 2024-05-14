"use client";

import axios from "axios";
import { ReactNode } from "react";

import { OpenAPI } from "@/client";

export default function ConfigProvider({ children }: { children: ReactNode }) {
  // Backend Config
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl === undefined) throw Error("Missing NEXT_PUBLIC_BACKEND_URL");
  OpenAPI.BASE = backendUrl;
  axios.defaults.timeout = 8000;
  console.log("Backend URL:", backendUrl);

  return <>{children}</>;
}
