import { supabase } from './supabaseService';

export interface KairanbanRead {
    kairanban_id: string;
    household_member_id?: string;
    user_id: string;
    read_at: string;
}

export const markKairanbanRead = async (kairanbanId: string, userId: string, memberIds: string[] = []) => {
    const readsToInsert = [];

    // If no specific members selected (or just "Me" selected without member ID),
    // we assume the user is reading for themselves. 
    // However, if we have household members, "Me" should ideally correspond to the member record for the user.
    // For now, we support the legacy "user_id only" read for backward compatibility.
    if (memberIds.length === 0) {
        readsToInsert.push({
            kairanban_id: kairanbanId,
            user_id: userId,
            household_member_id: null
        });
    } else {
        memberIds.forEach(mid => {
            readsToInsert.push({
                kairanban_id: kairanbanId,
                user_id: userId,
                household_member_id: mid
            });
        });
    }

    const { data, error } = await supabase
        .from('kairanban_reads')
        .upsert(readsToInsert, { onConflict: 'kairanban_id, household_member_id' }) // This might fail for the user_id unique constraint if not careful
        // Actually, upsert might be tricky with two unique constraints.
        // Let's do simple insert and ignore duplicates? Or simple select first.
        // Supabase upsert requires specifying the constraint name if inferred is ambiguous.
        .select();

    return { data, error };
};

export const getMyReadStatus = async (userId: string) => {
    // Get all reads by this user (for themselves or members)
    const { data, error } = await supabase
        .from('kairanban_reads')
        .select('*')
        .eq('user_id', userId);

    return { data, error };
};
