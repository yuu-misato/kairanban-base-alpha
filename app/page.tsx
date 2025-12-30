'use client';

import React from 'react';
import LandingPage from '@/components/LandingPage';
import { useAuth } from '@/hooks/useAuth';
import { useLineLogin } from '@/hooks/useLineLogin';

export default function Page() {
  const { user } = useAuth();
  const { login } = useLineLogin();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const inviteId = params.get('invite_community');
      if (inviteId) {
        localStorage.setItem('pendingInviteCommunityId', inviteId);
      }
    }
  }, []);

  const handlePreRegister = (nickname: string, areas: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingRegistration', JSON.stringify({ nickname, areas }));
    }
    login('resident');
  };

  return (
    <LandingPage
      onLogin={() => login('resident')}
      onPreRegister={handlePreRegister}
      currentUser={user}
    />
  );
}
