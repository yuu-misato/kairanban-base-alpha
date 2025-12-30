import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Fetch AI chat settings and FAQs from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch system prompt and FAQs in parallel
    const [settingsResult, faqsResult] = await Promise.all([
      supabase
        .from("site_settings")
        .select("value")
        .eq("key", "ai_chat_system_prompt")
        .single(),
      supabase
        .from("faqs")
        .select("question, answer, category")
        .eq("is_published", true)
        .order("display_order"),
    ]);

    const baseSystemPrompt = settingsResult.data?.value || `あなたは建設業界のマッチングサービスのカスタマーサポートAIです。
丁寧で親切な対応を心がけ、以下のようなお問い合わせに対応してください：
- サービスの使い方
- 案件の投稿方法
- 応募方法
- 支払いについて
- 技術的な問題
- その他一般的な質問
- ユーザーに共感し、建設現場の用語なども理解して回答してください。

分からないことは正直に「担当者に確認が必要です」と伝え、お問い合わせフォームへの案内も行ってください。`;

    // Build FAQ knowledge base
    let faqKnowledge = "";
    if (faqsResult.data && faqsResult.data.length > 0) {
      const faqEntries = faqsResult.data.map((faq: any) =>
        `Q: ${faq.question}\nA: ${faq.answer}`
      ).join("\n\n");

      faqKnowledge = `

【FAQナレッジベース】
以下のFAQを参考に回答してください。該当する質問がある場合は、その回答をベースに丁寧に説明してください。

${faqEntries}

【回答の指針】
- FAQに関連する質問には、FAQの内容をベースに回答してください
- FAQにない質問は、サービス全般の知識を使って回答してください
- 不明な点は「担当者に確認が必要です」と伝えてください`;
    }

    const systemPrompt = baseSystemPrompt + faqKnowledge;

    console.log(`AI Chat: Using ${faqsResult.data?.length || 0} FAQs in knowledge base (Gemini via REST)`);

    // Prepare Gemini Request Body
    const contents = messages.slice(0, -1).filter((m: any) => m.role !== 'system').map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Add the current prompt (last message)
    const lastMessage = messages[messages.length - 1];
    contents.push({
      role: 'user',
      parts: [{ text: lastMessage.content }]
    });

    // gemini-3-flash-preview as per 2025
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      throw new Error(`Gemini API Error: ${geminiResponse.status} - ${errorText}`);
    }

    // Stream transformation (Gemini SSE -> OpenAI SSE)
    const reader = geminiResponse.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data:')) {
                const jsonStr = line.slice(5).trim(); // Remove 'data:'
                if (!jsonStr) continue;

                // Check for [DONE] isn't needed for Gemini usually, but we need to emit it for OpenAI client
                if (jsonStr === '[DONE]') break;

                try {
                  const data = JSON.parse(jsonStr);
                  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                  if (text) {
                    // Transform to OpenAI SSE format
                    const sseData = JSON.stringify({
                      choices: [{ delta: { content: text } }]
                    });
                    controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                  }
                } catch (e) {
                  // Ignore parse errors for partial chunks
                }
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error("Stream filtering error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("AI chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
