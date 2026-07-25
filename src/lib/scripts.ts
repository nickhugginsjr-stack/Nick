// Structured, multi-section call scripts keyed by industry ("niche").
// Each prospect's industry is matched (case-insensitively) against this
// library so the rep sees the right script automatically when dialing.

export interface ScriptSection {
  heading: string;
  body: string[];
}

export interface NicheScript {
  niche: string;
  subtitle?: string;
  sections: ScriptSection[];
}

export const NICHE_SCRIPTS: Record<string, NicheScript> = {
  childcare: {
    niche: "Childcare",
    subtitle: "Sacramento Benefits & Business Protection Reference",
    sections: [
      {
        heading: "Opening",
        body: [
          "“Hi, is this [Name]?”",
          "“Hi [Name], this is Nicholas Huggins. I work specifically with childcare owners here in Sacramento. Did I catch you with 30 seconds?”",
        ],
      },
      {
        heading: "Reason for the Call",
        body: [
          "“The reason I’m calling is that we help childcare owners put together benefit and protection strategies for themselves, their staff, and the center.”",
        ],
      },
      {
        heading: "Core Value Proposition",
        body: [
          "“We focus on three things:",
          "1. Helping you offer meaningful benefits that can help attract and retain good staff.",
          "2. Protecting you and the center if something unexpected happens.",
          "3. Exploring properly designed cash-value strategies that may build money you can access over time.",
          "Some benefits can be offered without requiring the center to contribute, unless you decide that you want to.”",
        ],
      },
      {
        heading: "Natural Conversation Version",
        body: [
          "“What we do—and this is specifically our lane with childcare centers—is help owners structure benefits and protection for themselves and their teams.",
          "The first goal is helping you keep good employees, because staffing and turnover are major issues in childcare.",
          "The second is protecting the center and the people who depend on it if something happens to you or another key person.",
          "The third is exploring strategies that may accumulate accessible cash value over time, depending on how they’re designed.",
          "Some options can be completely voluntary for employees, so the center does not have to take on a mandatory contribution.”",
        ],
      },
      {
        heading: "One-Breath Version",
        body: [
          "“We help childcare owners retain good staff, protect the center, and explore benefits that may build accessible value over time—without requiring the business to contribute unless the owner chooses to.”",
        ],
      },
      {
        heading: "Discovery Questions",
        body: [
          "Use only one or two before asking for the meeting.",
          "Staff:",
          "“How difficult has it been for you to find and keep dependable staff?”",
          "“Do you currently offer your employees any benefits outside of their regular pay?”",
          "“What do you think your strongest employees value most besides their hourly wage?”",
          "Owner and center protection:",
          "“If you had to step away from the center unexpectedly, who would keep everything running?”",
          "“Have you put anything in place to protect the center if something happened to you or another key person?”",
          "“How dependent is the business on you personally being there?”",
          "Business priorities:",
          "“What are you most focused on right now—staff retention, growth, or protecting what you have already built?”",
        ],
      },
      {
        heading: "Appointment Close",
        body: [
          "“That’s exactly why I reached out. The next step is not an application or commitment. It’s simply a 15-to-20-minute conversation to understand how your center is structured and determine whether any of these strategies would make sense.”",
          "“I’d also bring in [Manager’s Name], who helps with the design and technical side. Would [Day/Time] or [Alternative Day/Time] work better?”",
        ],
      },
    ],
  },
};

/** Case-insensitive lookup of a prospect's industry against the script library. */
export function getNicheScript(
  industry: string | null | undefined
): NicheScript | null {
  if (!industry) return null;
  return NICHE_SCRIPTS[industry.trim().toLowerCase()] ?? null;
}
