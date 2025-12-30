import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, answers } = await req.json();

    console.log('Received request with profile:', profile);
    console.log('Received answers:', answers);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Build user prompt from answers
    const userPromptParts = [];

    if (profile?.company_name) {
      userPromptParts.push(`発注会社名: ${profile.company_name}`);
    }

    if (answers.constructionType) {
      const typeLabel = answers.constructionType === 'private' ? '民間' : '公共';
      userPromptParts.push(`工事種別: ${typeLabel}`);
    }

    if (answers.buildingType) {
      userPromptParts.push(`建物タイプ: ${answers.buildingType}`);
    }

    if (answers.scale) {
      userPromptParts.push(`工事規模: ${answers.scale}`);
    }

    if (answers.priorities && answers.priorities.length > 0) {
      userPromptParts.push(`重視する条件: ${answers.priorities.join('、')}`);
    }

    if (answers.regions && answers.regions.length > 0) {
      userPromptParts.push(`対応地域: ${answers.regions.join('、')}`);
    }

    if (answers.additionalDetails) {
      userPromptParts.push(`その他詳細: ${answers.additionalDetails}`);
    }

    const userPromptInputs = userPromptParts.join('\n');

    const systemPrompt = `あなたは足場工事の発注案件作成をサポートする専門アシスタントです。
以下の出力形式（JSON）に従って、魅力的なタイトルと詳細説明を生成してください。

【出力形式 (JSON)】
{
  "title": "50文字以内の魅力的で的確なタイトル",
  "description": "200-400文字程度の応募意欲を高める詳細説明"
}

【タイトル作成のポイント】
- 工事内容が一目で分かる明確な表現
- 50文字以内に収める
- 建物タイプや規模感が伝わるように
- 例：「〇〇マンション新築工事 足場設置」「商業ビル改修 仮設足場」

【詳細説明作成のポイント】
- 200〜400文字程度
- 工事の概要、規模、期間などを明確に
- 発注者の要望や重視するポイントを記載
- 丁寧で読みやすい文章にする
- 具体的な金額や日付は入れない`;

    const userPrompt = `以下の情報を元に生成してください。
${userPromptInputs}`;

    console.log('Calling Gemini API...');

    // Use gemini-3-flash-preview as per 2025 availablity
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
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-project-content:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'コンテンツの生成に失敗しました'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
