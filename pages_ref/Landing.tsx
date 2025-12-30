import React from 'react';
import LandingPage from '@/components/LandingPage';
import { useAuth } from '@/hooks/useAuth';
import { useLineLogin } from '@/hooks/useLineLogin';
import { Navigate } from 'react-router-dom';

const Landing = () => {
    const { user } = useAuth();
    const { login } = useLineLogin();

    // 認証チェック中であっても、ユーザー情報がローカルになければ即座にLPを表示する


    const handlePreRegister = (nickname: string, areas: string[]) => {
        localStorage.setItem('pendingRegistration', JSON.stringify({ nickname, areas }));
        login('resident');
    };

    return (
        <LandingPage
            onLogin={() => login('resident')}
            onPreRegister={handlePreRegister}
            currentUser={user}
        />
    );
};

export default Landing;
