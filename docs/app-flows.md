# Conflict Resolution - App Flows

## Global layout
- Desktop uses a left sidebar with primary navigation.
- Mobile uses a bottom navigation bar with the same destinations.
- Settings is a modal with theme selection; admin accounts see model controls.

## Start new case (/)
- Paste or type the conflict context (up to 40,000 characters).
- Choose Standard or Premium below the case description; a recommendation appears only when confident.
- Start Analysis creates the case and opens the Mission Profile.
- Choose or override the adversary in Mission Profile (with AI default when clear).

## Authentication (/auth)
- Sign in, sign up (magic link), password reset, and password update flows.
- Google OAuth button available.

## Demo (/demo)
- Choose Standard or Premium scripted demo.
- Launches a demo case and plays round by round.

## War Room (/case/[id])
- Input opponent text per round and optional sender name.
- Analysis returns summary, vibe check, detected tactics, and legal risk.
- Choose a response mode and copy the suggested reply.
- Each analysis consumes 1 Mediation Session (Standard or Premium).
- Continue rounds as needed; cases do not have a fixed round cap.
- Export case history from the Vault (Markdown or print/PDF).

## Vault (/vault)
- View case list, search, edit notes/title, and delete.
- Export case history to Markdown or PDF.
- Shows session balances and account sync status.

## Templates (/templates)
- Search conflict scenarios, copy text, or prefill Home to create a case.

## Testimonials (/testimonials)
- Displays success stories and links to share via Help.

## Help (/help)
- Guide, FAQ, and Contact tabs.
- Contact includes support email copy action.

## Sessions store (/unlock/credits)
- Buy Standard or Premium mediation sessions.
- Shows wallet balance.

## Session Ledger (/ledger)
- Monthly rollups of session purchases and usage.
- Drill down to see daily consumption.

## Settings (modal)
- Theme options: light, dark (navy), system, aura, midnight, slate, sapphire, nordic.
- Admins can view and change OpenRouter model selections.
