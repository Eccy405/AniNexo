'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { FeedList } from '../../../components/feed/FeedList';
import { FriendsModal } from '../../../components/profile/FriendsModal';
import { SavedPostsModal } from '../../../components/feed/SavedPostsModal';
import { MemoriesModal } from '../../../components/feed/MemoriesModal';
import { 
  Sparkles, 
  Users, 
  Bookmark, 
  History, 
  Award, 
  Search, 
  MoreHorizontal, 
  Plus, 
  ChevronDown, 
  Compass,
  Tv,
  Gift,
  MessageCircle,
  X,
  Camera,
  Palette
} from 'lucide-react';

interface RecentAnime {
  id: string;
  title: string;
  coverImage: string;
  lastVisited: string;
}

const groupThemes = [
  { name: 'Blue', gradient: 'linear-gradient(135deg, #00E5FF, #00B8D4)' },
  { name: 'Purple', gradient: 'linear-gradient(135deg, #9C27B0, #673AB7)' },
  { name: 'Red', gradient: 'linear-gradient(135deg, #F44336, #E91E63)' },
  { name: 'Green', gradient: 'linear-gradient(135deg, #4CAF50, #8BC34A)' },
  { name: 'Orange', gradient: 'linear-gradient(135deg, #FF9800, #FFC107)' },
  { name: 'Pink', gradient: 'linear-gradient(135deg, #E91E63, #F06292)' },
];

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [searchContact, setSearchContact] = useState('');
  const [showAllLeftItems, setShowAllLeftItems] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(groupThemes[0].gradient);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [userFriends, setUserFriends] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [showChatBubble, setShowChatBubble] = useState(false);

  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showMemoriesModal, setShowMemoriesModal] = useState(false);

  const contacts = [
    { id: '1', name: 'Meta AI', avatar: 'https://ui-avatars.com/api/?name=Meta+AI&background=6200ea&color=fff', isAI: true, verified: true },
    { id: '2', name: 'Jerson Camilo Umbarila Hincapie', avatar: 'https://ui-avatars.com/api/?name=Jerson+Camilo&background=00838f&color=fff' },
    { id: '3', name: 'Alejandra Colmenares', avatar: 'https://ui-avatars.com/api/?name=Alejandra&background=c2185b&color=fff' },
    { id: '4', name: 'Camila Uzuga', avatar: 'https://ui-avatars.com/api/?name=Camila&background=e65100&color=fff' },
    { id: '5', name: 'Mi Papito', avatar: 'https://ui-avatars.com/api/?name=Mi+Papito&background=455a64&color=fff' },
    { id: '6', name: 'Maria Sanchez', avatar: 'https://ui-avatars.com/api/?name=Maria&background=ad1457&color=fff' },
    { id: '7', name: 'Valentina Gavilán', avatar: 'https://ui-avatars.com/api/?name=Valentina&background=00695c&color=fff' },
    { id: '8', name: 'Francia Pérez', avatar: 'https://ui-avatars.com/api/?name=Francia&background=37474f&color=fff' },
    { id: '9', name: 'Melany Espinoza', avatar: 'https://ui-avatars.com/api/?name=Melany&background=d84315&color=fff' },
    { id: '10', name: 'Axel Daniel Villegas', avatar: 'https://ui-avatars.com/api/?name=Axel&background=1565c0&color=fff' }
  ];

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch (e) {
        console.error('Error parsing user', e);
      }
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchUserFriends();
      fetchUserConversations();
    }
  }, [user]);

  const fetchUserFriends = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/friends/list/${user.id}`);
      const data = await res.json();
      if (data.success) {
        setUserFriends(data.data);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  const fetchUserConversations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/messaging/user/${user.id}`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/search/global?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data.users || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchUsers(searchContact), 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchContact, searchUsers]);

  const handleConfirmRequest = (id: string) => {
    setFriendRequests(prev => prev.filter(req => req.id !== id));
  };

  const handleDeleteRequest = (id: string) => {
    setFriendRequests(prev => prev.filter(req => req.id !== id));
  };

  const handleCreateGroup = async () => {
    if (!user?.id || !groupName.trim() || selectedParticipants.length === 0) return;

    try {
      const allParticipants = [...selectedParticipants, user.id];
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/messaging/group/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          name: groupName,
          participantIds: allParticipants,
          avatar: groupAvatar || undefined,
          theme: selectedTheme
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setShowGroupModal(false);
        setGroupName('');
        setGroupAvatar('');
        setSelectedParticipants([]);
        fetchUserConversations();
        window.location.href = `/dashboard/chat/${data.data.id}`;
      } else {
        console.error('Error creating group:', data.message);
      }
    } catch (err) {
      console.error('Error creating group:', err);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, friendId })
      });
      
      const data = await res.json();
      if (data.success) {
        setSearchContact('');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchContact.toLowerCase())
  );

  const leftNavItems = [
    { label: 'Nexo AI', icon: <Sparkles size={20} className="icon-glow" />, href: '/dashboard/chat', color: '#00E5FF', action: null },
    { label: 'Amigos', icon: <Users size={20} />, href: '#', color: '#00E5FF', action: () => setShowFriendsModal(true) },
    { label: 'Recuerdos', icon: <History size={20} />, href: '#', color: '#ffa500', action: () => setShowMemoriesModal(true) },
    { label: 'Guardado', icon: <Bookmark size={20} />, href: '#', color: '#4CAF50', action: () => setShowSavedModal(true) },
    { label: 'Logros y Medallas', icon: <Award size={20} />, href: '#', color: '#FFD700', action: null },
    { label: 'Grupos temáticos', icon: <Compass size={20} />, href: '/dashboard/groups', color: '#9C27B0', action: null }
  ];

  const shortcuts = [
    { name: 'VALORANT - LATAM', image: 'https://ui-avatars.com/api/?name=VAL&background=f44336&color=fff' },
    { name: 'VALORANT Colombia', image: 'https://ui-avatars.com/api/?name=COL&background=3f51b5&color=fff' },
    { name: 'HailSylvie Community', image: 'https://ui-avatars.com/api/?name=HAIL&background=e91e63&color=fff' },
    { name: 'Valorant COMPETITIVO LATAM', image: 'https://ui-avatars.com/api/?name=COMP&background=009688&color=fff' }
  ];

  return (
    <div className="community-page">
      <div className="fb-layout-container">
        
        {/* Columna Izquierda (Navegación & Accesos Directos) */}
        <aside className="left-sidebar">
          <div className="sidebar-scrollable">
            <Link href={`/dashboard/profile/${user?.username || ''}`} className="sidebar-link profile-item">
              <img 
                src={user?.avatarUrl || 'https://ui-avatars.com/api/?name=User'} 
                alt={user?.username} 
                className="user-avatar"
              />
              <span className="link-label">{user?.username || 'Mi Perfil'}</span>
            </Link>

{leftNavItems.map((item, idx) => (
              item.action ? (
                <button key={idx} className="sidebar-link" onClick={item.action}>
                  <span className="icon-wrapper" style={{ color: item.color || 'var(--color-primary)' }}>
                    {item.icon}
                  </span>
                  <span className="link-label">{item.label}</span>
                </button>
              ) : (
                <Link key={idx} href={item.href} className="sidebar-link">
                  <span className="icon-wrapper" style={{ color: item.color || 'var(--color-primary)' }}>
                    {item.icon}
                  </span>
                  <span className="link-label">{item.label}</span>
                </Link>
              )
            ))}

            <button className="sidebar-link show-more" onClick={() => setShowAllLeftItems(!showAllLeftItems)}>
              <span className="icon-wrapper">
                <ChevronDown size={20} style={{ transform: showAllLeftItems ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
              </span>
              <span className="link-label">{showAllLeftItems ? 'Ver menos' : 'Ver más'}</span>
            </button>

            <div className="sidebar-divider" />

            <div className="shortcuts-section">
              <div className="section-header">
                <h3>Tus accesos directos</h3>
              </div>

              {shortcuts.map((shortcut, idx) => (
                <Link key={idx} href="#" className="sidebar-link shortcut-item">
                  <img src={shortcut.image} alt={shortcut.name} className="shortcut-img" />
                  <span className="link-label">{shortcut.name}</span>
                </Link>
              ))}
            </div>

            <footer className="sidebar-footer">
              <p>Privacidad • Condiciones • Publicidad • Opciones de anuncios • Cookies • Más • Meta © 2026</p>
            </footer>
          </div>
        </aside>

        {/* Columna Central (Feed Principal) */}
        <main className="center-feed">
          <FeedList />
        </main>

        {/* Columna Derecha (Contactos & Actividades) */}
        <aside className="right-sidebar">
          <div className="sidebar-scrollable">
            
            {/* Solicitudes de amistad */}
            {friendRequests.length > 0 && (
              <div className="right-section friend-requests">
                <div className="section-header">
                  <h3>Solicitudes de amistad</h3>
                  <button className="header-action-btn">Ver todo</button>
                </div>

                <div className="requests-list">
                  {friendRequests.map(req => (
                    <div key={req.id} className="request-card">
                      <img src={req.avatar} alt={req.name} className="request-avatar" />
                      <div className="request-info">
                        <div className="request-header">
                          <span className="request-name">{req.name}</span>
                          <span className="request-time">{req.time}</span>
                        </div>
                        <span className="request-subtitle">{req.mutual}</span>
                        <div className="request-actions">
                          <button 
                            className="btn-confirm" 
                            onClick={() => handleConfirmRequest(req.id)}
                          >
                            Confirmar
                          </button>
                          <button 
                            className="btn-delete" 
                            onClick={() => handleDeleteRequest(req.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="sidebar-divider" />
              </div>
            )}

            {/* Cumpleaños */}
            <div className="right-section birthdays">
              <div className="section-header">
                <h3>Cumpleaños</h3>
              </div>
              <div className="birthday-card">
                <Gift size={28} className="gift-icon" />
                <p className="birthday-text">
                  Hoy es el cumpleaños de <strong>Sofía Castro</strong> y otro contacto.
                </p>
              </div>
              <div className="sidebar-divider" />
            </div>

            {/* Contactos */}
            <div className="right-section contacts">
              <div className="section-header">
                <h3>Contactos</h3>
                <div className="header-icons">
                  <div className="contact-search-box">
                    <Search size={16} className="search-icon-inside" />
                    <input 
                      type="text" 
                      placeholder="Buscar contacto..." 
                      value={searchContact}
                      onChange={(e) => setSearchContact(e.target.value)}
                    />
                  </div>
                  <button className="icon-btn"><MoreHorizontal size={18} /></button>
                </div>
              </div>

<div className="contacts-list">
                {searchContact.length > 0 ? (
                  searchResults.length > 0 ? (
                    searchResults.map(u => (
                      <div key={u.id} className="contact-item">
                        <Link href={`/dashboard/profile/${u.username}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <div className="avatar-wrapper">
                            <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.username}`} alt={u.username} className="contact-avatar" />
                            <span className="online-badge" />
                          </div>
                          <span className="contact-name">
                            @{u.username}
                            {u.isPremium && <span className="premium-badge">★</span>}
                          </span>
                        </Link>
                        <button 
                          className="add-friend-btn"
                          onClick={() => sendFriendRequest(u.id)}
                          aria-label="Agregar amigo"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))
                  ) : !searching ? (
                    <p className="no-contacts">No se encontraron usuarios</p>
                  ) : (
                    <p className="no-contacts">Buscando...</p>
                  )
                ) : (
                  <p className="no-contacts">Escribe para buscar usuarios</p>
                )}
              </div>
            </div>

{/* Chats en grupo */}
             <div className="right-section group-chats">
               <div className="section-header">
                 <h3>Chats en grupo</h3>
               </div>
               <button className="btn-create-group" onClick={() => setShowGroupModal(true)}>
                 <Plus size={20} />
                 <span>Crear chat en grupo</span>
               </button>
             </div>

             {/* Chat Bubble Flotante */}
             <button className="chat-bubble-btn" onClick={() => setShowChatBubble(!showChatBubble)}>
               <MessageCircle size={24} />
               {conversations.filter((c: any) => c.messages?.[0] && !c.messages[0].isRead).length > 0 && (
                 <span className="chat-badge">
                   {conversations.filter((c: any) => c.messages?.[0] && !c.messages[0].isRead).length}
                 </span>
               )}
             </button>

             {showChatBubble && (
               <div className="chat-bubble-popup" onClick={(e) => e.stopPropagation()}>
                 <div className="chat-bubble-header">
                   <h4>Mensajes</h4>
                   <button onClick={() => setShowChatBubble(false)}>
                     <X size={18} />
                   </button>
                 </div>
                 <div className="chat-bubble-list">
                   {conversations.length > 0 ? (
                     conversations.map((conv: any) => (
                       <Link href={`/dashboard/chat/${conv.id}`} key={conv.id} className="chat-bubble-item">
                         <div className="chat-bubble-avatar" style={{ background: conv.avatar ? undefined : conv.theme || '#00E5FF' }}>
                           {conv.avatar ? (
                             <img src={conv.avatar} alt={conv.name} />
                           ) : (
                             <span>{conv.name?.charAt(0) || 'G'}</span>
                           )}
                         </div>
                         <div className="chat-bubble-info">
                           <span className="chat-bubble-name">{conv.name || (conv.isGroup ? 'Grupo' : 'Chat')}</span>
                           <span className="chat-bubble-preview">
                             {conv.messages?.[0]?.content?.substring(0, 30) || 'Sin mensajes'}...
                           </span>
                         </div>
                         {!conv.messages?.[0]?.isRead && <span className="chat-unread-dot" />}
                       </Link>
                     ))
                   ) : (
                     <p className="no-chats">No tienes conversaciones</p>
                   )}
                 </div>
               </div>
             )}

             {/* Modal para crear grupo */}
             {showGroupModal && (
               <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
                 <div className="modal-content group-modal" onClick={(e) => e.stopPropagation()}>
                   <button className="modal-close" onClick={() => setShowGroupModal(false)}>
                     <X size={20} />
                   </button>
                   <h3>Crear grupo</h3>
                   
                   <div className="group-avatar-section">
                     <div className="group-avatar-preview" style={{ background: selectedTheme }}>
                       {groupAvatar ? (
                         <img src={groupAvatar} alt="Grupo" />
                       ) : (
                         <Camera size={32} />
                       )}
                     </div>
                     <div className="group-theme-picker">
                       <Palette size={16} />
                       <div className="theme-options">
                         {groupThemes.map((theme) => (
                           <button
                             key={theme.name}
                             className={`theme-option ${selectedTheme === theme.gradient ? 'selected' : ''}`}
                             style={{ background: theme.gradient }}
                             onClick={() => setSelectedTheme(theme.gradient)}
                           />
                         ))}
                       </div>
                     </div>
                   </div>

                   <input
                     type="text"
                     placeholder="Nombre del grupo"
                     value={groupName}
                     onChange={(e) => setGroupName(e.target.value)}
                     className="modal-input"
                   />
                   
                   <input
                     type="url"
                     placeholder="URL del avatar (opcional)"
                     value={groupAvatar}
                     onChange={(e) => setGroupAvatar(e.target.value)}
                     className="modal-input"
                   />

                   <div className="modal-section">
                     <h4>Agregar participantes</h4>
                     <div className="participants-list">
                       {userFriends.length > 0 ? (
                         userFriends.map((friend: any) => (
                           <label key={friend.id} className="participant-item">
                             <input
                               type="checkbox"
                               checked={selectedParticipants.includes(friend.id)}
                               onChange={(e) => {
                                 if (e.target.checked) {
                                   setSelectedParticipants([...selectedParticipants, friend.id]);
                                 } else {
                                   setSelectedParticipants(selectedParticipants.filter(id => id !== friend.id));
                                 }
                               }}
                             />
                             <img src={friend.avatarUrl || `https://ui-avatars.com/api/?name=${friend.username}`} alt={friend.username} />
                             <span>@{friend.username}</span>
                           </label>
                         ))
                       ) : (
                         <p className="no-friends">Busca usuarios y agrega amigos para incluirlos en el grupo</p>
                       )}
                     </div>
                   </div>

                   <div className="modal-actions">
                     <button onClick={() => setShowGroupModal(false)} className="btn-modal-cancel">Cancelar</button>
                     <button 
                       onClick={handleCreateGroup} 
                       className="btn-modal-create"
                       disabled={!groupName.trim() || selectedParticipants.length === 0}
                     >
                       Crear grupo
                     </button>
                   </div>
                 </div>
</div>
                )}

              {/* Modales de Amigos, Guardado y Recuerdos */}
              {showFriendsModal && user && (
                <FriendsModal
                  userId={user.id}
                  onClose={() => setShowFriendsModal(false)}
                  currentUser={user}
                />
              )}
              {showSavedModal && user && (
                <SavedPostsModal
                  userId={user.id}
                  onClose={() => setShowSavedModal(false)}
                />
              )}
              {showMemoriesModal && user && (
                <MemoriesModal
                  userId={user.id}
                  onClose={() => setShowMemoriesModal(false)}
                />
              )}

           </div>
         </aside>

      </div>

      <style jsx>{`
        .community-page {
          background-color: #090909;
          color: #f7f9fa;
          min-height: 100vh;
          width: 100%;
          font-family: var(--font-whyte-inktrap), sans-serif;
        }

        .fb-layout-container {
          display: grid;
          grid-template-columns: 360px 1fr 360px;
          height: calc(100vh - 70px);
          max-width: 1920px;
          margin: 0 auto;
          position: relative;
        }

        /* Sidebar styles */
        .left-sidebar, .right-sidebar {
          height: 100%;
          overflow: hidden;
          position: sticky;
          top: 70px;
        }

        .sidebar-scrollable {
          height: 100%;
          overflow-y: auto;
          padding: 16px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Hide scrollbars but keep functionality */
        .sidebar-scrollable::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scrollable::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollable::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .sidebar-scrollable::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Links on sidebar */
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #e4e6eb;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: background-color 0.2s;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .sidebar-link:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          color: #00E5FF;
          transition: transform 0.2s;
        }
        
        .sidebar-link:hover .icon-wrapper {
          transform: scale(1.05);
          background: rgba(0, 229, 255, 0.1);
        }

        .icon-glow {
          filter: drop-shadow(0 0 5px #00E5FF);
        }

        .link-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 8px 12px;
        }

        /* Shortcuts */
        .shortcuts-section {
          margin-top: 10px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          margin-bottom: 4px;
        }

        .section-header h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #b0b3b8;
          margin: 0;
        }

        .header-action-btn {
          background: none;
          border: none;
          color: #00E5FF;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 4px;
          padding: 4px 8px;
        }

        .header-action-btn:hover {
          background-color: rgba(0, 229, 255, 0.05);
        }

        .shortcut-img {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          object-fit: cover;
        }

        .sidebar-footer {
          padding: 16px 12px;
          font-size: 0.75rem;
          color: #6b6b6b;
          line-height: 1.4;
        }

        /* Center Feed styles */
        .center-feed {
          padding: 20px 0;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .center-feed::-webkit-scrollbar {
          display: none;
        }

        /* Right Sidebar & interactive modules */
        .right-section {
          display: flex;
          flex-direction: column;
          margin-bottom: 12px;
        }

        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0 8px;
        }

        .request-card {
          display: flex;
          gap: 12px;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.03);
          transition: all 0.3s ease;
        }

        .request-card:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .request-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
        }

        .request-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .request-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .request-name {
          font-weight: 700;
          color: white;
          font-size: 0.95rem;
        }

        .request-time {
          font-size: 0.75rem;
          color: #6b6b6b;
        }

        .request-subtitle {
          font-size: 0.8rem;
          color: #b0b3b8;
          margin-top: 2px;
          margin-bottom: 8px;
        }

        .request-actions {
          display: flex;
          gap: 8px;
        }

        .request-actions button {
          flex: 1;
          padding: 8px 12px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          border: none;
          transition: filter 0.2s;
        }

        .btn-confirm {
          background-color: #00E5FF;
          color: black;
        }

        .btn-delete {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .request-actions button:hover {
          filter: brightness(1.1);
        }

        /* Birthdays */
        .birthday-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(255, 179, 0, 0.05), transparent);
          border: 1px solid rgba(255, 179, 0, 0.1);
        }

        .gift-icon {
          color: #ffb300;
          filter: drop-shadow(0 0 4px rgba(255, 179, 0, 0.3));
        }

        .birthday-text {
          font-size: 0.85rem;
          color: #e4e6eb;
          line-height: 1.4;
          margin: 0;
        }

        /* Contacts search & list */
        .header-icons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .contact-search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .contact-search-box input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 4px 8px 4px 28px;
          color: white;
          font-size: 0.8rem;
          width: 140px;
          outline: none;
          transition: width 0.3s;
        }

        .contact-search-box input:focus {
          width: 180px;
          border-color: #00E5FF;
        }

        .search-icon-inside {
          position: absolute;
          left: 8px;
          color: #888;
        }

        .icon-btn {
          background: transparent;
          border: none;
          color: #b0b3b8;
          cursor: pointer;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-btn:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .contacts-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .contact-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .avatar-wrapper {
          position: relative;
        }

        .contact-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }

        .online-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #31a24c;
          border: 2px solid #090909;
        }

        .contact-name {
          font-size: 0.9rem;
          font-weight: 500;
          color: #e4e6eb;
          display: flex;
          align-items: center;
          gap: 4px;
        }

.verified-badge {
           color: #00E5FF;
           font-size: 0.8rem;
           font-weight: 900;
         }

         .premium-badge {
           color: #FFD700;
           font-size: 0.8rem;
           font-weight: 900;
         }

         .no-contacts {
          font-size: 0.85rem;
          color: #6b6b6b;
          text-align: center;
          padding: 10px;
        }

        /* Group Chats */
        .btn-create-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #b0b3b8;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

.btn-create-group:hover {
           background-color: rgba(255, 255, 255, 0.05);
           color: white;
         }

         /* Chat Bubble Flotante */
         .chat-bubble-btn {
           position: fixed;
           bottom: 24px;
           right: 24px;
           width: 56px;
           height: 56px;
           border-radius: 50%;
           background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
           border: none;
           color: black;
           cursor: pointer;
           display: flex;
           align-items: center;
           justify-content: center;
           box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3), 0 0 10px rgba(168, 85, 247, 0.2);
           z-index: 100;
           transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
         }

         .chat-bubble-btn:hover {
           transform: scale(1.08) translateY(-2px);
           box-shadow: 0 6px 20px rgba(0, 229, 255, 0.5), 0 0 15px rgba(168, 85, 247, 0.4);
         }

         .chat-badge {
           position: absolute;
           top: 4px;
           right: 4px;
           background: #f44336;
           color: white;
           font-size: 0.7rem;
           font-weight: 700;
           min-width: 20px;
           height: 20px;
           border-radius: 10px;
           display: flex;
           align-items: center;
           justify-content: center;
         }

         .chat-bubble-popup {
           position: fixed;
           bottom: 88px;
           right: 24px;
           width: 320px;
           max-height: 400px;
           background: #1a1a1a;
           border: 1px solid rgba(255, 255, 255, 0.1);
           border-radius: 12px;
           box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
           z-index: 100;
           display: flex;
           flex-direction: column;
         }

         .chat-bubble-header {
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 12px 16px;
           border-bottom: 1px solid rgba(255, 255, 255, 0.08);
         }

         .chat-bubble-header h4 {
           margin: 0;
           font-size: 1rem;
           color: #e4e6eb;
         }

         .chat-bubble-header button {
           background: transparent;
           border: none;
           color: #b0b3b8;
           cursor: pointer;
           padding: 4px;
           border-radius: 4px;
         }

         .chat-bubble-header button:hover {
           background: rgba(255, 255, 255, 0.05);
         }

         .chat-bubble-list {
           padding: 8px;
           overflow-y: auto;
           max-height: 350px;
         }

         .chat-bubble-item {
           display: flex;
           align-items: center;
           gap: 12px;
           padding: 8px 12px;
           border-radius: 8px;
           text-decoration: none;
           color: inherit;
           position: relative;
         }

         .chat-bubble-item:hover {
           background: rgba(255, 255, 255, 0.05);
         }

         .chat-bubble-avatar {
           width: 40px;
           height: 40px;
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           overflow: hidden;
           flex-shrink: 0;
         }

         .chat-bubble-avatar img {
           width: 100%;
           height: 100%;
           object-fit: cover;
         }

         .chat-bubble-avatar span {
           color: white;
           font-weight: 700;
           font-size: 1.2rem;
         }

         .chat-bubble-info {
           flex: 1;
           display: flex;
           flex-direction: column;
           gap: 2px;
           min-width: 0;
         }

         .chat-bubble-name {
           font-weight: 600;
           color: #e4e6eb;
           font-size: 0.9rem;
         }

         .chat-bubble-preview {
           font-size: 0.8rem;
           color: #6b6b6b;
           white-space: nowrap;
           overflow: hidden;
           text-overflow: ellipsis;
         }

         .chat-unread-dot {
           width: 10px;
           height: 10px;
           border-radius: 50%;
           background: #00E5FF;
           flex-shrink: 0;
         }

         .no-chats {
           font-size: 0.85rem;
           color: #6b6b6b;
           text-align: center;
           padding: 20px;
         }

         /* Group Create Modal */
         .group-modal {
           width: 420px;
         }

         .group-avatar-section {
           display: flex;
           gap: 16px;
           align-items: center;
           margin-bottom: 16px;
         }

         .group-avatar-preview {
           width: 80px;
           height: 80px;
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           overflow: hidden;
           flex-shrink: 0;
         }

         .group-avatar-preview img {
           width: 100%;
           height: 100%;
           object-fit: cover;
         }

         .group-theme-picker {
           display: flex;
           flex-direction: column;
           gap: 8px;
         }

         .theme-options {
           display: flex;
           gap: 6px;
           flex-wrap: wrap;
         }

         .theme-option {
           width: 28px;
           height: 28px;
           border-radius: 50%;
           border: 2px solid transparent;
           cursor: pointer;
         }

         .theme-option.selected {
           border-color: white;
         }

         .modal-section h4 {
           margin: 0 0 8px 0;
           font-size: 0.9rem;
           color: #b0b3b8;
         }

         .participants-list {
           display: flex;
           flex-direction: column;
           gap: 8px;
           max-height: 150px;
           overflow-y: auto;
         }

         .participant-item {
           display: flex;
           align-items: center;
           gap: 8px;
           padding: 6px 8px;
           border-radius: 6px;
           cursor: pointer;
         }

         .participant-item:hover {
           background: rgba(255, 255, 255, 0.03);
         }

.participant-item img {
            width: 28px;
            height: 28px;
            border-radius: 50%;
          }

          .add-friend-btn {
            background: rgba(0, 229, 255, 0.1);
            border: none;
            color: #00E5FF;
            cursor: pointer;
            padding: 6px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }

          .add-friend-btn:hover {
            background: rgba(0, 229, 255, 0.2);
            transform: scale(1.1);
          }

          /* Responsive styling */
        @media (max-width: 1400px) {
          .fb-layout-container {
            grid-template-columns: 280px 1fr 280px;
          }
        }

        @media (max-width: 1200px) {
          .fb-layout-container {
            grid-template-columns: 240px 1fr;
          }
          .right-sidebar {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .fb-layout-container {
            grid-template-columns: 1fr;
          }
          .left-sidebar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
