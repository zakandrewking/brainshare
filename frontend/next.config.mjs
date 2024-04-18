/** @type {import('next').NextConfig} */

import fs from "fs";

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
    // TODO set to VERCEL_GIT_COMMIT_SHA
    NEXT_PUBLIC_GIT_SHA: gitSha.slice(0, 7),
  },
};

export default nextConfig;
