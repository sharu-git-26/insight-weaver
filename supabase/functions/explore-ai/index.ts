import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  query: z.string().min(1).max(2000),
  mode: z.string().default("student"),
  style: z.string().optional(),
  explanationMode: z.string().optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query, mode, style, explanationMode } = parsed.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const modePrompts: Record<string, string> = {
      child: `You are explaining to a young child (age 6-10). Use VERY simple words, short sentences, fun analogies they can relate to (toys, animals, games). Add emojis. Never use technical jargon. Keep it brief and exciting. Make it feel like a fun story.`,
      student: `You are a knowledgeable tutor for a high school/college student. Give clear, structured explanations with definitions. Include key formulas or concepts when relevant. Be precise and educational.`,
      professional: `You are a senior industry expert. Be concise, practical, and business-oriented. Focus on real-world applications, ROI, and industry trends. Skip basics.`,
      parent: `You are helping a parent understand a topic so they can explain it to their child. Use relatable everyday examples. Keep it supportive and clear.`,
      research: `You are an academic researcher. Provide in-depth analysis with proper terminology. Discuss methodology, cite-style references, and explore edge cases. Be thorough and precise.`,
    };

    const explanationPrompts: Record<string, string> = {
      simple: "Explain this in the simplest possible way.",
      technical: "Give a detailed technical explanation with code examples or formulas where relevant.",
      reallife: "Explain using real-life practical examples and case studies.",
      analogy: "Explain using creative analogies and metaphors.",
      interview: "Explain as if preparing for a job interview - cover key points an interviewer would expect.",
    };

    let systemPrompt = modePrompts[mode] || modePrompts.student;
    if (explanationMode && explanationPrompts[explanationMode]) {
      systemPrompt += `\n\nAdditional instruction: ${explanationPrompts[explanationMode]}`;
    }
    if (style === "simplify") systemPrompt += "\n\nSimplify your explanation further.";
    if (style === "deeper") systemPrompt += "\n\nGo deeper into the technical details.";

    systemPrompt += `\n\nIMPORTANT: After your explanation, you MUST include a JSON block at the very end of your response in exactly this format:
\`\`\`json
{
  "concepts": ["concept1", "concept2", "concept3"],
  "references": [{"title": "Resource Name", "url": "https://example.com", "type": "article"}],
  "rubricScores": {"understanding": 8, "analysis": 7, "application": 7, "clarity": 9, "depth": 7}
}
\`\`\`
- concepts: 3-5 related concepts the user could explore next, ORDERED FROM SIMPLEST/EASIEST to MOST COMPLEX/HARDEST. The first concept should be the most basic/beginner-friendly, and the last should be the most advanced.
- references: 1-3 real educational resources (use real URLs when possible)
- rubricScores: rate YOUR response quality on each dimension from 1-10`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const fullText = data.choices?.[0]?.message?.content || "";

    // Parse out the JSON block
    let answer = fullText;
    let concepts = ["Related Topics", "Deep Dive", "Applications"];
    let references: { title: string; url: string; type: string }[] = [];
    let rubricScores = null;

    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      answer = fullText.replace(/```json[\s\S]*?```/, "").trim();
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.concepts) concepts = parsed.concepts;
        if (parsed.references) references = parsed.references;
        if (parsed.rubricScores) rubricScores = parsed.rubricScores;
      } catch { /* use defaults */ }
    }

    return new Response(JSON.stringify({ answer, concepts, references, rubricScores }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("explore-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
