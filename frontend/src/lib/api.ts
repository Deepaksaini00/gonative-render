import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from '@/generated/api'
import { env } from '@/lib/config'

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = localStorage.getItem('token')
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return response
  },
}

export const api = createClient<paths>({
  baseUrl: env.API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.use(authMiddleware)

export type { paths }
