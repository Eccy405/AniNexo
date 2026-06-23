'use client';

import { useState, useEffect } from 'react';

interface DisplayStory {
  id: string;
  username: string;
  avatarUrl: string;
  mediaUrl: string;
}

export function VerticalStoryRow() {
  const [stories, setStories] = useState<any[]>([]);
  
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  const mockStories = [
    {
      userId: '2',
      user: { username: 'Alejandra Colmenares', avatarUrl: 'https://ui-avatars.com/api/?name=Alejandra&background=c2185b&color=fff' },
      mediaUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&q=80'
    },
    {
      userId: '3',
      user: { username: 'Jerson Camilo', avatarUrl: 'https://ui-avatars.com/api/?name=Jerson+Camilo&background=00838f&color=fff' },
      mediaUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&q=80'
    },
    {
      userId: '4',
      user: { username: 'Zoro Roronoa', avatarUrl: 'https://ui-avatars.com/api/?name=Zoro+Roronoa&background=2e7d32&color=fff' },
      mediaUrl: 'https://images.unsplash.com/photo-1541562232579-512a21360020?w=300&q=80'
    },
    {
      userId: '5',
      user: { username: 'Camila Uzuga', avatarUrl: 'https://ui-avatars.com/api/?name=Camila&background=e65100&color=fff' },
      mediaUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=300&q=80'
    }
  ];

  const fetchStories = async () => {
    try {
      if (!user?.id) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/social/stories?userId=${user.id}`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setStories(data.data);
      }
    } catch (e) {
      console.error('Error fetching stories:', e);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const displayStories: DisplayStory[] = stories.length > 0 
    ? stories.map(g => ({
        id: g.user.id,
        username: g.user.username,
        avatarUrl: g.user.avatarUrl,
        mediaUrl: g.stories[0]?.mediaUrl || ''
      }))
    : mockStories.map((m, idx) => ({
        id: m.userId,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
        mediaUrl: m.mediaUrl
      }));

  return (
    <div className="fb-stories-container">
      <div className="stories-scroll">
        {/* Create Story Card */}
        <div className="story-card create">
          <div className="story-media">
            <img src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=User'} alt="" />
          </div>
          <div className="create-footer">
            <div className="plus-btn">+</div>
            <span>Crear historia</span>
          </div>
        </div>

        {/* Existing / Mock Stories */}
        {displayStories.map((story) => (
          <div key={story.id} className="story-card">
            <img src={story.mediaUrl} className="story-bg" alt="" />
            <div className="user-avatar-overlay">
              <img src={story.avatarUrl || 'https://ui-avatars.com/api/?name=User'} alt="" />
            </div>
            <div className="story-username">
              {story.username}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .fb-stories-container { 
          margin-bottom: 24px; 
          overflow: hidden; 
          width: 100%;
        }

        .stories-scroll { 
          display: flex; 
          gap: 12px; 
          overflow-x: auto; 
          padding: 5px 0 12px; 
          scrollbar-width: none; 
        }

        .stories-scroll::-webkit-scrollbar { 
          display: none; 
        }
        
        .story-card { 
          min-width: 115px; 
          width: 115px;
          height: 195px; 
          border-radius: 14px; 
          overflow: hidden; 
          position: relative; 
          cursor: pointer; 
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background: rgba(255, 255, 255, 0.02); 
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .story-card:hover { 
          transform: translateY(-4px); 
          border-color: rgba(0, 229, 255, 0.4);
          box-shadow: 0 8px 25px rgba(0, 229, 255, 0.15), 0 0 10px rgba(124, 77, 255, 0.1);
        }

        .story-card:hover .story-bg { 
          transform: scale(1.08); 
          filter: brightness(0.9);
        }

        .story-bg { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          transition: all 0.4s ease; 
          filter: brightness(0.7);
        }
        
        .user-avatar-overlay { 
          position: absolute; 
          top: 10px; 
          left: 10px; 
          width: 36px; 
          height: 36px; 
          border-radius: 50%; 
          border: 2px solid var(--color-primary); 
          padding: 1.5px;
          background: #050505; 
          z-index: 2;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
          transition: transform 0.3s ease;
        }

        .story-card:hover .user-avatar-overlay {
          transform: scale(1.1);
        }

        .user-avatar-overlay img { 
          width: 100%; 
          height: 100%; 
          border-radius: 50%; 
          object-fit: cover; 
        }
        
        .story-username { 
          position: absolute; 
          bottom: 10px; 
          left: 10px; 
          right: 10px; 
          color: white; 
          font-size: 0.75rem; 
          font-weight: 800; 
          z-index: 2;
          text-shadow: 0 2px 6px rgba(0,0,0,0.9);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.25;
        }

        /* Create Story Specific */
        .story-card.create { 
          display: flex; 
          flex-direction: column; 
        }

        .story-card.create .story-media { 
          height: 70%; 
          overflow: hidden; 
        }

        .story-card.create .story-media img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          opacity: 0.55; 
          transition: transform 0.4s;
        }

        .story-card.create:hover .story-media img {
          transform: scale(1.08);
        }

        .create-footer { 
          height: 30%; 
          background: rgba(15, 15, 15, 0.95); 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          position: relative;
        }

        .plus-btn { 
          position: absolute; 
          top: -16px; 
          width: 32px; 
          height: 32px; 
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          border: 3px solid #0a0a0a; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: black; 
          font-size: 1.2rem; 
          font-weight: 900;
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.5);
          transition: transform 0.2s;
        }

        .story-card.create:hover .plus-btn {
          transform: scale(1.1) rotate(90deg);
        }

        .create-footer span { 
          font-size: 0.72rem; 
          font-weight: 800; 
          color: #e4e6eb; 
          margin-top: 12px; 
        }
      `}</style>
    </div>
  );
}
