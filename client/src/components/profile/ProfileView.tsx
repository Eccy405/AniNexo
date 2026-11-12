'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '../ui/Card/Card';
import { translateListStatus } from '../../lib/translations';
import { OnboardingWizard } from '../auth/OnboardingWizard';
import { EditProfileModal } from './EditProfileModal';
import { CreatePost } from '../feed/CreatePost';
import { PostItem } from '../feed/PostItem';
import { UserListModal } from './UserListModal';
import { ChatModal } from './ChatModal';
import { useSocket } from '../../hooks/useSocket';
import { useChatStore } from '../../store/useChatStore';
import { useGlobalSocket } from '../auth/SocketProvider';
import styles from './ProfileView.module.css';

interface ProfileViewProps {
  profile: any;
  animeList: any[];
  collection?: any[];
}

function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Hace unos segundos';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Hace ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    const hm = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `Ayer a las ${hm}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMemberSince(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Fecha desconocida';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida';
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile: initialProfile, animeList, collection: initialCollection = [] }) => {
  const { socket, isConnected } = useGlobalSocket();
  const userStatuses = useChatStore(s => s.userStatuses);
  const setUserStatus = useChatStore(s => s.setUserStatus);

  const [profile, setProfile] = React.useState(initialProfile);
  const [showProfiling, setShowProfiling] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStoryGroup, setSelectedStoryGroup] = useState<any>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null);
  
  const { socket: chatSocket, isConnected: isChatConnected } = useSocket(conversationId || undefined);
  const themeColor = profile.themeColor || '#FF007F'; // Magenta Social por defecto

  const favAnime = profile.favAnime || profile.intelligence?.socialProfile?.favAnime || null;
  const favCharacter = profile.favCharacter || profile.intelligence?.socialProfile?.favCharacter || null;

  const achievements = useMemo(() => {
    if (Array.isArray(profile.achievements)) return profile.achievements;
    if (Array.isArray(profile.badges)) {
      return profile.badges.map((ub: any) => ({
        id: ub.badge?.id || ub.id,
        name: ub.badge?.name || 'Logro',
        description: ub.badge?.description || '',
        iconUrl: ub.badge?.iconUrl || '🏆',
        unlockedAt: ub.createdAt
      }));
    }
    return [];
  }, [profile.achievements, profile.badges]);

  const mergedCollection = useMemo(() => {
    const map = new Map<number, any>();
    const sources = [
      ...(Array.isArray(initialCollection) ? initialCollection : []),
      ...(Array.isArray(profile.collections) ? profile.collections : []),
      ...(Array.isArray(animeList) ? animeList : []),
      ...(Array.isArray(profile.animeLists) ? profile.animeLists : [])
    ];
    for (const item of sources) {
      const animeId = Number(item.animeId || item.anime?.id);
      if (!animeId) continue;
      if (!map.has(animeId)) {
        map.set(animeId, {
          animeId,
          status: item.status,
          anime: item.anime || null,
          title: item.anime?.titleEnglish || item.anime?.titleRomaji || item.anime?.title || `Anime #${animeId}`,
          coverImage: item.anime?.coverImage || null
        });
      } else {
        const existing = map.get(animeId);
        if (!existing.coverImage && item.anime?.coverImage) {
          existing.coverImage = item.anime.coverImage;
          existing.title = item.anime?.titleEnglish || item.anime?.titleRomaji || existing.title;
          existing.anime = item.anime;
        }
      }
    }
    return Array.from(map.values());
  }, [initialCollection, profile.collections, animeList, profile.animeLists]);

  const recentActivity = useMemo(
    () => (Array.isArray(profile.recentActivity) ? profile.recentActivity : []),
    [profile.recentActivity]
  );

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStories = async () => {
    try {
      if (!currentUser?.id) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/social/stories?userId=${currentUser.id}`);
      const data = await res.json();
      if (data.success) setStories(data.data);
    } catch (e) {
      console.error('Error fetching stories:', e);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/feed/user/${profile.id}`);
      const data = await res.json();
      if (data.success) setPosts(data.data);
    } catch (e) { console.error(e); }
    finally { setLoadingPosts(false); }
  };

  useEffect(() => {
    if (profile.id) fetchUserPosts();
  }, [profile.id]);

  useEffect(() => {
    const loadUser = async () => {
      const u = localStorage.getItem('user');
      if (u) {
        try {
          const parsed = JSON.parse(u);
          // Refresh user data from backend to get updated isVerified status
          if (parsed?.id) {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/profile/${parsed.username}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success) {
                const freshUser = { ...parsed, ...data.data };
                localStorage.setItem('user', JSON.stringify(freshUser));
                setCurrentUser(freshUser);
                return;
              }
            }
          }
          setCurrentUser(parsed);
        } catch (e) {
          console.error("Error parsing user", e);
        }
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser?.id) fetchStories();
  }, [currentUser]);

  const handleStoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploadingStory(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/social/stories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            mediaUrl: base64,
            caption: 'Nueva historia de Nexo'
          })
        });
        if (res.ok) {
          fetchStories();
          showToast('¡Historia compartida en la Dimensión Nexo!', 'success');
        }
      } catch (err) {
        showToast('Fallo en la conexión dimensional. Inténtalo de nuevo.', 'error');
      } finally {
        setIsUploadingStory(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const isOwnProfile = currentUser?.username?.toLowerCase() === profile.username?.toLowerCase();

  const handleProfilingComplete = () => {
    setShowProfiling(false);
    window.location.reload();
  };

  const handleEditSave = async (updatedData: any) => {
    setProfile((prev: any) => ({ ...prev, ...updatedData }));
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem(
      'user',
      JSON.stringify({
        ...u,
        ...(updatedData.themeColor ? { themeColor: updatedData.themeColor } : {}),
        ...(updatedData.firstName !== undefined ? { firstName: updatedData.firstName } : {}),
        ...(updatedData.lastName !== undefined ? { lastName: updatedData.lastName } : {}),
        ...(updatedData.bio !== undefined ? { bio: updatedData.bio } : {}),
        ...(updatedData.country !== undefined ? { country: updatedData.country } : {})
      })
    );

    // Recargar perfil completo para refrescar logros recién desbloqueados y actividad
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
          ? 'https://aninexo.onrender.com/api'
          : 'http://localhost:3001/api');
      const res = await fetch(`${apiBase}/profile/${encodeURIComponent(profile.username)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setProfile(json.data);
        }
      }
    } catch {
      // mantener datos optimistas si falla la recarga
    }
  };

  // Check if current user follows this profile
  useEffect(() => {
    if (currentUser?.id && profile?.id) {
      checkFollowingStatus();
      checkFriendshipStatus();
    }
  }, [currentUser, profile?.id]);

  const checkFriendshipStatus = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/friends/list/${currentUser?.id}`
      );
      const data = await res.json();
      if (data.success) {
        const isFriend = data.data.some((f: any) => f.id === profile.id);
        setFriendRequested(isFriend);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [friendRequested, setFriendRequested] = useState(false);

  const handleAddFriend = async () => {
    if (!currentUser?.id || !profile?.id) return;
    
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/friends/request`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, friendId: profile.id })
        }
      );
      const data = await res.json();
      if (data.success) {
        showToast('¡Solicitud de amistad enviada!', 'success');
        setFriendRequested(true);
      } else {
        showToast(data.message || 'Error al enviar solicitud', 'error');
      }
    } catch (err) {
      showToast('Error de conexión', 'error');
    }
  };

  const checkFollowingStatus = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/social/following/check?followerId=${currentUser.id}&followingId=${profile.id}`
      );
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.data.following);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle follow/unfollow
  const handleToggleFollow = async () => {
    if (!currentUser?.id || !profile?.id || followLoading) return;
    
    setFollowLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/social/follow`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            followerId: currentUser.id,
            followingId: profile.id
          })
        }
      );
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.data.followed);
        setProfile((prev: any) => ({
          ...prev,
          _count: {
            ...prev._count,
            followers: data.data.followed ? prev._count.followers + 1 : prev._count.followers - 1
          }
        }));
        showToast(data.data.followed ? '¡Ahora sigues a este usuario!' : 'Has dejado de seguir', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al seguir usuario', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle message button - create or get conversation
  const handleStartMessage = async () => {
    if (!currentUser?.id || !profile?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/messaging/conversation`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            userA: currentUser.id,
            userB: profile.id
          })
        }
      );
      const data = await res.json();
      if (data.success) {
        setConversationId(data.data.id);
        setShowChatModal(true);
        fetchMessages(data.data.id);
      }
    } catch (err) {
      console.error(err);
      showToast('Error al iniciar conversación', 'error');
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'https://aninexo.onrender.com/api' : 'http://localhost:3001/api')}/messaging/${convId}`
      );
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send message via socket
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !currentUser?.id || !conversationId) return;

    setIsSending(true);
    const newMsg = {
      conversationId: conversationId,
      senderId: currentUser.id,
      content: chatInput
    };

    socket.emit('send_message', newMsg);
    setChatMessages(prev => [...prev, {
      ...newMsg,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      sender: { username: currentUser.username, avatarUrl: currentUser.avatarUrl }
    }]);
    setChatInput('');
    setTimeout(() => {
      const el = document.querySelector('.chat-messages');
      el?.scrollTo(0, el.scrollHeight);
    }, 100);
    setIsSending(false);
  };

  // Listen for messages
  useEffect(() => {
    if (!socket || !conversationId) return;

    const handleNewMessage = (msg: any) => {
      if (msg.conversationId === conversationId) {
        setChatMessages(prev => (msg?.id && prev.some(m => String(m.id) === String(msg.id)) ? prev : [...prev, msg]));
        setTimeout(() => {
          const el = document.querySelector('.chat-messages');
          el?.scrollTo(0, el.scrollHeight);
        }, 100);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, conversationId]);

  if (showProfiling) {
    return (
      <div className="profiling-overlay">
        <OnboardingWizard onComplete={handleProfilingComplete} initialData={profile} />
        <style jsx>{`
          .profiling-overlay { 
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px; 
            background: rgba(0, 0, 0, 0.8); 
            backdrop-filter: blur(15px);
            min-height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            overflow-y: auto;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      {showEditModal && (
        <EditProfileModal 
          profile={profile} 
          onClose={() => setShowEditModal(false)} 
          onSave={handleEditSave}
        />
      )}
      
      {/* 1. Full-Width Banner & Header */}
      <div 
        className={styles.coverBanner} 
        data-tour="profile-header"
        style={{
          backgroundImage: favAnime?.bannerImage || favAnime?.coverImage || favAnime?.image
            ? `url(${favAnime.bannerImage || favAnime.coverImage || favAnime.image})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className={styles.coverOverlay} style={{ background: favAnime ? 'linear-gradient(to top, rgba(3, 5, 8, 1) 0%, rgba(3, 5, 8, 0.7) 40%, rgba(3, 5, 8, 0.3) 100%)' : undefined }}></div>
        <div className={styles.headerContent}>
          <div 
            className={styles.avatarWrapper}
            style={{ borderColor: themeColor }}
            onClick={() => isOwnProfile && setShowProfiling(true)}
            title={isOwnProfile ? "Recalcular ADN de Anime" : ""}
          >
            <Image 
              src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.username}&background=random&color=fff`} 
              alt={profile.username}
              fill
              className={styles.avatarImage}
            />
            {profile.isPremium && <span className={styles.premiumLabel}>PREMIUM</span>}
            
            {/* Status dot indicator */}
            <span 
              className={styles.statusBadgeDot} 
              style={{ 
                backgroundColor: {
                  online: '#31a24c',
                  away: '#f59e0b',
                  busy: '#ef4444',
                  offline: '#6b7280'
                }[userStatuses[profile.id] || 'offline']
              }}
            />
          </div>

          <div className={styles.headerInfo}>
            <div>
              <div className={styles.mainInfo}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {profile.username}
                  
                  {/* Real-time status text badge */}
                  <span className={styles.profileStatusText}>
                    {{
                      online: '🟢 En línea',
                      away: '🟡 Ausente',
                      busy: '🔴 Ocupado',
                      offline: '⚫ Desconectado'
                    }[userStatuses[profile.id] || 'offline']}
                  </span>

                  <div style={{ position: 'relative', display: 'inline-block' }} data-tour="profile-status">
                    {isOwnProfile && (
                      <>
                        <button 
                          onClick={() => setShowStatusSelector(!showStatusSelector)}
                          className={styles.statusSelectBtn}
                          title="Cambiar mi estado"
                        >
                          ⚙️
                        </button>
                        {showStatusSelector && (
                          <div className={styles.statusDropdown}>
                            <button onClick={() => { socket?.emit('set_status', { status: 'online' }); setUserStatus(currentUser.id, 'online'); setShowStatusSelector(false); }}>🟢 En línea</button>
                            <button onClick={() => { socket?.emit('set_status', { status: 'away' }); setUserStatus(currentUser.id, 'away'); setShowStatusSelector(false); }}>🟡 Ausente</button>
                            <button onClick={() => { socket?.emit('set_status', { status: 'busy' }); setUserStatus(currentUser.id, 'busy'); setShowStatusSelector(false); }}>🔴 Ocupado</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {profile.archetype && (
                    <span className={styles.archetypeBadge} style={{ color: themeColor, borderColor: themeColor }}>
                      ✨ {profile.archetype}
                    </span>
                  )}
                </h1>
              </div>
              <div className={styles.realName}>
                {profile.firstName} {profile.lastName} {profile.country && `• ${profile.country}`}
              </div>
              <div className={styles.statsRow}>
                <div className={styles.statItem} onClick={() => setShowFollowersModal(true)}>
                  <strong>{profile._count?.followers || 0}</strong> Seguidores
                </div>
                <div className={styles.statItem} onClick={() => setShowFollowingModal(true)}>
                  <strong>{profile._count?.following || 0}</strong> Siguiendo
                </div>
              </div>
            </div>

            <div className={styles.headerActions}>
              {isOwnProfile ? (
                <>
                  <button className={styles.btnSecondary} onClick={() => setShowProfiling(true)}>
                    ⚙️ Personalizar ADN
                  </button>
                  <button className={styles.btnPrimary} onClick={() => setShowEditModal(true)} data-tour="profile-edit-btn">
                    ✏️ Editar Perfil
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className={styles.btnSecondary} 
                    onClick={handleAddFriend}
                    disabled={friendRequested || !currentUser?.isVerified}
                    title={!currentUser?.isVerified ? 'Verifica tu cuenta' : 'Agregar amigo'}
                    data-tour="profile-edit-btn"
                  >
                    👤 {friendRequested ? 'Amigo/Agregado' : 'Agregar amigo'}
                  </button>
                  <button 
                    className={styles.btnSecondary} 
                    onClick={handleStartMessage}
                    disabled={!currentUser?.isVerified}
                  >
                    💬 Mensaje
                  </button>
                  <button 
                    className={styles.btnPrimary}
                    onClick={handleToggleFollow}
                    disabled={followLoading || !currentUser?.isVerified}
                  >
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Three-Column Main Grid */}
      <div className={styles.mainGrid}>
        
        {/* Left Column: Info & DNA */}
        <div className={styles.leftColumn}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>🌍 Información</h2>
            {profile.bio ? (
              <p className={styles.bioText}>{profile.bio}</p>
            ) : (
              <p className={styles.bioEmpty}>Aún no ha añadido una biografía.</p>
            )}

            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>📅</span>
                Miembro desde {formatMemberSince(profile.createdAt)}
              </div>
              {profile.country && (
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>📍</span>
                  De {profile.country}
                </div>
              )}
            </div>

            <div className={styles.favoritesDivider} />

            <div className={styles.infoFavoritesBlock}>
              <div>
                <div className={styles.favMiniHeader}>
                  <span className={styles.favMiniLabel}>📺 Anime Favorito</span>
                  {isOwnProfile && (
                    <button
                      type="button"
                      className={styles.favMiniEditBtn}
                      onClick={() => setShowEditModal(true)}
                    >
                      {favAnime ? 'Cambiar' : 'Elegir'}
                    </button>
                  )}
                </div>
                {favAnime && (favAnime.title || favAnime.coverImage || favAnime.image) ? (
                  favAnime.id ? (
                    <Link href={`/home/anime/${favAnime.id}`} className={`${styles.favShowcaseCard} ${styles.favShowcaseCardClickable}`}>
                      {(favAnime.coverImage || favAnime.image) ? (
                        <img
                          src={favAnime.coverImage || favAnime.image}
                          alt={favAnime.title || 'Anime favorito'}
                          className={styles.favAnimeCover}
                        />
                      ) : (
                        <div className={styles.favShowcasePlaceholder}>🎬</div>
                      )}
                      <div className={styles.favShowcaseMeta}>
                        <span className={styles.favShowcaseTitle}>{favAnime.title || 'Ver anime'}</span>
                        <span className={styles.favShowcaseSub}>Ver ficha del anime →</span>
                      </div>
                    </Link>
                  ) : (
                    <div className={styles.favShowcaseCard}>
                      {(favAnime.coverImage || favAnime.image) ? (
                        <img
                          src={favAnime.coverImage || favAnime.image}
                          alt={favAnime.title || 'Anime favorito'}
                          className={styles.favAnimeCover}
                        />
                      ) : (
                        <div className={styles.favShowcasePlaceholder}>🎬</div>
                      )}
                      <div className={styles.favShowcaseMeta}>
                        <span className={styles.favShowcaseTitle}>{favAnime.title}</span>
                      </div>
                    </div>
                  )
                ) : (
                  <p className={styles.favUnsetText}>Sin anime favorito configurado</p>
                )}
              </div>

              <div>
                <div className={styles.favMiniHeader}>
                  <span className={styles.favMiniLabel}>🎭 Personaje Favorito</span>
                  {isOwnProfile && (
                    <button
                      type="button"
                      className={styles.favMiniEditBtn}
                      onClick={() => setShowEditModal(true)}
                    >
                      {favCharacter ? 'Cambiar' : 'Elegir'}
                    </button>
                  )}
                </div>
                {favCharacter && (favCharacter.name || favCharacter.image) ? (
                  <div className={styles.favShowcaseCard}>
                    {favCharacter.image ? (
                      <img
                        src={favCharacter.image}
                        alt={favCharacter.name || 'Personaje favorito'}
                        className={styles.favCharAvatar}
                      />
                    ) : (
                      <div className={styles.favShowcasePlaceholder}>🎭</div>
                    )}
                    <div className={styles.favShowcaseMeta}>
                      <span className={styles.favShowcaseTitle}>{favCharacter.name || 'Personaje favorito'}</span>
                      <span className={styles.favShowcaseSub}>Espíritu afín</span>
                    </div>
                  </div>
                ) : (
                  <p className={styles.favUnsetText}>Sin personaje favorito configurado</p>
                )}
              </div>
            </div>
          </div>

          <div className={styles.sectionCard} data-tour="profile-stats">
            <h2 className={styles.sectionTitle}>🧬 ADN de Anime</h2>
            <div className={styles.dnaTags}>
              {profile.affinities?.length > 0 ? (
                profile.affinities.filter((a: any) => a.category === 'GENRE').slice(0, 8).map((a: any) => (
                  <span key={a.name} className={styles.dnaTag} style={{ color: themeColor, borderColor: themeColor + '44' }}>
                    #{a.name}
                  </span>
                ))
              ) : (
                <p className="empty-info" style={{ color: '#888', fontStyle: 'italic' }}>Sin datos de afinidad.</p>
              )}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>🎭 Perfil Emocional</h2>
            <div className={styles.emotionPills}>
              {profile.intelligence?.emotionProfile ? (
                Object.keys(profile.intelligence.emotionProfile).map(key => (
                  <div key={key} className={styles.emotionPill}>
                    {key}
                  </div>
                ))
              ) : (
                <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>Aún no sincronizado.</p>
              )}
            </div>
          </div>
          
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>🏆 Logros ({achievements.length})</h2>
            {achievements.length > 0 ? (
              <div className={styles.achievementsGrid}>
                {achievements.map((ach: any) => (
                  <button
                    key={ach.id}
                    type="button"
                    className={styles.achievementBadgeBtn}
                    title={`${ach.name}: ${ach.description}`}
                    onClick={() => setSelectedAchievement(ach)}
                  >
                    <span className={styles.achievementIcon}>{ach.iconUrl || '🏆'}</span>
                    <span>{ach.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className={styles.emptyMutedText}>
                {isOwnProfile
                  ? 'Todavía no has desbloqueado logros. Explora, añade animes o publica en la comunidad.'
                  : 'Este usuario todavía no ha desbloqueado logros.'}
              </p>
            )}
          </div>
        </div>

        {/* Center Column: Posts Feed */}
        <div className={styles.centerColumn}>
          {isOwnProfile && (
            <div className={styles.createPostWrapper}>
              <CreatePost onPostCreated={fetchUserPosts} />
            </div>
          )}

          <div className={styles.feedContainer}>
            {loadingPosts ? (
              <div className="loader-mini" style={{ margin: '20px auto' }} />
            ) : posts.length === 0 ? (
              <div className={styles.emptyFeed}>
                <p>No hay publicaciones aún en este muro dimensional.</p>
              </div>
            ) : (
              posts.map(post => (
                <PostItem key={post.id} post={post} />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Real Collection & Recent Activity */}
        <div className={styles.rightColumn}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>⭐ Colección ({mergedCollection.length})</h2>
            {mergedCollection.length > 0 ? (
              <>
                <div className={styles.favoritesGrid}>
                  {mergedCollection.slice(0, 6).map((item: any) => (
                    <Link
                      key={item.animeId}
                      href={`/home/anime/${item.animeId}`}
                      className={styles.favoriteItem}
                      title={item.title}
                    >
                      {item.coverImage ? (
                        <img src={item.coverImage} alt={item.title} className={styles.favoriteImg} />
                      ) : (
                        <div className={styles.favoriteFallbackTile}>{item.title}</div>
                      )}
                      <div className={styles.favoriteTitleOverlay}>{item.title}</div>
                    </Link>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.viewAllBtn}
                  onClick={() => document.getElementById('coleccion-completa')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Ver colección completa
                </button>
              </>
            ) : (
              <div>
                <p className={styles.emptyMutedText}>Aún no ha añadido animes a su colección.</p>
                {isOwnProfile && (
                  <Link href="/home/search" className={styles.viewAllBtn} style={{ display: 'block', textAlign: 'center', marginTop: '12px', textDecoration: 'none' }}>
                    Explorar catálogo
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>⚡ Actividad Reciente</h2>
            {recentActivity.length > 0 ? (
              <div className={styles.activityList}>
                {recentActivity.map((act: any) => {
                  const relative = formatRelativeTime(act.timestamp);
                  if (act.type === 'ANIME_LIST' || act.type === 'COLLECTION') {
                    return (
                      <div key={act.id} className={styles.activityItem}>
                        <div className={styles.activityIcon}>📺</div>
                        <div className={styles.activityContent}>
                          <p>
                            {act.type === 'ANIME_LIST' ? 'Actualizó ' : 'Añadió '}
                            <Link href={`/home/anime/${act.animeId || act.targetId}`} className={styles.activityLink}>
                              {act.title}
                            </Link>
                            {act.status ? ` (${translateListStatus(act.status)})` : ''}
                          </p>
                          <span>{relative}</span>
                        </div>
                      </div>
                    );
                  }

                  if (act.type === 'ACHIEVEMENT') {
                    return (
                      <div key={act.id} className={styles.activityItem}>
                        <div
                          className={styles.activityIcon}
                          style={{ background: 'rgba(0, 229, 255, 0.12)', color: '#00E5FF', borderColor: 'rgba(0, 229, 255, 0.25)' }}
                        >
                          {act.icon || '🏆'}
                        </div>
                        <div className={styles.activityContent}>
                          <p>
                            Desbloqueó el logro <strong>{act.title}</strong>
                          </p>
                          <span>{relative}</span>
                        </div>
                      </div>
                    );
                  }

                  if (act.type === 'COMMENT') {
                    return (
                      <div key={act.id} className={styles.activityItem}>
                        <div
                          className={styles.activityIcon}
                          style={{ background: 'rgba(255, 215, 0, 0.12)', color: 'gold', borderColor: 'rgba(255, 215, 0, 0.25)' }}
                        >
                          💬
                        </div>
                        <div className={styles.activityContent}>
                          <p>
                            Comentó en{' '}
                            {act.animeId ? (
                              <Link href={`/home/anime/${act.animeId}`} className={styles.activityLink}>
                                {act.title}
                              </Link>
                            ) : (
                              <strong>{act.title}</strong>
                            )}
                          </p>
                          {act.excerpt && <p className={styles.activityExcerpt}>“{act.excerpt}”</p>}
                          <span>{relative}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={act.id} className={styles.activityItem}>
                      <div
                        className={styles.activityIcon}
                        style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                      >
                        📝
                      </div>
                      <div className={styles.activityContent}>
                        <p>
                          Publicó en <strong>{act.title}</strong>
                        </p>
                        {act.excerpt && <p className={styles.activityExcerpt}>“{act.excerpt}”</p>}
                        <span>{relative}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyMutedText}>Aún no hay actividad reciente.</p>
            )}
          </div>
        </div>
      </div>

      {/* MURO DE PUBLICACIONES (WALL) */}
      <div className="posts-section">
        <div className="section-header">
          <h2 style={{ color: themeColor }}>Muro de Nexo</h2>
        </div>

        {isOwnProfile && (
          <div style={{ marginBottom: '30px' }}>
            <CreatePost onPostCreated={fetchUserPosts} />
          </div>
        )}

        <div className="posts-feed">
          {loadingPosts ? (
            <div className="loader-mini" style={{ margin: '20px auto' }} />
          ) : posts.length === 0 ? (
            <div className="empty-content" style={{ textAlign: 'center', padding: '40px', color: '#b0b3b8' }}>
              <p>No hay publicaciones aún en este muro dimensional.</p>
            </div>
          ) : (
            posts.map(post => (
              <PostItem key={post.id} post={post} />
            ))
          )}
        </div>
      </div>

      <div className="list-section" id="coleccion-completa">
         <h2>Colección de Anime</h2>
         {mergedCollection.length > 0 ? (
           <div className="anime-grid">
             {mergedCollection.map((entry: any) => (
               <div key={entry.animeId} className="anime-item-card">
                 <Link href={`/home/anime/${entry.animeId}`} style={{ textDecoration: 'none' }}>
                   <div className="poster-wrap">
                     {entry.coverImage ? (
                       <img src={entry.coverImage} alt={entry.title} />
                     ) : (
                       <div className={styles.favoriteFallbackTile}>{entry.title}</div>
                     )}
                   </div>
                   <div className="poster-info">
                     <p className="entry-status">{translateListStatus(entry.status)}</p>
                     <span className="entry-status" style={{ fontSize: '0.65rem', opacity: 0.75 }}>
                       {entry.title}
                     </span>
                   </div>
                 </Link>
               </div>
             ))}
           </div>
         ) : (
           <p className="empty-list">Este usuario aún no ha añadido animes a su lista.</p>
         )}
       </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div className={styles.badgeModalOverlay} onClick={() => setSelectedAchievement(null)}>
          <div className={styles.badgeModalCard} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.badgeModalClose}
              onClick={() => setSelectedAchievement(null)}
            >
              ✕
            </button>
            <div className={styles.badgeModalIcon}>{selectedAchievement.iconUrl || '🏆'}</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.25rem' }}>{selectedAchievement.name}</h3>
            <p style={{ margin: '0 0 14px 0', color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              {selectedAchievement.description || 'Logro desbloqueado por tu actividad en AniNexo.'}
            </p>
            {selectedAchievement.unlockedAt && (
              <span style={{ fontSize: '0.78rem', color: '#00E5FF', fontWeight: 700 }}>
                Desbloqueado {formatRelativeTime(selectedAchievement.unlockedAt)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {selectedStoryGroup && (
        <div className="story-viewer-overlay" onClick={() => setSelectedStoryGroup(null)}>
          <button className="btn-close-viewer">×</button>
          <div className="story-viewer-content" onClick={(e) => e.stopPropagation()}>
            <div className="story-viewer-header">
              <img src={selectedStoryGroup.user.avatarUrl || '/default-avatar.png'} alt="" />
              <div>
                <strong style={{ display: 'block' }}>{selectedStoryGroup.user.username}</strong>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{new Date(selectedStoryGroup.stories[0].createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
            <img src={selectedStoryGroup.stories[0].mediaUrl} className="story-viewer-media" alt="" />
            {selectedStoryGroup.stories[0].caption && (
              <div className="story-viewer-caption">{selectedStoryGroup.stories[0].caption}</div>
            )}
          </div>
        </div>
      )}

      {/* Modals from previous implementation */}
      {showFollowersModal && (
        <UserListModal type="followers" userId={profile.id} onClose={() => setShowFollowersModal(false)} />
      )}
      {showFollowingModal && (
        <UserListModal type="following" userId={profile.id} onClose={() => setShowFollowingModal(false)} />
      )}
      {showChatModal && (
        <ChatModal 
          profile={profile}
          currentUser={currentUser}
          conversationId={conversationId}
          chatMessages={chatMessages}
          chatInput={chatInput}
          isConnected={isChatConnected}
          isSending={isSending}
          setChatInput={setChatInput}
          onSendMessage={(content: string) => {
            if (!chatSocket) return;
            setIsSending(true);
            const newMsg = {
              conversationId: conversationId,
              senderId: currentUser?.id,
              content
            };
            chatSocket.emit('send_message', newMsg);
            setChatMessages(prev => [...prev, {
              ...newMsg,
              id: Date.now(),
              createdAt: new Date().toISOString(),
              sender: { username: currentUser?.username, avatarUrl: currentUser?.avatarUrl }
            }]);
            setChatInput('');
            setTimeout(() => {
              const el = document.querySelector('.chat-messages');
              el?.scrollTo(0, el.scrollHeight);
            }, 100);
            setIsSending(false);
          }}
          onClose={() => setShowChatModal(false)}
        />
      )}
      {toast && (
        <div className={`nexo-toast ${toast.type}`} style={{ 
          position: 'fixed', bottom: '30px', right: '30px', zIndex: 2000, 
          background: 'rgba(15, 15, 15, 0.8)', backdropFilter: 'blur(15px)', 
          border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '15px 25px'
        }}>
          <div className="toast-message">{toast.message}</div>
        </div>
      )}
    </div>
  );
};
