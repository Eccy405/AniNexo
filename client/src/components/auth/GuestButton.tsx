'use client';
import React from 'react';

interface Props {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const GuestButton: React.FC<Props> = ({ className, style, children }) => {
  const handleGuestLogin = () => {
    localStorage.setItem('user', JSON.stringify({ username: 'Invitado', role: 'USER', isGuest: true }));
    localStorage.removeItem('token');
    window.location.href = '/dashboard';
  };

  return (
    <button className={className} style={style} onClick={handleGuestLogin}>
      {children || '🚀 Entrar como Invitado'}
    </button>
  );
};
