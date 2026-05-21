'use client';

import React from 'react';
import { Card } from '../ui/Card/Card';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      username: string;
      avatar: string;
      isPremium: boolean;
    };
    _count: {
      likes: number;
      comments: number;
    };
    likes: any[];
  };
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const isLiked = post.likes.length > 0;

  return (
    <Card style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <img 
          src={post.author.avatar || 'https://via.placeholder.com/40'} 
          alt={post.author.username}
          style={{ width: '45px', height: '45px', borderRadius: '50%', border: post.author.isPremium ? '2px solid var(--color-accent)' : 'none' }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--color-text-main)' }}>{post.author.username}</span>
            {post.author.isPremium && <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--color-accent)', color: 'black', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>PREMIUM</span>}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <p style={{ color: 'var(--color-text-main)', lineHeight: '1.6', fontSize: '1rem', marginBottom: '1.5rem' }}>
        {post.content}
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px solid var(--color-surface-hover)', paddingTop: '1rem' }}>
        <button style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'none', 
          border: 'none', 
          color: isLiked ? 'var(--color-primary)' : 'var(--color-text-muted)',
          cursor: 'pointer',
          fontWeight: isLiked ? 'bold' : 'normal',
          transition: 'var(--transition-fast)'
        }}>
          {isLiked ? '❤️' : '🤍'} {post._count.likes}
        </button>

        <button style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'none', 
          border: 'none', 
          color: 'var(--color-text-muted)',
          cursor: 'pointer'
        }}>
          💬 {post._count.comments}
        </button>

        <button style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'none', 
          border: 'none', 
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          marginLeft: 'auto'
        }}>
          🔗 Compartir
        </button>
      </div>
    </Card>
  );
};
