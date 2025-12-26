
# ConflictOS Template Library - Seed Script

Copy and paste the SQL block below into your Supabase SQL Editor to populate your database with the ConflictOS scenarios.

This script:
1.  Modifies the `templates` table to allow System Templates (where `user_id` is NULL).
2.  Inserts 35 common conflict scenarios from your library.

```sql
-- 1. MODIFY SCHEMA (Allow System Templates)
ALTER TABLE public.templates ALTER COLUMN user_id DROP NOT NULL;

-- 2. INSERT SCENARIOS
-- Note: 'mode' is required by the schema, so we default to 'Peacekeeper' for these problem descriptions.
-- These are 'Input' templates (Problem Descriptions), not 'Output' templates (Responses).

INSERT INTO public.templates (title, content, opponent_type, mode, is_public) VALUES 
-- PAGE 1
('The Silent Treatment', 'My partner shuts down and refuses to speak for days whenever I bring up an issue. It makes me feel anxious and desperate to fix it, even when I didn''t do anything wrong.', 'Partner', 'Peacekeeper', true),
('Boundary Crushing Parent', 'My mother shows up unannounced and criticizes my parenting/housekeeping. When I ask her to call first, she plays the victim (''I guess I''m just a burden to you'').', 'Family', 'Peacekeeper', true),
('In-Law Interference', 'My mother-in-law constantly gives unsolicited advice about my career and finances. When I ask her to stop, she accuses me of being disrespectful.', 'In-Law', 'Peacekeeper', true),
('The "Friend" Loan', 'I lent money to a friend months ago. They keep posting vacation photos on Instagram but ignore my texts asking when they can pay me back.', 'Friend', 'Peacekeeper', true),

-- PAGE 2
('Teenage Rebellion', 'My teenager is breaking curfew, failing classes, and refusing to communicate respectfully. I want to hold boundaries without destroying our relationship.', 'Family', 'Peacekeeper', true),
('The Flaky Friend', 'My friend constantly cancels plans last minute after I''ve already arranged my schedule. I want to address this without losing the friendship.', 'Friend', 'Peacekeeper', true),
('The Property Line Tree', 'My neighbor''s massive oak tree drops heavy branches on my driveway. I''ve asked them to trim the dead limbs before they damage my car, but they ignore me.', 'Neighbor', 'Peacekeeper', true),
('Midnight Bass Thumping', 'My neighbor plays loud bass-heavy music until 2 AM on weeknights. I''ve asked them to turn it down multiple times, but they just turn it up louder.', 'Neighbor', 'Peacekeeper', true),
('Incessant Barking Dog', 'The neighbor''s dog barks non-stop for 6 hours a day while they are at work. I work from home and can''t concentrate. They deny it''s happening.', 'Neighbor', 'Peacekeeper', true),
('Passive-Aggressive Neighbor', 'My neighbor keeps leaving angry anonymous notes on my car about parking, even though I am parked legally in my own spot.', 'Neighbor', 'Peacekeeper', true),

-- PAGE 3
('Security Deposit Hostage', 'My landlord is withholding my entire security deposit citing ''professional cleaning fees'' and ''wear and tear'' despite me leaving the place spotless and having move-out photos.', 'Landlord', 'Peacekeeper', true),
('Tenant Rent Arrears', 'My tenant is three months behind on rent. They keep making promises to pay ''next week'' but the money never arrives, and now they are ignoring my calls. I depend on this income.', 'Tenant', 'Peacekeeper', true),
('Unauthorized Alterations', 'I did a routine inspection and found the tenant has painted the walls black and removed a non-load bearing wall without permission. The lease explicitly forbids alterations.', 'Tenant', 'Peacekeeper', true),
('HOA Fine Triangle', 'The HOA fined me for my tenant''s noise violations. I passed the fine to the tenant, who refuses to pay, claiming they weren''t warned about the rules. The HOA is threatening legal action against me.', 'Landlord', 'Peacekeeper', true),
('The Messy Roommate', 'My roommate leaves dirty dishes in the sink for days until they mold. We agreed on a cleaning schedule, but they ignore it completely and gaslight me when I ask.', 'Roommate', 'Peacekeeper', true),
('The Bait-and-Switch Course', 'I purchased an online masterclass advertised as live mentorship. It turned out to be pre-recorded videos from 2019, and the platform refused my refund request.', 'Other', 'Peacekeeper', true),

-- PAGE 4
('Renovation Cost Spiral', 'My contractor has increased the quote by 40% mid-project citing ''unforeseen structural issues'' but won''t provide the engineering report I asked for.', 'Contractor', 'Peacekeeper', true),
('Ghosting Contractor', 'I paid a 50% deposit for home repairs. The contractor started demolition and then disappeared. They haven''t returned my calls or texts for two weeks.', 'Contractor', 'Peacekeeper', true),
('Botched Car Repair', 'I paid $1,200 for a transmission fix. Two days later, the same noise is back. The mechanic says it''s a ''new issue'' and wants to charge me again.', 'Other', 'Peacekeeper', true),
('Defective Product Refund', 'I bought a high-end appliance that stopped working after three days. The store is refusing a refund, claiming I ''misused'' it, which is false.', 'Other', 'Peacekeeper', true),
('Item Not As Described', 'I bought a ''brand new'' phone on an online marketplace. It arrived with scratches and a degraded battery. The seller says ''sold as is'' and blocked me.', 'Seller', 'Peacekeeper', true),
('Botched Bathroom Reno', 'I hired a contractor for a bathroom remodel. They installed the tiling unevenly and the shower leaks into the floor below. They are refusing to fix it unless I pay for ''extra materials''.', 'Contractor', 'Peacekeeper', true),

-- PAGE 5
('Pool Construction Delay', 'The pool installation is three months behind schedule. My backyard is a mud pit, and the contractor is claiming ''supply chain issues'' (force majeure) to avoid penalties, despite me seeing them working on other sites.', 'Contractor', 'Peacekeeper', true),
('Kitchen Cabinet Disaster', 'The custom cabinets I ordered arrived in the wrong color and size. The contractor says I signed off on the specs, but I have the email thread proving otherwise.', 'Contractor', 'Peacekeeper', true),
('Airline Refund Runaround', 'My flight was cancelled due to ''crew scheduling''. The airline is refusing a cash refund and only offering travel vouchers with a short expiry date.', 'Other', 'Peacekeeper', true),
('Gym Cancellation Trap', 'I moved to a new city and tried to cancel my gym membership. They are demanding I come in person to the old location to sign a form, which is impossible.', 'Other', 'Peacekeeper', true),
('Subscription Zombie', 'I cancelled my streaming subscription last month, but they charged my credit card again. Customer support is an endless chatbot loop and I can''t reach a human.', 'Bank', 'Peacekeeper', true),
('Custody Schedule Revision', 'My ex is trying to rewrite history about our agreed custody schedule for the upcoming holidays, claiming I agreed to swap weekends when I definitely didn''t.', 'Ex-Spouse', 'Peacekeeper', true),

-- PAGE 6 & 7
('The Credit Stealer', 'My boss took full credit for my project in the senior leadership meeting today. When I mentioned it privately, they said ''we''re a team'' and implied I''m not a team player.', 'Boss', 'Peacekeeper', true),
('The Slacking Business Partner', 'My business partner has missed the last three client meetings and hasn''t contributed their share of work in two weeks, but still expects a 50/50 profit split.', 'Colleague', 'Peacekeeper', true),
('Startup Equity Dispute', 'My co-founder wants to renegotiate our 50/50 split to 70/30 in their favor because they ''came up with the original idea'', despite me building the entire product.', 'Colleague', 'Peacekeeper', true),
('Freelance Payment Ghosting', 'I submitted the final design assets three weeks ago. The client loved them but has stopped responding to my invoices and follow-up emails regarding payment.', 'Other', 'Peacekeeper', true),
('Venue Contract Breach', 'I booked a venue for a large event. They cancelled 2 weeks prior citing ''force majeure'' due to a staffing shortage, which is not a natural disaster. They are refusing to refund my deposit.', 'Company', 'Peacekeeper', true),
('Medical Procedure Denial', 'My medical aid rejected a claim for a necessary surgery, classifying it as ''elective'' despite my doctor''s urgent recommendation. The out-of-pocket cost is astronomical.', 'Insurance Company', 'Peacekeeper', true),
('Insurance Claim Denial', 'My car was hit while parked. The insurance company is denying the claim saying the damage is ''consistent with a previous incident'', which is a lie.', 'Insurance Company', 'Peacekeeper', true);

-- =================================================================
-- 4. SEED STORIES (Testimonials)
-- =================================================================

TRUNCATE public.success_stories;

INSERT INTO public.success_stories (author, role, text, stars, is_featured) VALUES
('Short Changed', 'Small Business Owner', 'I used the Barrister mode to reply to a client who refused to pay an invoice. They paid within an hour of receiving the email. Incredible.', 5, true),
('Loving Dad', 'Co-Parent', 'My ex sends these long, ranting emails. The Grey Rock mode helped me strip out the emotion and just reply to the logistics. It saved my sanity.', 5, true),
('Fair Play Seeker', 'Tenant', 'My landlord tried to keep my deposit. I pasted his email here, got a legal-sounding response pointing out the local laws, and he wired the money back the next day.', 5, true);
```
