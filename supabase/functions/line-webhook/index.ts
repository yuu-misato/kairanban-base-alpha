import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-line-signature',
};

const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET')!;
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function verifySignature(body: string, signature: string): boolean {
  const hash = createHmac('sha256', LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  return hash === signature;
}

async function replyMessage(replyToken: string, messages: any[]) {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
  
  if (!response.ok) {
    console.error('Reply error:', await response.text());
  }
  return response;
}

async function getLineProfile(userId: string) {
  const response = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
    headers: {
      'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
  });
  
  if (response.ok) {
    return await response.json();
  }
  return null;
}

function generateLinkCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('x-line-signature');

    // Verify webhook signature
    if (!signature || !verifySignature(body, signature)) {
      console.error('Invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const data = JSON.parse(body);
    console.log('Webhook received:', JSON.stringify(data, null, 2));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    for (const event of data.events) {
      const lineUserId = event.source.userId;
      
      switch (event.type) {
        case 'follow': {
          // User added the bot as friend
          console.log('New follower:', lineUserId);
          
          const profile = await getLineProfile(lineUserId);
          const displayName = profile?.displayName || 'ゲスト';
          
          // Send improved welcome message with Flex Message
          await replyMessage(event.replyToken, [
            {
              type: 'flex',
              altText: `${displayName}さん、アシバッチへようこそ！`,
              contents: {
                type: 'bubble',
                size: 'mega',
                header: {
                  type: 'box',
                  layout: 'vertical',
                  backgroundColor: '#13358c',
                  paddingAll: 'xl',
                  contents: [
                    {
                      type: 'text',
                      text: '🎉 ようこそ！',
                      color: '#ffffff',
                      size: 'lg',
                      weight: 'bold',
                    },
                    {
                      type: 'text',
                      text: `${displayName}さん`,
                      color: '#ffffff',
                      size: 'xxl',
                      weight: 'bold',
                      margin: 'sm',
                    },
                    {
                      type: 'text',
                      text: 'アシバッチへの友だち追加ありがとうございます',
                      color: '#ffffffcc',
                      size: 'sm',
                      margin: 'md',
                      wrap: true,
                    },
                  ],
                },
                body: {
                  type: 'box',
                  layout: 'vertical',
                  paddingAll: 'xl',
                  spacing: 'lg',
                  contents: [
                    {
                      type: 'text',
                      text: '🔗 アカウント連携のメリット',
                      weight: 'bold',
                      size: 'md',
                      color: '#13358c',
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      spacing: 'md',
                      margin: 'md',
                      contents: [
                        {
                          type: 'box',
                          layout: 'horizontal',
                          spacing: 'md',
                          contents: [
                            {
                              type: 'text',
                              text: '📋',
                              size: 'lg',
                              flex: 0,
                            },
                            {
                              type: 'box',
                              layout: 'vertical',
                              flex: 1,
                              contents: [
                                {
                                  type: 'text',
                                  text: '新着案件をすぐ通知',
                                  size: 'sm',
                                  weight: 'bold',
                                  color: '#333333',
                                },
                                {
                                  type: 'text',
                                  text: 'あなたの対応エリアに新しい案件が登録されたらLINEでお知らせ',
                                  size: 'xs',
                                  color: '#888888',
                                  wrap: true,
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: 'box',
                          layout: 'horizontal',
                          spacing: 'md',
                          contents: [
                            {
                              type: 'text',
                              text: '💬',
                              size: 'lg',
                              flex: 0,
                            },
                            {
                              type: 'box',
                              layout: 'vertical',
                              flex: 1,
                              contents: [
                                {
                                  type: 'text',
                                  text: 'メッセージを見逃さない',
                                  size: 'sm',
                                  weight: 'bold',
                                  color: '#333333',
                                },
                                {
                                  type: 'text',
                                  text: '取引先からのメッセージをリアルタイムで通知',
                                  size: 'xs',
                                  color: '#888888',
                                  wrap: true,
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: 'box',
                          layout: 'horizontal',
                          spacing: 'md',
                          contents: [
                            {
                              type: 'text',
                              text: '✅',
                              size: 'lg',
                              flex: 0,
                            },
                            {
                              type: 'box',
                              layout: 'vertical',
                              flex: 1,
                              contents: [
                                {
                                  type: 'text',
                                  text: '応募結果をすぐ確認',
                                  size: 'sm',
                                  weight: 'bold',
                                  color: '#333333',
                                },
                                {
                                  type: 'text',
                                  text: '案件への応募が承認・却下されたらすぐにお知らせ',
                                  size: 'xs',
                                  color: '#888888',
                                  wrap: true,
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: 'separator',
                      margin: 'lg',
                    },
                    {
                      type: 'text',
                      text: '⬇️ 下のボタンから連携を開始 ⬇️',
                      size: 'xs',
                      color: '#f6c651',
                      weight: 'bold',
                      align: 'center',
                      margin: 'lg',
                    },
                  ],
                },
                footer: {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'sm',
                  paddingAll: 'lg',
                  contents: [
                    {
                      type: 'button',
                      style: 'primary',
                      height: 'md',
                      color: '#13358c',
                      action: {
                        type: 'message',
                        label: '🔗 連携コードを発行する',
                        text: '連携',
                      },
                    },
                    {
                      type: 'button',
                      style: 'secondary',
                      height: 'md',
                      action: {
                        type: 'uri',
                        label: '📱 アプリで設定画面を開く',
                        uri: 'https://liff.line.me/2008600703-aNmdY4Nq/settings/line',
                      },
                    },
                    {
                      type: 'text',
                      text: '「連携」と入力しても連携コードを発行できます',
                      size: 'xxs',
                      color: '#aaaaaa',
                      align: 'center',
                      margin: 'md',
                    },
                  ],
                },
              },
            },
          ]);
          break;
        }

        case 'unfollow': {
          // User blocked or unfriended the bot
          console.log('User unfollowed:', lineUserId);
          
          // Remove LINE account link
          await supabase
            .from('line_accounts')
            .delete()
            .eq('line_user_id', lineUserId);
          break;
        }

        case 'message': {
          if (event.message.type === 'text') {
            const text = event.message.text.trim();
            
            // Check if user is linked
            const { data: lineAccount } = await supabase
              .from('line_accounts')
              .select('*')
              .eq('line_user_id', lineUserId)
              .single();

            // Handle link request
            if (text === '連携' || text.toLowerCase() === 'link') {
              if (lineAccount) {
                await replyMessage(event.replyToken, [
                  {
                    type: 'text',
                    text: '✅ 既にアカウント連携済みです。\n\n連携を解除したい場合は、アシバッチのLINE設定画面から行ってください。',
                  },
                ]);
              } else {
                // Generate link code
                const profile = await getLineProfile(lineUserId);
                const code = generateLinkCode();
                const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

                // Delete old codes for this LINE user
                await supabase
                  .from('line_link_codes')
                  .delete()
                  .eq('line_user_id', lineUserId);

                // Insert new code
                const { error: insertError } = await supabase
                  .from('line_link_codes')
                  .insert({
                    line_user_id: lineUserId,
                    display_name: profile?.displayName,
                    picture_url: profile?.pictureUrl,
                    code,
                    expires_at: expiresAt.toISOString(),
                  });

                if (insertError) {
                  console.error('Failed to insert link code:', insertError);
                  await replyMessage(event.replyToken, [
                    {
                      type: 'text',
                      text: '⚠️ コードの発行に失敗しました。もう一度お試しください。',
                    },
                  ]);
                } else {
                  await replyMessage(event.replyToken, [
                    {
                      type: 'text',
                      text: '🔗 連携コードを発行しました\n\n以下のコードをコピーして、アシバッチの「LINE設定」画面で入力してください。\n\n⏰ 有効期限: 10分',
                    },
                    {
                      type: 'text',
                      text: code,
                    },
                  ]);
                }
              }
            } else if (text.includes('ヘルプ') || text.toLowerCase().includes('help')) {
              await replyMessage(event.replyToken, [
                {
                  type: 'text',
                  text: '📱 アシバッチ LINE連携ヘルプ\n\n' +
                    '【連携方法】\n' +
                    '「連携」と送信 → コードを取得 → アプリで入力\n\n' +
                    '【できること】\n' +
                    '✅ 新着案件の通知\n' +
                    '✅ メッセージ受信通知\n' +
                    '✅ 案件への応募通知\n' +
                    '✅ フォロー通知\n' +
                    '✅ レビュー通知\n\n' +
                    '【コマンド】\n' +
                    '・「連携」- 連携コードを発行\n' +
                    '・「ヘルプ」- このヘルプを表示',
                },
              ]);
            } else if (!lineAccount) {
              await replyMessage(event.replyToken, [
                {
                  type: 'text',
                  text: 'まだアカウント連携がお済みでないようです。\n\n「連携」と送信すると、6桁の連携コードを発行します。',
                },
              ]);
            } else {
              await replyMessage(event.replyToken, [
                {
                  type: 'text',
                  text: 'メッセージありがとうございます！\n\n何かお困りの場合は「ヘルプ」と送信してください。',
                },
              ]);
            }
          }
          break;
        }

        case 'postback': {
          // Handle postback actions from rich menu or buttons
          const postbackData = event.postback.data;
          console.log('Postback received:', postbackData);
          break;
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});