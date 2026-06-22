'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  Compass,
  Tv,
  Gift,
  Sparkles,
  Users,
  Bookmark,
  ChevronDown,
  Plus,
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface Shortcut {
  id: string;
  name: string;
  imageUrl?: string;
  image?: string;
  targetType: string;
  targetId: string;
}

const leftItems = [
  { icon: Compass, label: 'Explorar', href: '/dashboard/search' },
  { icon: Tv, label: 'Ver Anime', href: '/dashboard/watch' },
  { icon: Gift, label: 'Nexos Diarios', href: '/dashboard/daily' },
  { icon: Sparkles, label: 'IA', href: '/dashboard/nexo' },
  { icon: Users, label: 'Amigos', href: '/dashboard/friends' },
  { icon: Bookmark, label: 'Guardados', href: '/dashboard/saved' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [showAllItems, setShowAllItems] = useState(false);

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
      fetchShortcuts();
    }
  }, [user?.id]);

  const fetchShortcuts = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/feed/shortcuts/${user.id}`
      );
      const data = await res.json();
      if (data.success) {
        setShortcuts(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching shortcuts:', err);
    }
  };

  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + '/'),
    [pathname]
  );

  const displayItems = showAllItems ? leftItems : leftItems.slice(0, 6);

  const getShortcutHref = (s: Shortcut) => {
    switch (s.targetType) {
      case 'ANIME': return `/dashboard/anime/${s.targetId}`;
      case 'GROUP': return `/dashboard/groups/${s.targetId}`;
      default: return `/dashboard/profile/${s.targetId}`;
    }
  };

  return (
    <aside className={styles.sidebar} role="navigation" aria-label="Navegación lateral">
      <nav className={styles.nav} aria-label="Secciones principales" role="menubar">
        {displayItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(styles.link, active && styles.active)}
              aria-current={active ? 'page' : undefined}
              role="menuitem"
              tabIndex={0}
            >
              <span className={styles.iconWrapper}>
                <Icon size={24} />
              </span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}

        <button
          id="sidebar-show-more-btn"
          className={styles.link}
          onClick={() => setShowAllItems(!showAllItems)}
          aria-expanded={showAllItems}
          aria-controls="sidebar-extra-items"
          aria-label={showAllItems ? 'Ver menos opciones' : 'Ver más opciones'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowAllItems(!showAllItems);
            }
          }}
        >
          <span className={styles.iconWrapper}>
            <ChevronDown
              size={24}
              className={clsx(styles.showMoreIcon, showAllItems && styles.rotated)}
            />
          </span>
          <span className={styles.label}>
            {showAllItems ? 'Ver menos' : 'Ver más'}
          </span>
        </button>
      </nav>

      <div className={styles.divider} role="separator" />

      <div>
        <div className={styles.shortcutsHeader}>
          <h3 className={styles.shortcutsTitle} id="shortcuts-heading">Tus accesos directos</h3>
          <button 
            className={styles.plusIcon} 
            aria-label="Agregar acceso directo"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // TODO: Implementar agregar acceso directo
              }
            }}
          >
            <Plus size={16} />
          </button>
        </div>
        <nav className={styles.nav} aria-label="Accesos directos" role="menubar">
          {(shortcuts.length > 0 ? shortcuts : []).map((shortcut) => (
            <Link
              key={shortcut.id}
              href={getShortcutHref(shortcut)}
              className={clsx(styles.link, styles.shortcutItem)}
              role="menuitem"
              tabIndex={0}
            >
              <img
                src={shortcut.imageUrl || shortcut.image || `https://ui-avatars.com/api/?name=${shortcut.name}&background=random&color=fff`}
                alt={shortcut.name}
                className={styles.shortcutImg}
                loading="lazy"
              />
              <span className={styles.label}>{shortcut.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          Privacidad · Condiciones · Publicidad · Cookies · 2026
        </p>
      </footer>
    </aside>
  );
}