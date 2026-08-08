import type { AuditLogRecord, CaseAccessRecord, CollaborationCommentRecord, OrganizationMemberRecord, OrganizationRole } from "../domain/canonical.ts";

export type CollaborationCapability = "read" | "comment" | "edit" | "manage_members" | "manage_organization";

const ROLE_CAPABILITIES: Record<OrganizationRole, CollaborationCapability[]> = {
  owner: ["read", "comment", "edit", "manage_members", "manage_organization"],
  admin: ["read", "comment", "edit", "manage_members"],
  member: ["read", "comment", "edit"],
  viewer: ["read", "comment"]
};

export function can(member: OrganizationMemberRecord | undefined, capability: CollaborationCapability): boolean {
  return Boolean(member?.status === "active" && ROLE_CAPABILITIES[member.role].includes(capability));
}

export function canAccessCase(input: { member:OrganizationMemberRecord|undefined; caseId:string; grants:CaseAccessRecord[]; capability:"read"|"comment"|"edit" }): boolean {
  const { member, caseId, grants, capability } = input;
  if (!member || !can(member, capability)) return false;
  if (member.role === "owner" || member.role === "admin") return true;
  const grant = grants.find((item) => item.caseId === caseId && item.memberId === member.id);
  if (!grant) return member.role === "member";
  const rank = { view:1, comment:2, edit:3, manage:4 } as const;
  return rank[grant.access] >= ({ read:1, comment:2, edit:3 } as const)[capability];
}

export function createAuditLog(input: Omit<AuditLogRecord,"id"|"createdAt"> & { id?:string; createdAt?:string }): AuditLogRecord {
  return { ...input, id:input.id ?? crypto.randomUUID(), createdAt:input.createdAt ?? new Date().toISOString() };
}

export function unresolvedComments(comments: CollaborationCommentRecord[], caseId: string): CollaborationCommentRecord[] {
  return comments.filter((item) => item.caseId === caseId && !item.resolvedAt).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}
