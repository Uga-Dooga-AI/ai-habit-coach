import Anthropic from 'npm:@anthropic-ai/sdk@0.30.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckinRequest {
  habitName: string;
  habitCategory: string;
  streakCount: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { habitName, habitCategory, streakCount, timeOfDay }: CheckinRequest = await req.json();

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    });

    const streakContext = streakCount > 0
      ? `This is day ${streakCount + 1} of their streak.`
      : 'This is their first check-in for this habit today.';

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      messages: [
        {
          role: 'user',
          content: `You are an encouraging habit coach. The user just completed their "${habitName}" habit (category: ${habitCategory}) in the ${timeOfDay}. ${streakContext}

Write a short, warm motivational message (1-2 sentences max, 80 chars or less). Be specific to the habit and streak. No emojis. Be genuine, not generic.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : 'Great job completing your habit today!';

    return new Response(JSON.stringify({ message: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai-checkin error:', error);
    return new Response(
      JSON.stringify({ message: 'Great job completing your habit today!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  }
});
