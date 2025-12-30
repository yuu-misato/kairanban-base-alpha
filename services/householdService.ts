import { supabase } from './supabaseService';

export interface Household {
    id: string;
    name: string;
    address?: string;
    created_by: string;
    members?: HouseholdMember[];
}

export interface HouseholdMember {
    id: string;
    household_id: string;
    user_id?: string;
    nickname: string;
    role: 'head' | 'member' | 'dependent';
}

export const createHousehold = async (name: string, userId: string, address?: string) => {
    // 1. Create Household
    const { data: household, error: householdError } = await supabase
        .from('households' as any)
        .insert({ name, address, created_by: userId })
        .select()
        .single();
    // ...
    const { data: member, error: memberError } = await supabase
        .from('household_members' as any)
        .insert({
            household_id: household.id,
            user_id: userId,
            nickname: '管理者', // 初期値
            role: 'head'
        })
        .select()
        .single();
    // ...
    const { data, error } = await supabase
        .from('households' as any)

    // ...
    const { data, error } = await supabase
        .from('household_members' as any)
        .insert({
            household_id: householdId,
            nickname,
            role: 'dependent' // スマホなし家族
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};
