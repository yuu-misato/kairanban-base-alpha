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
    const { profile, answers } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Build context
    const companyName = profile?.company_name || '足場工事会社';
    const serviceAreas = profile?.service_areas?.join('、') || '対応地域未設定';
    const certifications = profile?.certifications?.join('、') || '';
    const equipment = profile?.equipment?.join('、') || '';
    const vehicles = profile?.vehicles?.join('、') || '';

    const constructionTypes = answers?.constructionTypes?.join('、') || '';
    const strengths = answers?.strengths?.join('、') || '';
    const scales = answers?.scales?.join('、') || '';
    const appealPoints = answers?.appealPoints || '';

    const systemPrompt = `あなたは足場工事会社の受注希望案件作成をサポートするアシスタントです。
以下の出力形式（JSON）に従って、魅力的なタイトルと詳細説明を生成してください。

【出力形式 (JSON)】
{
  "title": "50文字以内の魅力的で簡潔なタイトル",
  "description": "200-400文字程度の専門性と信頼感を伝える詳細説明"
}

【重要なポイント】
- タイトルは簡潔で魅力的に
- 詳細説明はですます調で丁寧に
- 対応エリアや強みを明確に含める
- 具体的な実績やアピールポイントを盛り込む`;

    const userPrompt = `以下の情報を元に生成してください。
【会社情報】
- 会社名: ${companyName}
- 対応エリア: ${serviceAreas}
${certifications ? `- 保有資格: ${certifications}` : ''}
${equipment ? `- 保有機材: ${equipment}` : ''}
${vehicles ? `- 保有車両: ${vehicles}` : ''}

【希望条件】
- 対応可能な工事: ${constructionTypes || '未選択'}
- 強み・特徴: ${strengths || '未選択'}
- 対応可能規模: ${scales || '未選択'}
${appealPoints ? `- アピールポイント: ${appealPoints}` : ''}`;

    // Use current available model as of 2025
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data));

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

    return new Response(JSON.stringify({
      title: result.title,
      description: result.description,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-listing-content:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "生成に失敗しました"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
