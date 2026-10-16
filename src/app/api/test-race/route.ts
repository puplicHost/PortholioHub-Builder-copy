import { getCurrentUser } from '@/lib/auth'
import { getOrCreateProfile, updatePortfolio } from '@/lib/actions/portfolio'

// TEMPORARY: two-tab race replication. Deleted after use.
export async function POST() {
  const user = await getCurrentUser()
  if (!user) return Response.json({ code: 'UNAUTHORIZED' }, { status: 401 })
  const loadA = await getOrCreateProfile();
  const loadB = await getOrCreateProfile();
  const vA = (loadA as { version?: number }).version;
  const vB = (loadB as { version?: number }).version;
  const saveB = await updatePortfolio({
    id: (loadB as { id: string }).id,
    sections: ((loadB as { pages?: { sections?: unknown[] }[] }).pages?.[0]?.sections || []) as never[],
    projects: [],
    expectedVersion: vB,
  });
  return Response.json({
    ok: true,
    loadAVersion: vA,
    loadBVersion: vB,
    saveB: { success: (saveB as { success: boolean }).success, conflict: (saveB as { conflict?: boolean }).conflict, error: (saveB as { error?: string }).error },
  })
}
