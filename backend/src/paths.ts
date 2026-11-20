import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve from the module so commands keep working after the repository is moved.
export const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const workspaceRoot = path.dirname(backendRoot);
config({ path: path.join(backendRoot, '.env'), quiet: true });
