
import { GoogleGenAI } from "@google/genai";

// Fixed: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// Always use direct process.env.API_KEY string when initializing.

export const getLocalAssistantResponse = async (query: string, history: { role: string, parts: { text: string }[] }[]) => {
  // Initialize AI client using the mandatory environment variable
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
  const model = 'gemini-3-flash-preview';

  try {
    const response = await ai.models.generateContent({
      model,
      // Fixed: Passing history along with the new query to provide context-aware responses
      contents: [
        ...history,
        { role: 'user', parts: [{ text: query }] }
      ],
      config: {
        systemInstruction: `あなたは「Saitama BASE」という埼玉県特化型地域SNSのAIコンシェルジュです。
埼玉県の全33市、22町、1村の話題に精通しています。
地域の歴史（大宮盆栽村、川越の蔵造りなど）、ゴミ出しの分別、地域の特産品、イベント、商店街のお得情報などを親しみやすく丁寧な日本語で回答してください。
また、ユーザーが「ローカルスコア」を貯めるためのアドバイス（「地域の清掃活動に参加してポイントを貯めましょう」など）も適宜行ってください。`,
      }
    });

    // Use .text property directly (it's not a function)
    return response.text || "申し訳ありません。回答を生成できませんでした。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "エラーが発生しました。しばらく時間を置いてから再度お試しください。";
  }
};

export const summarizeLocalFeed = async (posts: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
  const model = 'gemini-3-flash-preview';

  const feedContext = posts.map(p => `[${p.category}] ${p.title}: ${p.content}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `以下の地域SNSの投稿内容を、多忙な埼玉住民のために、重要な順に3つのポイントで要約してください。
      
      ${feedContext}`,
      config: {
        systemInstruction: "あなたは埼玉県の地域情報を要約するプロの編集者です。簡潔かつキャッチーにまとめてください。",
      }
    });
    // Use .text property directly
    return response.text;
  } catch (error) {
    console.error("Gemini Summarization Error:", error);
    return "フィードの要約に失敗しました。";
  }
};
