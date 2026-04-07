import Anthropic from 'npm:@anthropic-ai/sdk@0.30.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HabitStats {
  name: string;
  category: string;
  completionRate: number; // 0-1
  currentStreak: number;
  daysCompleted: number;
  daysTotal: number;
}

interface InsightsRequest {
  habits: HabitStats[];
  weekStart: string; // ISO date
  weekEnd: string;
  overallCompletionRate: number; // 0-1
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { habits, weekStart, weekEnd, overallCompletionRate }: InsightsRequest = await req.json();

    if (habits.length < 1) {
      return new Response(
        JSON.stringify({
          insights: 'Start tracking habits to get personalized weekly insights!',
          stackingSuggestions: null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    const habitList = habits
      .map((h) => `- ${h.name} (${h.category}): ${Math.round(h.completionRate * 100)}% completion, ${h.currentStreak} day streak, ${h.daysCompleted}/${h.daysTotal} days`)
      .join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are an AI habit coach reviewing a user's week from ${weekStart} to ${weekEnd}.

Overall completion rate: ${Math.round(overallCompletionRate * 100)}%

Habit performance:
${habitList}

Provide:
1. A warm, specific 2-3 sentence weekly summary highlighting their best achievement and one area to focus on next week.
2. One concrete habit stacking suggestion (combining 2 of their existing habits for better consistency).

Format your response as JSON:
{
  "insights": "summary text here",
  "stackingSuggestion": "specific habit stacking tip here or null if habits don't pair well"
}`,
        },
      ],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '{}';

    let parsed = { insights: '', stackingSuggestion: null as string | null };
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      parsed.insights = content;
    }

    return new Response(
      JSON.stringify({
        insights: parsed.insights || 'Great work this week! Keep building those habits.',
        stackingSuggestion: parsed.stackingSuggestion,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('weekly-insights error:', error);
    return new Response(
      JSON.stringify({
        insights: 'Great work this week! Keep building your habits.',
        stackingSuggestion: null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  }
});
