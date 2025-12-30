import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { file, mimeType } = await req.json();
        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured");
        }

        if (!file) {
            throw new Error("File content is missing");
        }

        const prompt = `
      あなたは地域の回覧板（画像やPDF）を読み取るAIアシスタントです。
      提供された画像から、「タイトル」と「詳細な内容」を抽出してください。
      
      以下のJSON形式のみで返してください：
      {
        "title": "抽出したタイトル（簡潔に）",
        "content": "抽出した詳細内容（重要な日時、場所、持ち物などは漏らさないように。改行を含めて読みやすく整形してください）"
      }
    `;

        // Gemini 1.5 Flash
        const model = 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: mimeType || 'image/jpeg',
                                data: file
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                response_mime_type: "application/json"
            }
        };

        const geminiResponse = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            console.error("Gemini Error:", errText);
            throw new Error(`Gemini API Error: ${errText}`);
        }

        const result = await geminiResponse.json();
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            throw new Error("No response from Gemini");
        }

        // Try to parse JSON (Gemini usually returns plain JSON string with responseMimeType, but safer to try/catch)
        let json;
        try {
            json = JSON.parse(textResponse);
        } catch {
            // If markdown code block wrappers exist
            const match = textResponse.match(/```json\n([\s\S]*)\n```/);
            if (match) {
                json = JSON.parse(match[1]);
            } else {
                // Fallback: simple text assign
                json = { title: "解析結果", content: textResponse };
            }
        }

        return new Response(JSON.stringify(json), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (e: any) {
        console.error("Critical Error:", e);
        return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
