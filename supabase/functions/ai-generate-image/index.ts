import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, size = '1024x1024', style = 'vivid' } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Enhance prompt for pharmacy/medical context
    const enhancedPrompt = `Professional pharmaceutical/medical context: ${prompt}. 
Style: Clean, modern, trustworthy. Suitable for healthcare communication.`;

    console.log('Generating image with prompt:', enhancedPrompt);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: size,
        quality: 'standard',
        style: style,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI DALL-E error:', error);
      throw new Error('Failed to generate image');
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    console.log('Image generated successfully');

    return new Response(
      JSON.stringify({ imageUrl, revisedPrompt: data.data[0].revised_prompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-generate-image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
