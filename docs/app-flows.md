# Conflict Resolution - App Flows

## Global layout
- Desktop uses a left sidebar with primary navigation.
- Mobile uses a bottom navigation bar with the same destinations.
- Settings is a modal with theme selection; admin accounts see model controls.

## Start new case (/)
- Select an adversary; choose Other to enter a custom name.
- Paste or type the conflict context (up to 40,000 characters).
- Start Analysis opens the plan selector (Standard vs Premium).
- Creates a case and enters the War Room.

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
- Continue rounds until the case reaches its limit.
- Export case history from the Vault (Markdown or print/PDF).

## Vault (/vault)
- View case list, search, edit notes/title, and delete.
- Export case history to Markdown or PDF.
- Shows account credit sync status.

## Templates (/templates)
- Search conflict scenarios, copy text, or prefill Home to create a case.

## Testimonials (/testimonials)
- Displays success stories and links to share via Help.

## Help (/help)
- Guide, FAQ, and Contact tabs.
- Contact includes support email copy action.

## Credits store (/unlock/credits)
- Buy Standard or Premium case files.
- Shows wallet balance.

## Settings (modal)
- Theme options: light, dark (navy), system, aura, midnight, slate, sapphire, nordic.
- Admins can view and change OpenRouter model selections.
