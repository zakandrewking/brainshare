/** @type {import('next').NextConfig} */

import fs from "fs";
import createMDX from "@next/mdx";

// https://stackoverflow.com/questions/34518389/get-hash-of-most-recent-git-commit-in-node
let gitSha = null;
const rev = fs.readFileSync("../.git/HEAD").toString().trim();
if (rev.indexOf(":") === -1) {
  gitSha = rev;
} else {
  gitSha = fs
    .readFileSync("../.git/" + rev.substring(5))
    .toString()
    .trim();
}

const nextConfig = {
  env: {
    NEXT_PUBLIC_GIT_SHA: gitSha.slice(0, 7),
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
