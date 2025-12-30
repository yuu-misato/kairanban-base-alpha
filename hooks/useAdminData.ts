import { useState, useCallback } from 'react';
import { getAllUsersWithPlans, getMissions, getAllCommunities } from '../services/supabaseService';
import { User, VolunteerMission, Community } from '../types';

export interface AdminUser extends User {
    plan_type?: string;
    current_usage?: number;
    score: number;
}

export const useAdminData = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [missions, setMissions] = useState<VolunteerMission[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const fetchData = useCallback(async (tab: 'users' | 'missions' | 'communities' | 'support' | 'logs') => {
        setIsLoading(true);
        setErrors([]);
        try {
            if (tab === 'users') {
                const { data, error } = await getAllUsersWithPlans();
                if (error) throw error;
                // Map DB user to AdminUser type safely
                setUsers((data || []).map((u: any) => ({
                    id: u.id,
                    nickname: u.nickname,
                    role: u.role || 'resident',
                    avatar: u.avatar_url,
                    selectedAreas: u.selected_areas || [],
                    isVerified: u.is_verified || false,
                    score: u.score || 0,
                    level: u.level || 1, // Default level
                    isLineConnected: !!u.line_user_id, // Assume connected if line ID exists
                    plan_type: u.plan_type,
                    current_usage: u.current_usage
                })));
            } else if (tab === 'missions') {
                const { data, error } = await getMissions();
                if (error) throw error;
                setMissions(data || []);
            } else if (tab === 'communities') {
                const { data, error } = await getAllCommunities();
                if (error) throw error;
                setCommunities(data || []);
            }
            // Support and Logs omitted for brevity in this refactor step, can add later
        } catch (err: any) {
            console.error(err);
            setErrors(prev => [...prev, err.message || 'Failed to fetch data']);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { isLoading, users, missions, communities, errors, fetchData };
};
