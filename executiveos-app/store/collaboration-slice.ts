import type { StateCreator } from "zustand";
import type { CollaborationSlice, ExecutiveState } from "./types";
import { can, createAuditLog } from "../lib/collaboration";

export const createCollaborationSlice: StateCreator<ExecutiveState,[],[],CollaborationSlice> = (set,get) => ({
  organizations:[{ id:"org-executiveos", name:"ExecutiveOS Labs", slug:"executiveos-labs", plan:"team", createdAt:"2026-08-01T09:00:00.000Z", updatedAt:"2026-08-01T09:00:00.000Z" }],
  activeOrganizationId:"org-executiveos",
  activeMemberId:"member-sebastien",
  organizationMembers:[
    { id:"member-sebastien", organizationId:"org-executiveos", userId:"user-sebastien", displayName:"Sébastien Herpers", email:"sebastien@executiveos.demo", role:"owner", status:"active", joinedAt:"2026-08-01T09:00:00.000Z" },
    { id:"member-claire", organizationId:"org-executiveos", userId:"user-claire", displayName:"Claire Martin", email:"claire@executiveos.demo", role:"admin", status:"active", joinedAt:"2026-08-02T09:00:00.000Z" },
    { id:"member-thomas", organizationId:"org-executiveos", userId:"user-thomas", displayName:"Thomas Bernard", email:"thomas@executiveos.demo", role:"member", status:"active", joinedAt:"2026-08-03T09:00:00.000Z" }
  ],
  organizationInvitations:[], caseAccess:[], collaborationComments:[], auditLogs:[],
  inviteMember:(email,role) => {
    const actor=get().organizationMembers.find((item)=>item.id===get().activeMemberId);
    if(!can(actor,"manage_members")) throw new Error("Permission insuffisante");
    const now=new Date(); const id=crypto.randomUUID();
    set((state)=>({
      organizationInvitations:[{id,organizationId:state.activeOrganizationId,email:email.trim().toLowerCase(),role,status:"pending",invitedBy:actor!.id,createdAt:now.toISOString(),expiresAt:new Date(now.getTime()+7*86400000).toISOString()},...state.organizationInvitations],
      auditLogs:[createAuditLog({organizationId:state.activeOrganizationId,actorMemberId:actor!.id,action:"member.invited",targetType:"invitation",targetId:id,summary:`Invitation envoyée à ${email.trim().toLowerCase()}`,metadata:{role}}),...state.auditLogs]
    }));
    return id;
  },
  addComment:(input) => {
    const state=get(); const actor=state.organizationMembers.find((item)=>item.id===state.activeMemberId);
    if(!can(actor,"comment")) throw new Error("Permission insuffisante");
    const id=crypto.randomUUID(); const now=new Date().toISOString();
    const record={id,organizationId:state.activeOrganizationId,authorMemberId:actor!.id,mentions:[],resolvedAt:undefined,createdAt:now,updatedAt:now,...input};
    set((current)=>({collaborationComments:[record,...current.collaborationComments],auditLogs:[createAuditLog({organizationId:current.activeOrganizationId,actorMemberId:actor!.id,action:"comment.created",targetType:input.targetType,targetId:input.targetId,caseId:input.caseId,summary:"Commentaire collaboratif ajouté",metadata:{commentId:id}}),...current.auditLogs]}));
    return id;
  },
  resolveComment:(commentId) => set((state)=>{
    const actor=state.organizationMembers.find((item)=>item.id===state.activeMemberId);
    if(!can(actor,"comment")) throw new Error("Permission insuffisante");
    const comment=state.collaborationComments.find((item)=>item.id===commentId); if(!comment) return state;
    const resolvedAt=new Date().toISOString();
    return {collaborationComments:state.collaborationComments.map((item)=>item.id===commentId?{...item,resolvedAt,updatedAt:resolvedAt}:item),auditLogs:[createAuditLog({organizationId:state.activeOrganizationId,actorMemberId:actor!.id,action:"comment.resolved",targetType:comment.targetType,targetId:comment.targetId,caseId:comment.caseId,summary:"Commentaire résolu",metadata:{commentId}}),...state.auditLogs]};
  })
});
