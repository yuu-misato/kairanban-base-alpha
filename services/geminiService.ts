import { supabase } from '@/integrations/supabase/client';

export const getLocalAssistantResponse = async (
    message: string,
    history: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
    try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: { message, history }
        });

        if (error) {
            console.error('AI Chat function error:', error);
            return '申し訳ありません、現在AIサービスとの通信に失敗しました。';
        }

        // Edge Functionからのレスポンス形式に合わせて調整
        // 一般的には { reply: "..." } や { message: "..." } で返ってくる想定
        return data?.reply || data?.message || data?.text || '応答を取得できませんでした。';
    } catch (err) {
        console.error('AI Chat invoke error:', err);
        return '予期せぬエラーが発生しました。';
    }
};
