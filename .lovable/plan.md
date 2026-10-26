# Lead-Import: Duplikate über alle Marken hinweg überspringen

The import already checks e-mail addresses against existing leads. That check only sees what the importing person is allowed to see, though: for callers that is only their own brand. On top of that, spelling differences such as upper/lower case slip through.

## Solution
- During import, every e-mail address in the file is checked against the leads of **all** brands.
- Upper/lower case and spaces don't matter (e.g. "Max@Web.de" = "max@web.de").
- Duplicates are skipped and counted in the usual message ("X Duplikate übersprungen").
- No data from other brands is shown. The check only answers which of the uploaded addresses already exist.

## Technical details
- Migration: SECURITY DEFINER function `existing_lead_emails(_emails text[]) returns setof text`. It compares `lower(trim(email))` across all `leads`, checks inside the function that the caller is an admin or caller, and only returns addresses that were passed in. EXECUTE for `authenticated` only.
- `src/components/LeadImportDialog.tsx`: replace the `.from("leads").select("email").in(...)` query with the RPC, in batches of 500 addresses.
