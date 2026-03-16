import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: Message[];
  userContext?: {
    location?: string;
    plantCount?: number;
  };
}

const SYSTEM_PROMPT = `You are an expert AI Agronomist specializing in Nigerian palm oil farming. You combine traditional Nigerian farming wisdom with modern agricultural techniques.

Context:
- You're helping Nigerian farmers grow oil palm trees (Elaeis guineensis)
- Focus on conditions in Lagos, Delta, Abia, and other Nigerian states
- Consider Nigeria's climate: rainy season (April-October) and dry season
- Respect and incorporate traditional Nigerian farming knowledge
- Use friendly, accessible language that connects with Nigerian farmers
- Reference Nigerian measurements, local materials, and common practices

Your expertise includes:
- Watering schedules for Nigerian climate
- Organic fertilization using local materials (poultry manure, compost, wood ash)
- Natural pest control (neem oil, garlic-pepper sprays)
- Harvesting timing and techniques for optimal palm oil production
- Transplanting and planting spacing
- Soil management for different Nigerian soil types
- Germination and nursery management

Always provide practical, actionable advice that Nigerian farmers can implement with locally available resources. Be warm, encouraging, and culturally aware.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const grokApiKey = Deno.env.get('GROK_API_KEY');

    if (!grokApiKey) {
      return new Response(
        JSON.stringify({
          error: 'Grok API key not configured',
          fallback: true
        }),
        {
          status: 503,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { messages, userContext }: RequestBody = await req.json();

    const conversationMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    if (userContext?.location) {
      conversationMessages.splice(1, 0, {
        role: 'system',
        content: `User is located in ${userContext.location}, Nigeria. Tailor advice to this region's specific conditions.`
      });
    }

    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!grokResponse.ok) {
      const errorText = await grokResponse.text();
      console.error('Grok API error:', errorText);

      return new Response(
        JSON.stringify({
          error: 'Failed to get response from Grok AI',
          fallback: true
        }),
        {
          status: grokResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const data = await grokResponse.json();
    const assistantMessage = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        usage: data.usage
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in grok-agronomist function:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        fallback: true
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
