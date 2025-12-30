import { supabase } from '@/lib/supabase/client' // Import but usage will be mocked for now

// Mock Data
export const MOCK_POSTS = [
    {
        id: '1',
        community_id: 'c1',
        author_id: 'a1',
        content: '【重要】年末年始のゴミ収集について\n\n12月30日から1月3日までゴミ収集はお休みです。1月4日から通常通り再開しますので、計画的な排出をお願いします。',
        image_urls: ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop'],
        created_at: '2024-12-28T09:00:00Z',
        reads: 42
    },
    {
        id: '2',
        community_id: 'c1',
        author_id: 'a1',
        content: '夏祭りのボランティア募集のお知らせ\n\n来月の夏祭りに向けて、運営のお手伝いをしてくださる方を募集しています。興味のある方は公民館までご連絡ください。',
        image_urls: null,
        created_at: '2024-12-25T14:30:00Z',
        reads: 15
    }
];

export const MOCK_COMMUNITY_ID = 'c1'; // Default community for dev
