
import { AnalysisResponse, OpponentType } from "../types";

export interface DemoScriptRound extends AnalysisResponse {
    opponentText: string;
}

export interface DemoScenario {
    id: string;
    title: string;
    opponentType: OpponentType;
    description: string;
    initialContext: string;
    planType: 'standard' | 'premium';
    rounds: DemoScriptRound[];
}

export const DEMO_SCENARIOS: Record<string, DemoScenario> = {
    'demo_standard': {
        id: 'demo_standard',
        title: "The Trust Trap",
        opponentType: "Partner",
        planType: 'standard',
        description: "A relatable conflict about jealousy, phone privacy, and trust issues.",
        initialContext: "My partner is insecure because I received a text from an ex-colleague late at night.",
        rounds: [
            {
                opponentText: "Who is texting you at 11 PM? I saw the screen light up. You're acting shady again.",
                vibeCheck: "Insecure and accusatory. They are projecting anxiety into aggression.",
                legalRiskScore: 5,
                legalRiskExplanation: "No legal risk. Standard relationship conflict.",
                detectedFallacies: ["Jumping to Conclusions", "Accusation"],
                analysisSummary: "The partner is triggered by the late notification. The goal is to reassure without accepting the premise that you are being 'shady'.",
                responses: {
                    soft: "It was just a work notification, babe. I can show you. I understand why it worries you, but I'm right here with you.",
                    firm: "It was a colleague. I'm not acting shady, I'm just sitting here. Please don't jump to conclusions.",
                    greyRock: "It was a work text.",
                    nuclear: "You're acting paranoid again. I can't even have my phone exist without you inventing a scenario."
                }
            },
            {
                opponentText: "You always say it's 'just work'. Why do you hide your phone screen when I walk in then?",
                vibeCheck: "Escalating. They are building a narrative to justify their suspicion.",
                legalRiskScore: 10,
                legalRiskExplanation: "None.",
                detectedFallacies: ["Confirmation Bias", "Generalization ('Always')"],
                analysisSummary: "They are citing a specific behavior (hiding screen) as evidence. Address this specific point calmly.",
                responses: {
                    soft: "I didn't realize I was doing that. I'm happy to leave it face up on the table if it helps you feel more secure.",
                    firm: "I don't hide my screen. That is your interpretation. I value my privacy, but I have nothing to hide.",
                    greyRock: "I'm not hiding anything.",
                    nuclear: "I hide it because your constant surveillance is exhausting. Do you want my passwords too?"
                }
            },
            {
                opponentText: "Maybe I should check your phone. If you have nothing to hide, you won't mind.",
                vibeCheck: "Testing boundaries. This is a trap—compliance validates the distrust, refusal validates the suspicion.",
                legalRiskScore: 15,
                legalRiskExplanation: "Privacy violation attempt.",
                detectedFallacies: ["The Privacy Trap", "False Dichotomy"],
                analysisSummary: "A classic trust trap. Do not hand over the phone, as it sets a precedent that your privacy is conditional on their anxiety.",
                responses: {
                    soft: "I love you, but I don't want a relationship where we police each other. Trust means believing me, not checking my data.",
                    firm: "I'm not handing over my phone. My privacy matters. Trust is a choice, and you need to choose to trust me.",
                    greyRock: "No. That's not happening.",
                    nuclear: "Go ahead. And while you're at it, check the closet for monsters too. Grow up."
                }
            }
        ]
    },
    'demo_premium': {
        id: 'demo_premium',
        title: "The Equity Shake-Up",
        opponentType: "Colleague",
        planType: 'premium',
        description: "A high-stakes business dispute regarding founder equity and IP ownership.",
        initialContext: "My co-founder wants to renegotiate our 50/50 split to 70/30 because they 'had the idea', even though I built the tech.",
        rounds: [
            {
                opponentText: "Look, I've been thinking. I brought the original concept and the initial network. It's only fair we restructure to 70/30. You're a great dev, but the idea is the business.",
                vibeCheck: "Dismissive and manipulative. Minimizing your contribution ('just a dev') to seize value.",
                legalRiskScore: 45,
                legalRiskExplanation: "Contract renegotiation attempt. potential breach of fiduciary duty if forced.",
                detectedFallacies: ["Minimization", "Moving the Goalposts"],
                analysisSummary: "They are attempting to devalue your sweat equity. Do not agree to any 'fairness' frame. Stick to the signed agreement.",
                expertInsights: "Psychology: This is 'Anchoring'. They set an extreme number (70/30) so that 60/40 feels like a 'win' for you. \n\nStrategy: Reject the premise entirely. Do not counter-offer. Revert to the existing contract.",
                responses: {
                    soft: "I hear that you value your initial contribution. However, we agreed on 50/50 based on the execution required. I'm comfortable with our current agreement.",
                    firm: "We have a signed operating agreement at 50/50. I am not open to renegotiating equity. Let's focus on the product launch.",
                    greyRock: "The equity split is settled in the operating agreement.",
                    nuclear: "Without my code, your 'idea' is just a napkin drawing. 50/50 is generous considering I'm the one building the actual asset."
                }
            },
            {
                opponentText: "If we don't fix this, I'm not sure I can motivate myself to raise the next round. Investors want to see the CEO with a controlling stake anyway.",
                vibeCheck: "Coercive threat. Disguised as 'investor advice'.",
                legalRiskScore: 65,
                legalRiskExplanation: "Threatening to withhold performance (breach of duty). Potential sabotage.",
                detectedFallacies: ["Appeal to Authority (Investors)", "Ultimatum"],
                analysisSummary: "This is a threat to sabotage the company's funding unless you comply. This is serious leverage.",
                expertInsights: "Analysis: This is a 'Hostage Tactic'. They are threatening the company's survival. \n\nLegal Note: In many jurisdictions, threatening to sabotage a company you are a director of is a breach of fiduciary duty. Document this.",
                responses: {
                    soft: "I'm concerned that you're linking your motivation to renegotiating our deal. We need to be a united front for investors.",
                    firm: "Are you saying you will refuse to perform your duties as CEO unless I give up my equity? I need to be clear on your position.",
                    greyRock: "We need to raise the round regardless.",
                    nuclear: "If you can't motivate yourself to do your job without robbing your partner, maybe we should discuss your resignation, not my equity."
                }
            }
        ]
    }
};
