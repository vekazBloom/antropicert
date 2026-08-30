import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const nextConfig: NextConfig = {
  // The parent directories are inside another git repo; pin the workspace root
  // so Turbopack does not walk up into it.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
};

export default nextConfig;
