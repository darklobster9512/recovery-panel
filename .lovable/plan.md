

# Plan: 3 Fixes

## 1. Phone number dropdown shows actual phone number instead of token

**`AssignVerificationDialog.tsx`**: The phone dropdown currently fetches only `id, token, api_url` from `phone_numbers`. The actual phone number comes from the anosim-proxy edge function (fetched via token). Since calling the API for each entry in a dropdown is slow, we'll fetch the phone data for each entry and display it. 

Better approach: Fetch phone data via `anosim-proxy` for each phone_number entry when the dropdown loads, cache results, and display the actual number. If loading, show "Laden...". If no number available, fall back to token.

Changes in `AssignVerificationDialog.tsx`:
- Add a state `phoneDataMap: Record<string, string>` mapping phone_number.id to the actual phone number
- In `fetchPhoneNumbers`, after fetching entries, call `anosim-proxy` for each token in parallel to get the number
- In the SelectItem, display the phone number instead of `p.token`

## 2. Move "Zuweisen" button to replace "X Anweisungen" text

**`AdminVerifications.tsx`** (lines ~220-230): Currently the card shows `{v.instructions.length} Anweisung(en)` text and a hover-only UserPlus button in top-right. Replace the "X Anweisungen" text with a "Zuweisen" button (UserPlus icon + text). Remove the UserPlus from the hover actions at top-right.

## 3. Assigned verifications card on Vic detail page

**`AdminVicDetail.tsx`**: Add a new Card between the profile card and notes card that:
- Fetches `verification_assignments` where `user_id = id`, joined with `verifications` title/logo
- Also fetches associated `phone_numbers` data via anosim-proxy for phone display
- Displays a list of assigned verifications with their field values
- Shows verification title, logo, and the entered data (field_values + phone number)

