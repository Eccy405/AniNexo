'use client';

import { useState, useEffect } from 'react';

export function VerticalStoryRow() {
  const [stories, setStories] = useState<any[]>([]);
  
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchStories = async () => {
    try {
      if (!user?.id) return;
      const res = await fetch(`http://localhost:3001/api/social/stories?userId=${user.id}`);
      const data = await res.json();
      if (data.success) setStories(data.data);
    } catch (e) {
      console.error('Error fetching stories:', e);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  return (
    <div className="fb-stories-container">
      <div className="stories-scroll">
        {/* Create Story Card */}
        <div className="story-card create">
          <div className="story-media">
            <img src={user?.avatarUrl || '/default-avatar.png'} alt="" />
          </div>
          <div className="create-footer">
            <div className="plus-btn">+</div>
            <span>Crear historia</span>
          </div>
        </div>

        {/* Existing Stories */}
        {stories.map((group) => (
          <div key={group.user.id} className="story-card">
            <img src={group.stories[0]?.mediaUrl} className="story-bg" alt="" />
            <div className="user-avatar-overlay">
              <img src={group.user.avatarUrl || '/default-avatar.png'} alt="" />
            </div>
            <div className="story-username">
              {group.user.username}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .fb-stories-container { margin-bottom: 20px; overflow: hidden; }
        .stories-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
        .stories-scroll::-webkit-scrollbar { display: none; }
        
        .story-card { 
          min-width: 110px; height: 200px; border-radius: 12px; overflow: hidden; 
          position: relative; cursor: pointer; transition: transform 0.3s;
          background: #1c1e21; border: 1px solid rgba(255,255,255,0.05);
        }
        .story-card:hover { transform: scale(1.02); }
        .story-card:hover .story-bg { transform: scale(1.05); }

        .story-bg { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        
        .user-avatar-overlay { 
          position: absolute; top: 12px; left: 12px; width: 36px; height: 36px; 
          border-radius: 50%; border: 4px solid #00E5FF; padding: 2px;
          background: #1c1e21; z-index: 2;
        }
        .user-avatar-overlay img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        
        .story-username { 
          position: absolute; bottom: 12px; left: 12px; right: 12px; 
          color: white; font-size: 0.8rem; font-weight: 600; z-index: 2;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        }

        /* Create Story Specific */
        .story-card.create { display: flex; flex-direction: column; }
        .story-card.create .story-media { height: 70%; overflow: hidden; }
        .story-card.create .story-media img { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; }
        .create-footer { 
          height: 30%; background: #242526; display: flex; flex-direction: column; 
          align-items: center; justify-content: center; position: relative;
        }
        .plus-btn { 
          position: absolute; top: -16px; width: 32px; height: 32px; 
          background: #00E5FF; border: 4px solid #242526; border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; 
          color: black; font-size: 1.2rem; font-weight: 900;
        }
        .create-footer span { font-size: 0.75rem; font-weight: 700; color: white; margin-top: 10px; }
      `}</style>
    </div>
  );
}
