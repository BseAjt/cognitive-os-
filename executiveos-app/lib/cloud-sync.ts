export const CLOUD_STORAGE_KEY = "executiveos-v2";

export type CloudSnapshot = { organization_id:string; revision:number; payload:Record<string,unknown>; updated_at:string };

export function readLocalSnapshot(storage: Pick<Storage,"getItem">): Record<string,unknown> | null {
  const raw=storage.getItem(CLOUD_STORAGE_KEY); if(!raw)return null;
  try { const parsed=JSON.parse(raw) as {state?:Record<string,unknown>}; return parsed.state ?? null; } catch { return null; }
}

export function cloudSyncDecision(localRevision:number, remoteRevision:number) {
  if(remoteRevision>localRevision)return "pull" as const;
  if(remoteRevision===localRevision)return "push" as const;
  return "conflict" as const;
}
