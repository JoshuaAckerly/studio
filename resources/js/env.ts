// env.ts — re-exports from the shared @gj/env package.
import { createEnvResolver } from '@gj/env';

export const { getAuthSystemUrl, getProjectUrl, getMainSiteUrl, getLoginUrl } =
    createEnvResolver('graveyardjokes.com');
