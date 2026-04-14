import { cookies } from 'next/headers'

/**
 * Lê a liga selecionada a partir do cookie (Server Components).
 * Default: 'BSA'
 */
export async function getLeague(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('league')?.value ?? 'BSA'
}
