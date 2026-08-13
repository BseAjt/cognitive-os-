create index if not exists decision_profile_feedback_organization_idx
  on public.decision_profile_feedback(organization_id);

create index if not exists decision_profile_feedback_user_idx
  on public.decision_profile_feedback(user_id);

create index if not exists decision_outcome_followups_user_idx
  on public.decision_outcome_followups(user_id);
