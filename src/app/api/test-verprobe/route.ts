import { getCurrentUser } from '@/lib/auth'
import { getOrCreateProfile, updatePortfolio } from '@/lib/actions/portfolio'

// TEMPORARY: version bookkeeping probe. Deleted after use.
export async function POST() {
  const user = await getCurrentUser()
  if (!user) return Response.json({ code: 'UNAUTHORIZED' }, { status: 401 })
  const p1 = await getOrCreateProfile();
  const v1 = (p1 as { version?: number; username?: string }).username;
  const ver1 = (p1 as { version?: number }).version;
  const s1 = await updatePortfolio({
    id: (p1 as { id: string }).id,
    sections: ((p1 as { pages?: { sections?: unknown[] }[] }).pages?.[0]?.sections || []) as never[],
    projects: [],
    expectedVersion: ver1,
  });
  const p2 = await getOrCreateProfile();
  return Response.json({
    ok: true,
    loadedUsername: v1,
    loadedVersion: ver1,
    save1: { success: (s1 as { success: boolean }).success, version: (s1 as { version?: number }).version, conflict: (s1 as { conflict?: boolean }).conflict, error: (s1 as { error?: string }).error },
    reloadedVersion: (p2 as { version?: number }).version,
  })
}
