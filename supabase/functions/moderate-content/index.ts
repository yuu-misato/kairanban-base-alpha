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
    const { text, context } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ isAllowed: true, violationType: 'none' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check key inside the request handler to ensure environment is ready
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured, skipping moderation and allowing content.');
      // Fallback: allow content if API key is missing
      return new Response(
        JSON.stringify({ isAllowed: true, violationType: 'none' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Moderating content:', { context, textLength: text.length });

    const systemPrompt = `あなたはコンテンツモデレーターです。以下のテキストを分析し、不適切な内容が含まれているかチェックしてください。

不適切な内容の判定基準:
- 誹謗中傷（他者を侮辱、攻撃、中傷する内容）
- 差別的表現（人種、性別、宗教、障害などに対する差別）
- わいせつな表現（性的な内容、下品な言葉）
- 暴力的な表現（脅迫、暴力を示唆する内容）
- スパム（無意味な繰り返し、広告目的の投稿）
- 詐欺的な内容（虚偽の情報、詐欺を示唆する内容）

重要な例外ルール:
- 絵文字（💩、🍑などを含む）、顔文字、アイコンは、それ自体が著しく攻撃的でない限り、許可してください。
- 文脈がビジネスや日常会話として成立している場合、多少の絵文字の使用は「下品」や「スパム」と判定しないでください。

ビジネスの文脈（${context === 'message' ? 'メッセージ' : context === 'project' ? '案件登録' : 'サービス登録'}）を考慮してください。
通常のビジネスコミュニケーションは許可してください。

以下のJSONフォーマットで回答してください:
{
  "isAllowed": boolean, // 許可する場合はtrue
  "reason": string, // 不許可の場合の理由（日本語）
  "violationType": "none" | "harassment" | "discrimination" | "obscene" | "spam" | "fraud" // 違反の種類
}`;

    // Use gemini-3-flash-preview as per 2025 availablity
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt + "\n\n" + `以下のテキストを判定してください:\n\n${text}` }]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      // Allow on API error
      return new Response(
        JSON.stringify({ isAllowed: true, violationType: 'none' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      throw new Error("Generated content is empty");
    }

    let result;
    try {
      result = JSON.parse(textContent);
    } catch (e) {
      console.error("JSON parse failed:", textContent);
      throw new Error("Failed to parse AI response");
    }

    console.log('Moderation result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Moderation error:', error);
    // Allow on error to not block users
    return new Response(
      JSON.stringify({ isAllowed: true, violationType: 'none' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
