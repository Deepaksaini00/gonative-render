interface EnvConfig {
  API_URL: string
  IS_DEV: boolean
}

function readEnv(): EnvConfig {
  const mode = import.meta.env.MODE as string | undefined
  const isDev = mode !== 'production'

  // BACKEND_API_URL is the canon name (exposed via envPrefix in vite.config);
  // VITE_API_URL is provided for tooling that only reads VITE_-prefixed vars.
  const base = (import.meta.env.BACKEND_API_URL ||
    import.meta.env.VITE_API_URL) as string | undefined

  return {
    API_URL: (base || 'http://localhost:8000').replace(/\/+$/, ''),
    IS_DEV: isDev,
  }
}

export const env: EnvConfig = readEnv()