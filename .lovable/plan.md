

# Plan: Bereits zugewiesene Vics separieren

## Aenderung in `AssignVerificationDialog.tsx`

When the dialog opens, fetch existing assignments for this verification from `verification_assignments` and store the assigned user IDs in a `Set`.

Split the filtered Vic list into two groups:
1. **Verfuegbar** -- Vics not yet assigned to this verification (clickable, shown first)
2. **Bereits zugewiesen** -- Vics already assigned (shown below with a separator/label, visually muted, not clickable)

### Concrete changes:
- Add state: `assignedUserIds: Set<string>`
- In `fetchVics`, also query `verification_assignments` where `verification_id = verification.id`, collect `user_id` values into the set
- Split `filteredVics` into `availableVics` and `assignedVics` based on the set
- Render `availableVics` first (existing clickable buttons)
- Below, if `assignedVics.length > 0`, render a muted label "Bereits zugewiesen" followed by the assigned Vics styled with `opacity-50 cursor-default` and no click handler

Single file edit: `src/components/AssignVerificationDialog.tsx`

