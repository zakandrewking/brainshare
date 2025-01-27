"use client";

import { ReactNode } from "react";

import axios from "axios";

export default function ConfigProvider({ children }: { children: ReactNode }) {
  // Backend Config
  // const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  // if (!backendUrl) {
  //   throw Error("Missing environment variable NEXT_PUBLIC_BACKEND_URL");
  // }

  // OpenAPI.BASE = backendUrl;
  axios.defaults.timeout = 8000;

  return <>{children}</>;
}
