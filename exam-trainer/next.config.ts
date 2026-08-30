import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const nextConfig: NextConfig = {
  // better-sqlite3 is a native addon; it must not be bundled.
  serverExternalPackages: ['better-sqlite3'],
  // The parent directories are inside an unrelated git repo rooted at $HOME;
  // pin the workspace root so Turbopack does not walk up into it.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
};

export default nextConfig;
