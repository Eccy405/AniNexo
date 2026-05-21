'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export const TopNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ animes: any[], users: any[] }>({ animes: [], users: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    const u = localStorage.getItem('user');
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length < 2) {
        setSearchResults({ animes: [], users: [] });
        setShowSearchResults(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:3001/api/search/global?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error("Search error", err);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navLinks = [
    { name: 'Inicio', href: '/dashboard' },
    { name: 'Búsqueda', href: '/dashboard/search' },
    { name: 'Comunidad', href: '/dashboard/community' },
    { name: 'Tendencias', href: '/rankings' },
    { name: 'Premium', href: '/dashboard/premium' },
  ];

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = (e.target as HTMLInputElement).value;
      window.location.href = `/dashboard/search?query=${encodeURIComponent(query)}`;
    }
  };

  return (
    <nav className={`top-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-left">
        <Link href="/dashboard" className="logo">ANINEXO</Link>
        <div className="nav-links">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={pathname === link.href ? 'active' : ''}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="nav-right">
        <div className="search-box">
           <input 
             type="text" 
             placeholder="Buscar anime o personas..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
             onKeyDown={handleGlobalSearch}
           />
           <span className="search-icon">🔍</span>

           <AnimatePresence>
             {showSearchResults && (searchQuery.length >= 2) && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="search-results-dropdown"
               >
                 {searchResults.animes.length > 0 && (
                   <div className="search-section">
                     <p className="section-title">Animes</p>
                       {searchResults.animes.map(anime => {
                         const slug = anime.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                         return (
                           <Link key={anime.id} href={`/dashboard/anime/${anime.id}-${slug}`} className="search-result-item" onClick={() => setShowSearchResults(false)}>
                         <img src={anime.coverImage} alt={anime.title} />
                         <div className="res-info">
                           <p className="res-title">{anime.title}</p>
                           <p className="res-meta">{anime.format} • ⭐ {anime.meanScore}%</p>
                         </div>
                           </Link>
                         );
                       })}
                   </div>
                 )}

                 {searchResults.users.length > 0 && (
                   <div className="search-section">
                     <p className="section-title">Personas</p>
                     {searchResults.users.map(u => (
                       <Link key={u.id} href={`/dashboard/profile/${u.username}`} className="search-result-item" onClick={() => setShowSearchResults(false)}>
                         <img 
                           src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.username}&background=random&color=fff`} 
                           alt={u.username} 
                           className="avatar-res"
                         />
                         <div className="res-info">
                           <p className="res-title">@{u.username}</p>
                           <p className="res-meta">{u.archetype || 'Explorador'}</p>
                         </div>
                       </Link>
                     ))}
                   </div>
                 )}

                 {searchResults.animes.length === 0 && searchResults.users.length === 0 && (
                   <p className="no-results">No se encontraron resultados para "{searchQuery}"</p>
                 )}
               </motion.div>
             )}
           </AnimatePresence>
        </div>
        
        <div className="icon-group">
           <Link href="/dashboard/premium" className="premium-link">PREMIUM</Link>
           <button className="nav-icon-btn">🔔</button>
           
           <div className="user-menu-container">
             <div className="user-avatar" onClick={() => setShowDropdown(!showDropdown)}>
               {user?.avatarUrl ? <img src={user.avatarUrl} alt="User" /> : <span>{user?.username?.charAt(0) || 'U'}</span>}
             </div>

             <AnimatePresence>
               {showDropdown && (
                 <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="user-dropdown"
                 >
                    <div className="dropdown-header">
                      <p className="d-username">@{user?.username}</p>
                      <p className="d-email">{user?.email}</p>
                    </div>
                    <div className="dropdown-divider" />
                    <Link href={`/dashboard/profile/${user?.username}`} className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <span className="d-icon">👤</span> Mi Perfil
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link href="/admin" className="dropdown-item admin-highlight" onClick={() => setShowDropdown(false)}>
                        <span className="d-icon">🛡️</span> Panel Admin
                      </Link>
                    )}
                    <Link href="/dashboard/settings" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <span className="d-icon">⚙️</span> Ajustes
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item logout-btn" onClick={handleLogout}>
                      <span className="d-icon">🚪</span> Cerrar Sesión
                    </button>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
        </div>
      </div>

      <style jsx>{`
        .top-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 75px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4%;
          z-index: 2000;
          transition: all 0.3s ease;
          background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
        }

        .top-navbar.scrolled {
          background: rgba(5, 5, 5, 0.9);
          backdrop-filter: blur(20px);
          height: 65px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 50px;
        }

        .logo {
          font-size: 2rem;
          font-weight: 950;
          color: var(--color-primary);
          letter-spacing: -1.5px;
          text-decoration: none;
          transition: transform 0.2s;
        }

        .logo:hover {
          transform: scale(1.05);
          text-shadow: 0 0 15px rgba(0, 229, 255, 0.5);
        }

        .nav-links {
          display: flex;
          gap: 30px;
        }

        .nav-links :global(a) {
          color: #ccc;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.2s;
          position: relative;
        }

        .nav-links :global(a:hover), .nav-links :global(a.active) {
          color: #fff;
        }

        .nav-links :global(a.active):after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--color-primary);
          border-radius: 2px;
          box-shadow: 0 0 10px var(--color-primary);
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 30px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-box input {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 10px 15px 10px 40px;
          color: white;
          font-size: 0.9rem;
          width: 220px;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-box input:focus {
          width: 350px;
          border-color: var(--color-primary);
          background: rgba(255,255,255,0.12);
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.2);
        }

        .search-icon {
          position: absolute;
          left: 15px;
          font-size: 1rem;
          opacity: 0.6;
        }

        .icon-group {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .premium-link {
          color: #00E5FF;
          font-weight: 900;
          font-size: 0.85rem;
          letter-spacing: 1px;
          border: 1.5px solid rgba(0, 229, 255, 0.4);
          padding: 6px 15px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .premium-link:hover {
          background: rgba(0, 229, 255, 0.1);
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
        }

        .nav-icon-btn {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.4rem;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .nav-icon-btn:hover { opacity: 1; }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .user-avatar:hover {
          border-color: var(--color-primary);
          transform: scale(1.1);
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* User Dropdown */
        .user-menu-container {
          position: relative;
        }

        .search-results-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          min-width: 350px;
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          margin-top: 10px;
          padding: 15px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
          z-index: 3000;
        }

        .user-dropdown {
          position: absolute;
          top: 55px;
          right: 0;
          width: 240px;
          background: rgba(15, 15, 15, 0.9);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 10px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dropdown-header { padding: 12px 15px; }
        .d-username { color: white; font-weight: 800; font-size: 1rem; margin: 0; }
        .d-email { color: #666; font-size: 0.75rem; margin: 4px 0 0 0; }
        .dropdown-divider { height: 1px; background: rgba(255, 255, 255, 0.05); margin: 8px 0; }
        
        .dropdown-item {
          padding: 12px 15px;
          border-radius: 10px;
          color: #ccc;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
          border: none;
          background: transparent;
          cursor: pointer;
        }

        .dropdown-item:hover { background: rgba(255, 255, 255, 0.05); color: white; }
        .admin-highlight { color: #00E5FF; }
        .admin-highlight:hover { background: rgba(0, 229, 255, 0.1); }
        .logout-btn { color: #ff4d4d; }
        .logout-btn:hover { background: rgba(255, 77, 77, 0.1); }

        .search-section { margin-bottom: 20px; }
        .search-section:last-child { margin-bottom: 0; }
        .section-title { 
          font-size: 0.75rem; 
          color: #555; 
          text-transform: uppercase; 
          font-weight: 800; 
          margin-bottom: 10px; 
          letter-spacing: 1px;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .search-result-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .search-result-item img {
          width: 45px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
        }

        .search-result-item .avatar-res {
          width: 45px;
          height: 45px;
          border-radius: 50%;
        }

        .res-info { flex: 1; min-width: 0; }
        .res-title { color: white; font-weight: 700; font-size: 0.9rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .res-meta { color: #666; font-size: 0.75rem; margin-top: 2px; }

        @media (max-width: 1100px) {
          .nav-links, .search-box { display: none; }
        }
      `}</style>
    </nav>
  );
};
