import type { NextConfig } from "next";

// The study notebooks are read from disk at request time (content/study/*.html
// — see src/lib/study-files.ts). File tracing can't see those reads, so tell
// it which routes need the folder; otherwise serverless builds ship without it.
const STUDY_FILES = ["./content/study/**/*"];

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/study": STUDY_FILES,
    "/study/[slug]": STUDY_FILES,
    "/study/raw/[slug]": STUDY_FILES,
    "/study/pdf/[slug]": STUDY_FILES,
  },
};

export default nextConfig;
