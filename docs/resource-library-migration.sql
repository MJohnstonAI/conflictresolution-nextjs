-- Conflict Resolution Library: schema + seed content (idempotent).

CREATE TABLE IF NOT EXISTS public.resource_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  content_md text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resource_articles_published_updated_idx
  ON public.resource_articles (published, updated_at DESC);

CREATE INDEX IF NOT EXISTS resource_articles_category_published_idx
  ON public.resource_articles (category, published);

ALTER TABLE public.resource_articles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resource_articles'
      AND policyname = 'Public read published resources'
  ) THEN
    CREATE POLICY "Public read published resources"
      ON public.resource_articles
      FOR SELECT
      USING (published = true);
  END IF;
END $$;

INSERT INTO public.resource_articles (slug, category, title, excerpt, content_md, published)
VALUES
(
  'dismissive-coworker-meeting',
  'Workplace',
  'How to handle a dismissive coworker during a meeting',
  'A step-by-step guide to reclaiming your voice without escalating tension.',
  $$
## The Situation
When a coworker consistently ignores your contributions or talks over you, it creates a subtle power imbalance. It is rarely about the specific topic being discussed and more about the dynamic in the room.

## Strategy: The Pause and Pivot
Your goal is to reassert your presence without stopping the meeting flow abruptly. A calm acknowledgement and a steady pivot back to your point signals confidence.

## Sample Response Scripts
- "I would like to finish my thought on the budget projections before we move to the next item."
- "I noticed you skipped over my point about the timeline. Can we revisit that briefly?"
- "Hold on just a second, I was not quite done with that section."

## Common Mistakes
- Getting angry in the moment. This validates the dismissal and makes you appear reactive.
- Staying silent. This establishes a pattern that becomes harder to change later.
- Over-apologizing. Avoid starting with "Sorry, but..." when you did nothing wrong.

## When to Escalate
If the behavior persists after direct intervention, document examples and ask your manager for a private conversation focused on meeting norms.
$$,
  true
),
(
  'requesting-repairs-unresponsive-landlord',
  'Housing',
  'Requesting repairs from an unresponsive landlord',
  'A practical playbook for documenting issues and making a clear request.',
  $$
## The Situation
You have reported a repair issue multiple times but receive no response or vague promises. The problem continues and affects daily living.

## Strategy: Clear Documentation and Deadlines
Put the issue in writing with dates, photos, and a reasonable deadline. A calm, factual record is your strongest leverage.

## Sample Response Scripts
- "I am following up on the repair request submitted on March 2. The leak is ongoing. Please confirm a repair date by Friday."
- "Attached are photos and a timeline of the issue. I am requesting a repair appointment within 7 days."

## Common Mistakes
- Relying only on texts or calls. Written records carry more weight.
- Using aggressive threats too early. Start with clear facts and a simple deadline.

## When to Escalate
If there is no response by your stated deadline, review local tenant resources and prepare a formal notice.
$$,
  true
),
(
  'setting-boundaries-family-members',
  'Family',
  'Setting boundaries with difficult family members',
  'How to protect your time and energy without starting a bigger fight.',
  $$
## The Situation
Family members dismiss your requests or pressure you to do things you are not comfortable with. You want to keep the relationship, but not at the expense of your wellbeing.

## Strategy: Calm, Repeated Boundary
Use short, consistent statements. You do not need to justify or debate your boundary.

## Sample Response Scripts
- "I can visit for two hours on Saturday, but I will need to leave by 4 PM."
- "I am not comfortable discussing that topic. Let us focus on dinner plans."
- "I hear you, and my answer is still no."

## Common Mistakes
- Over-explaining. It invites negotiation and pressure.
- Waiting until you are angry. Set the boundary while you are calm.

## When to Escalate
If the behavior is persistent, reduce access and move communication to written channels.
$$,
  true
),
(
  'resolving-noise-complaints',
  'Neighbors',
  'Resolving noise complaints amicably',
  'De-escalate a conflict before it becomes a formal complaint.',
  $$
## The Situation
Neighbor noise is disrupting your sleep or work. You want a solution without creating a hostile environment.

## Strategy: Neutral, Specific Request
Be clear about the time and type of noise. Ask for a simple change and offer flexibility.

## Sample Response Scripts
- "I can hear the music after 11 PM. Would you be open to lowering it after 10 on weekdays?"
- "The bass carries through the wall. Could we try moving the speaker away from the shared wall?"

## Common Mistakes
- Calling authorities first. It can escalate fast and remove a chance to resolve it directly.
- Using vague language. Be specific about times and impact.

## When to Escalate
If direct requests fail and the impact is ongoing, document incidents and use the building process.
$$,
  true
),
(
  'co-parenting-communication-essentials',
  'Divorce',
  'Co-parenting communication essentials',
  'Guidelines for keeping messages focused and reducing conflict.',
  $$
## The Situation
Conversations with a co-parent drift into blame or long arguments. Logistics get lost and tensions rise.

## Strategy: Short, Specific, Child-Focused
Keep messages brief, neutral, and focused on schedules or the child's needs.

## Sample Response Scripts
- "Pickup is 5 PM Friday at the usual location. Let me know if that still works."
- "For school supplies, I can cover notebooks if you handle the calculator."

## Common Mistakes
- Responding to provocation. It distracts from the child-focused goal.
- Mixing topics in one message. Keep one request per message.

## When to Escalate
If basic coordination breaks down, consider a shared calendar or a neutral communication tool.
$$,
  true
),
(
  'managing-conflict-difficult-boss',
  'Workplace',
  'Managing conflict with a difficult boss',
  'Protect your performance while setting professional boundaries.',
  $$
## The Situation
Your manager is critical, inconsistent, or dismissive. You need clarity without triggering retaliation.

## Strategy: Clarify Expectations in Writing
Summarize decisions and next steps in writing. It reduces misunderstandings and creates a record.

## Sample Response Scripts
- "To confirm, the priority this week is the client report, with the draft due Thursday."
- "I will proceed with option B unless you prefer a different approach."

## Common Mistakes
- Challenging in public settings. Use private, calm channels.
- Avoiding all feedback. You still need clarity to deliver results.

## When to Escalate
If repeated issues impact performance or wellbeing, document examples and ask HR for guidance.
$$,
  true
),
(
  'navigating-sibling-disagreements',
  'Family',
  'Navigating disagreements with adult siblings',
  'Keep the relationship intact while addressing the conflict.',
  $$
## The Situation
Siblings disagree on responsibilities, caregiving, or family decisions. Old patterns resurface.

## Strategy: Focus on Roles, Not History
Keep the conversation on the current task and avoid re-litigating past issues.

## Sample Response Scripts
- "For this month, I can handle appointments if you cover weekly check-ins."
- "I want us to agree on a plan for Mom's care before discussing other topics."

## Common Mistakes
- Bringing up old grievances. It derails problem solving.
- Assuming motives. Stick to observable actions and needs.

## When to Escalate
If agreement is impossible, suggest a neutral mediator or third-party advisor.
$$,
  true
),
(
  'dealing-with-nuisance-pets',
  'Housing',
  'Dealing with nuisance pets in apartments',
  'A calm approach to noise and cleanliness concerns.',
  $$
## The Situation
A neighbor's pet causes repeated noise or mess. You want to address it without escalating tensions.

## Strategy: Private, Specific, and Respectful
Describe the impact and offer a reasonable request. Assume good intent first.

## Sample Response Scripts
- "Your dog barks most mornings around 6 AM. Would you be open to keeping the window closed early?"
- "There has been pet waste near the stairwell. Can we work together to keep that area clean?"

## Common Mistakes
- Public shaming. It often leads to defensiveness.
- Vague complaints. Specifics create clarity and solutions.

## When to Escalate
If nothing changes, document dates and use the building's formal process.
$$,
  true
),
(
  'boundary-disputes-hoa',
  'Community',
  'Handling HOA boundary disputes',
  'A clear, documented approach to property line and maintenance conflicts.',
  $$
## The Situation
An HOA or neighbor disputes where boundaries are or who maintains a shared space. Emotions run high.

## Strategy: Separate Facts from Friction
Gather documents, photos, and any HOA guidelines. Keep the discussion factual.

## Sample Response Scripts
- "Based on the survey dated April 12, the fence line sits here. I am attaching a copy for reference."
- "I am open to resolving this quickly. Can we confirm the HOA guideline on maintenance responsibility?"

## Common Mistakes
- Relying on memory. Provide written references whenever possible.
- Escalating before clarifying. Start with calm documentation.

## When to Escalate
If a solution is not reached, follow the HOA dispute process or request mediation.
$$,
  true
)
ON CONFLICT (slug) DO UPDATE
SET category = EXCLUDED.category,
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_md = EXCLUDED.content_md,
    published = EXCLUDED.published,
    updated_at = now();
