'use client';

import { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { useUIStore } from '../../../store/uiStore';

const backgroundOptions = [
  {
    value: 'full',
    label: 'Completo',
    description: 'Más partículas y conexiones. Recomendado para escritorio potente.',
  },
  {
    value: 'reduced',
    label: 'Reducido',
    description: 'Movimiento más suave y menos densidad para mejor rendimiento.',
  },
  {
    value: 'static',
    label: 'Estático',
    description: 'Mantiene la estética del fondo sin ejecutar animación.',
  },
] as const;

const getApiBase = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://aninexo.onrender.com/api'
    : 'http://localhost:3001/api');

type Tab = 'profile' | 'appearance' | 'security' | 'privacy' | 'help';

export default function DashboardSettingsPage() {
  const backgroundMode = useUIStore((state) => state.backgroundMode);
  const setBackgroundMode = useUIStore((state) => state.setBackgroundMode);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Real profile & favorites state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileStatusMsg, setProfileStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    country: '',
    themeColor: '#00E5FF'
  });
  const [favAnime, setFavAnime] = useState<{ id?: number | null; title: string; image: string; coverImage?: string } | null>(null);
  const [favCharacter, setFavCharacter] = useState<{ id?: number | null; name: string; image: string } | null>(null);

  const [animeQuery, setAnimeQuery] = useState('');
  const [animeResults, setAnimeResults] = useState<any[]>([]);
  const [searchingAnime, setSearchingAnime] = useState(false);

  const [charQuery, setCharQuery] = useState('');
  const [charResults, setCharResults] = useState<any[]>([]);
  const [searchingChar, setSearchingChar] = useState(false);

  // Simulated state for security (UI placeholder)
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [twoFactor, setTwoFactor] = useState(false);
  const [securitySaved, setSecuritySaved] = useState(false);

  // Real DB-backed privacy toggles (+ local UI toggles)
  const [privacySettings, setPrivacySettings] = useState({
    privateProfile: false,
    showWatchList: true,
    allowDMs: true,
    showActivity: true,
  });
  const [privacySaved, setPrivacySaved] = useState(false);

  // Accordion state for User Manual
  const [openManualSection, setOpenManualSection] = useState<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const rawUser = localStorage.getItem('user');
        if (!rawUser) {
          setProfileLoading(false);
          return;
        }
        const parsed = JSON.parse(rawUser);
        setCurrentUser(parsed);

        if (parsed?.username) {
          const token = localStorage.getItem('token');
          const res = await fetch(
            `${getApiBase()}/profile/${encodeURIComponent(parsed.username)}`,
            token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
          );
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              const p = json.data;
              setProfileForm({
                firstName: p.firstName || '',
                lastName: p.lastName || '',
                bio: p.bio || '',
                country: p.country || '',
                themeColor: p.themeColor || '#00E5FF'
              });
              const resolvedAnime = p.favAnime || p.intelligence?.socialProfile?.favAnime || null;
              if (resolvedAnime?.title || resolvedAnime?.image || resolvedAnime?.coverImage) {
                setFavAnime({
                  id: resolvedAnime.id || null,
                  title: resolvedAnime.title || '',
                  image: resolvedAnime.coverImage || resolvedAnime.image || '',
                  coverImage: resolvedAnime.coverImage || resolvedAnime.image || ''
                });
              }
              const resolvedChar = p.favCharacter || p.intelligence?.socialProfile?.favCharacter || null;
              if (resolvedChar?.name || resolvedChar?.image) {
                setFavCharacter({
                  id: resolvedChar.id || null,
                  name: resolvedChar.name || '',
                  image: resolvedChar.image || ''
                });
              }
              setPrivacySettings((prev) => ({
                ...prev,
                privateProfile: Boolean(p.privateProfile),
                showWatchList: p.showWatchList !== undefined ? Boolean(p.showWatchList) : true
              }));
            }
          }
        }
      } catch (err) {
        console.error('[Settings] Error cargando perfil:', err);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (animeQuery.trim().length < 2) {
      setAnimeResults([]);
      return;
    }
    setSearchingAnime(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${getApiBase()}/search/global?q=${encodeURIComponent(animeQuery.trim())}`);
        const json = await res.json();
        setAnimeResults(json.data?.animes || []);
      } catch {
        setAnimeResults([]);
      } finally {
        setSearchingAnime(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [animeQuery]);

  useEffect(() => {
    if (charQuery.trim().length < 2) {
      setCharResults([]);
      return;
    }
    setSearchingChar(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${getApiBase()}/search/characters?q=${encodeURIComponent(charQuery.trim())}`);
        const json = await res.json();
        setCharResults(Array.isArray(json.data) ? json.data : []);
      } catch {
        setCharResults([]);
      } finally {
        setSearchingChar(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [charQuery]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener('change', updateMotionPreference);

    return () => mediaQuery.removeEventListener('change', updateMotionPreference);
  }, []);

  const handleStartTour = () => {
    localStorage.removeItem('nexo-tour-completed');
    localStorage.removeItem('nexo-tour-step');
    if (typeof window !== 'undefined' && (window as any).startNexoTour) {
      (window as any).startNexoTour();
    } else {
      window.location.href = '/home';
    }
  };

  const handleSecuritySave = (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySaved(true);
    setTimeout(() => setSecuritySaved(false), 3000);
    setPasswordForm({ old: '', new: '', confirm: '' });
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setProfileStatusMsg({ type: 'err', text: 'Inicia sesión para guardar tu perfil.' });
      return;
    }
    setProfileSaving(true);
    setProfileStatusMsg(null);
    try {
      const res = await fetch(`${getApiBase()}/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...profileForm,
          favAnime: favAnime || null,
          favCharacter: favCharacter || null
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, ...json.data }));
        setProfileStatusMsg({ type: 'ok', text: '✓ Perfil y favoritos guardados en tu cuenta.' });
      } else {
        setProfileStatusMsg({ type: 'err', text: json.message || 'No se pudieron guardar los cambios.' });
      }
    } catch {
      setProfileStatusMsg({ type: 'err', text: 'Error de conexión al guardar perfil.' });
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileStatusMsg(null), 4000);
    }
  };

  const togglePrivacy = async (key: keyof typeof privacySettings) => {
    const nextVal = !privacySettings[key];
    setPrivacySettings(prev => ({
      ...prev,
      [key]: nextVal,
    }));

    if (key === 'privateProfile' || key === 'showWatchList') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetch(`${getApiBase()}/profile/update`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ [key]: nextVal })
          });
        } catch (err) {
          console.error('[Settings] Error guardando privacidad:', err);
        }
      }
    }

    setPrivacySaved(true);
    setTimeout(() => setPrivacySaved(false), 2000);
  };

  const toggleManualSection = (index: number) => {
    setOpenManualSection(openManualSection === index ? null : index);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <span className="settings-kicker">Preferencias</span>
        <h1>Configuración</h1>
        <p>Gestiona tu experiencia en AniNexo, cambia tus ajustes de seguridad, privacidad y accede a ayuda en línea.</p>
      </div>

      <div className="settings-container">
        {/* Navigation Sidebar */}
        <aside className="settings-sidebar">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Perfil y Favoritos
          </button>
          <button 
            className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            🎨 Apariencia
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🛡️ Seguridad
          </button>
          <button 
            className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            🔒 Privacidad
          </button>
          <button 
            className={`tab-btn ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            ❓ Ayuda y Soporte
          </button>
        </aside>

        {/* Content Area */}
        <main className="settings-content">
          {activeTab === 'profile' && (
            <Card className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Identidad, Biografía y Favoritos</h2>
                  <p>Edita tu información pública, tu anime favorito (con portada) y tu personaje favorito.</p>
                </div>
              </div>

              {profileLoading ? (
                <p style={{ color: 'var(--color-text-muted)' }}>Cargando perfil...</p>
              ) : !currentUser ? (
                <p style={{ color: 'var(--color-text-muted)' }}>Inicia sesión para editar tu perfil.</p>
              ) : (
                <form onSubmit={handleProfileSave} className="simulated-form">
                  <div className="profile-two-col">
                    <div className="form-group">
                      <label>Nombre</label>
                      <input
                        type="text"
                        placeholder="Tu nombre..."
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Apellido</label>
                      <input
                        type="text"
                        placeholder="Tu apellido..."
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Biografía</label>
                    <textarea
                      rows={3}
                      placeholder="Cuéntale a la comunidad qué ves o lees..."
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="settings-textarea"
                    />
                  </div>

                  <div className="form-group">
                    <label>País / Ubicación</label>
                    <input
                      type="text"
                      placeholder="Ej: Colombia, México, Japón..."
                      value={profileForm.country}
                      onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                    />
                  </div>

                  <div className="form-divider" />

                  {/* Anime Favorito */}
                  <div className="form-group">
                    <label>📺 Anime Favorito (portada y título)</label>
                    {favAnime ? (
                      <div className="fav-selected-card">
                        {(favAnime.coverImage || favAnime.image) ? (
                          <img src={favAnime.coverImage || favAnime.image} alt={favAnime.title} className="fav-cover-thumb" />
                        ) : (
                          <div className="fav-cover-thumb placeholder">🎬</div>
                        )}
                        <div className="fav-selected-info">
                          <strong>{favAnime.title}</strong>
                          <span>Portada vinculada al perfil</span>
                        </div>
                        <button type="button" className="fav-clear-btn" onClick={() => setFavAnime(null)}>
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <div className="fav-search-wrapper">
                        <input
                          type="text"
                          placeholder="Buscar anime por título (ej: Frieren, Attack on Titan)..."
                          value={animeQuery}
                          onChange={(e) => setAnimeQuery(e.target.value)}
                        />
                        {searchingAnime && <span className="fav-searching-text">Buscando animes...</span>}
                        {animeResults.length > 0 && (
                          <div className="fav-results-dropdown">
                            {animeResults.slice(0, 6).map((a: any) => (
                              <button
                                key={a.id}
                                type="button"
                                className="fav-result-row"
                                onClick={() => {
                                  setFavAnime({
                                    id: a.id,
                                    title: a.title,
                                    image: a.coverImage || '',
                                    coverImage: a.coverImage || ''
                                  });
                                  setAnimeQuery('');
                                  setAnimeResults([]);
                                }}
                              >
                                {a.coverImage && <img src={a.coverImage} alt={a.title} />}
                                <span>{a.title}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Personaje Favorito */}
                  <div className="form-group">
                    <label>🎭 Personaje Favorito (nombre e imagen)</label>
                    {favCharacter ? (
                      <div className="fav-selected-card">
                        {favCharacter.image ? (
                          <img src={favCharacter.image} alt={favCharacter.name} className="fav-char-thumb" />
                        ) : (
                          <div className="fav-char-thumb placeholder">🎭</div>
                        )}
                        <div className="fav-selected-info">
                          <strong>{favCharacter.name}</strong>
                          <span>Personaje vinculado al perfil</span>
                        </div>
                        <button type="button" className="fav-clear-btn" onClick={() => setFavCharacter(null)}>
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <div className="fav-search-wrapper">
                        <input
                          type="text"
                          placeholder="Buscar personaje (ej: Luffy, Goku, Gojo)..."
                          value={charQuery}
                          onChange={(e) => setCharQuery(e.target.value)}
                        />
                        {searchingChar && <span className="fav-searching-text">Buscando personajes...</span>}
                        {charResults.length > 0 && (
                          <div className="fav-results-dropdown">
                            {charResults.slice(0, 6).map((c: any) => (
                              <button
                                key={c.id}
                                type="button"
                                className="fav-result-row"
                                onClick={() => {
                                  setFavCharacter({
                                    id: c.id,
                                    name: c.name?.full || c.name || 'Personaje',
                                    image: c.image?.large || ''
                                  });
                                  setCharQuery('');
                                  setCharResults([]);
                                }}
                              >
                                {c.image?.large && <img src={c.image.large} alt={c.name?.full} />}
                                <span>{c.name?.full || c.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="save-btn" disabled={profileSaving}>
                    {profileSaving ? 'Guardando cambios...' : 'Guardar Perfil y Favoritos'}
                  </button>

                  {profileStatusMsg && (
                    <span className={profileStatusMsg.type === 'ok' ? 'success-toast' : 'error-toast'}>
                      {profileStatusMsg.text}
                    </span>
                  )}
                </form>
              )}
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Fondo interactivo</h2>
                  <p>Elige la intensidad del fondo de partículas tipo Plexus.</p>
                </div>
              </div>

              <div className="mode-grid">
                {backgroundOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`mode-option ${backgroundMode === option.value ? 'active' : ''}`}
                    onClick={() => setBackgroundMode(option.value)}
                  >
                    <span className="mode-option-top">
                      <span className="mode-dot" />
                      <span className="mode-label">{option.label}</span>
                    </span>
                    <span className="mode-description">{option.description}</span>
                  </button>
                ))}
              </div>

              {reducedMotion && backgroundMode !== 'static' && (
                <div className="motion-note">
                  Tu sistema pidió menos movimiento, por eso AniNexo está usando automáticamente el modo reducido.
                </div>
              )}
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Seguridad de la Cuenta</h2>
                  <p>Administra tu contraseña y factores de seguridad. (Simulado)</p>
                </div>
              </div>

              <form onSubmit={handleSecuritySave} className="simulated-form">
                <div className="form-group">
                  <label>Contraseña Actual</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={passwordForm.old}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Nueva Contraseña</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar Nueva Contraseña</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  />
                </div>

                <div className="form-divider" />

                <div className="toggle-setting">
                  <div className="toggle-info">
                    <h3>Autenticación de Dos Factores (2FA)</h3>
                    <p>Protege tu cuenta requiriendo un código de seguridad adicional al iniciar sesión.</p>
                  </div>
                  <button 
                    type="button" 
                    className={`toggle-switch ${twoFactor ? 'active' : ''}`}
                    onClick={() => setTwoFactor(!twoFactor)}
                  >
                    <span className="switch-knob" />
                  </button>
                </div>

                <button type="submit" className="save-btn">Guardar Cambios de Seguridad</button>
                {securitySaved && (
                  <span className="success-toast">✓ Cambios guardados (simulado)</span>
                )}
              </form>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Ajustes de Privacidad</h2>
                  <p>Controla quién puede ver tu actividad y comunicarse contigo. (Simulado)</p>
                </div>
              </div>

              <div className="privacy-options">
                <div className="privacy-item" onClick={() => togglePrivacy('privateProfile')}>
                  <input type="checkbox" checked={privacySettings.privateProfile} readOnly />
                  <div className="privacy-text">
                    <h3>Perfil Privado</h3>
                    <p>Solo los usuarios que te siguen podrán ver tus publicaciones e historias.</p>
                  </div>
                </div>

                <div className="privacy-item" onClick={() => togglePrivacy('showWatchList')}>
                  <input type="checkbox" checked={privacySettings.showWatchList} readOnly />
                  <div className="privacy-text">
                    <h3>Mostrar Lista de Anime</h3>
                    <p>Permitir que los visitantes de tu perfil vean tu colección de animes agregados.</p>
                  </div>
                </div>

                <div className="privacy-item" onClick={() => togglePrivacy('allowDMs')}>
                  <input type="checkbox" checked={privacySettings.allowDMs} readOnly />
                  <div className="privacy-text">
                    <h3>Mensajes Directos Abiertos</h3>
                    <p>Permitir que cualquier usuario te envíe mensajes directos sin seguirse mutuamente.</p>
                  </div>
                </div>

                <div className="privacy-item" onClick={() => togglePrivacy('showActivity')}>
                  <input type="checkbox" checked={privacySettings.showActivity} readOnly />
                  <div className="privacy-text">
                    <h3>Estado de Actividad</h3>
                    <p>Mostrar si estás en línea o cuándo fue tu última conexión.</p>
                  </div>
                </div>

                {privacySaved && (
                  <div className="success-banner">✓ Preferencias de privacidad actualizadas</div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'help' && (
            <div className="help-section-wrapper">
              {/* Tour Trigger Box */}
              <Card className="settings-card tour-box">
                <div className="tour-box-content">
                  <div>
                    <h2>¿Necesitas ayuda guiada?</h2>
                    <p>Inicia el recorrido interactivo con Nexo para conocer todos los detalles visuales de la plataforma.</p>
                  </div>
                  <button onClick={handleStartTour} className="tour-trigger-btn">
                    Hacer el Tour
                  </button>
                </div>
              </Card>

              {/* User Manual Documented */}
              <Card className="settings-card help-card">
                <div className="settings-card-header">
                  <div>
                    <h2>Manual de Usuario de AniNexo</h2>
                    <p>Aprende a usar todas las características y herramientas integradas de la plataforma.</p>
                  </div>
                </div>

                <div className="manual-accordion">
                  {/* Section 1 */}
                  <div className={`accordion-item ${openManualSection === 1 ? 'open' : ''}`}>
                    <button className="accordion-trigger" onClick={() => toggleManualSection(1)}>
                      <span>1. Primeros Pasos e Identidad</span>
                      <span className="accordion-arrow">▼</span>
                    </button>
                    <div className="accordion-content">
                      <h3>1.1 Registro y Seguridad Pro</h3>
                      <p>Para garantizar una comunidad libre de spam, contamos con <strong>Seguridad Nexo Pro</strong>. Puedes registrarte usando tu correo electrónico (recibirás un código de verificación de 6 dígitos) o mediante tu cuenta de Google.</p>
                      <h3>1.2 Creación de tu ADN Nexo</h3>
                      <p>Al ingresar por primera vez, serás recibido por un cuestionario interactivo de diseño avanzado para evaluar tus géneros favoritos, tus emociones al ver anime y tu estilo. El sistema te asignará un <strong>Arquetipo único</strong> (por ejemplo, <em>Dark Strategist</em>) y un color de aura/acento que adornará todo tu perfil.</p>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className={`accordion-item ${openManualSection === 2 ? 'open' : ''}`}>
                    <button className="accordion-trigger" onClick={() => toggleManualSection(2)}>
                      <span>2. La Enciclopedia y Colecciones</span>
                      <span className="accordion-arrow">▼</span>
                    </button>
                    <div className="accordion-content">
                      <h3>2.1 Fichas Técnicas</h3>
                      <p>Al entrar a la página de cualquier anime, verás una sinopsis completa, duración, formato, estudio, géneros y etiquetas de relevancia, galerías completas de personajes y staff, junto con estadísticas de popularidad.</p>
                      <h3>2.2 Agregar a tu Colección</h3>
                      <p>Desde la ficha técnica de un anime, encontrarás un botón para <strong>"Agregar a Colección"</strong>, el cual mostrará ese anime directamente en tu perfil público para que todos vean tus gustos.</p>
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div className={`accordion-item ${openManualSection === 3 ? 'open' : ''}`}>
                    <button className="accordion-trigger" onClick={() => toggleManualSection(3)}>
                      <span>3. Red Social e Interacción</span>
                      <span className="accordion-arrow">▼</span>
                    </button>
                    <div className="accordion-content">
                      <h3>3.1 El Feed Dinámico</h3>
                      <p>Aquí verás lo que publican tus amigos y la comunidad. Puedes reaccionar con <em>Like, Love, Wow, Sad</em> o <em>Angry</em>, etiquetar animes en tus publicaciones, y utilizar el menú contextual para editar, eliminar o cambiar la privacidad de tus posts.</p>
                      <h3>3.2 Seguidores e Historias</h3>
                      <p>Puedes seguir a otros usuarios y ver contadores en tiempo real. También puedes publicar <strong>Historias</strong> multimedia cortas que desaparecerán automáticamente después de 24 horas.</p>
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className={`accordion-item ${openManualSection === 4 ? 'open' : ''}`}>
                    <button className="accordion-trigger" onClick={() => toggleManualSection(4)}>
                      <span>4. Comunidades y Chat</span>
                      <span className="accordion-arrow">▼</span>
                    </button>
                    <div className="accordion-content">
                      <h3>4.1 Chat Privado en Tiempo Real</h3>
                      <p>Envía mensajes directos en tiempo real desde el perfil de cualquier usuario. El sistema cuenta con notificaciones y alertas instantáneas.</p>
                      <h3>4.2 Grupos Temáticos</h3>
                      <p>Si deseas debatir un anime en específico con otros fans, puedes fundar un grupo de debate temático directamente desde la página del anime correspondiente.</p>
                    </div>
                  </div>

                  {/* Section 5 */}
                  <div className={`accordion-item ${openManualSection === 5 ? 'open' : ''}`}>
                    <button className="accordion-trigger" onClick={() => toggleManualSection(5)}>
                      <span>5. Nexo IA: Tu Asistente Personal</span>
                      <span className="accordion-arrow">▼</span>
                    </button>
                    <div className="accordion-content">
                      <p>Nexo conoce tu ADN Nexo, tu ubicación actual en el sitio y el anime que estás consultando.</p>
                      <ul>
                        <li><strong>Usuario Estándar:</strong> Nexo tendrá una personalidad más sarcástica y tsundere con respuestas breves y directas.</li>
                        <li><strong>Usuario Premium:</strong> Nexo se volverá altamente analítico, permitiéndote pedirle análisis psicológicos profundos sobre personajes o debates filosóficos desde su interfaz flotante avanzada.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Section 6 */}
                  <div className={`accordion-item ${openManualSection === 6 ? 'open' : ''}`}>
                    <button className="accordion-trigger" onClick={() => toggleManualSection(6)}>
                      <span>6. Progreso, Logros y Moderación</span>
                      <span className="accordion-arrow">▼</span>
                    </button>
                    <div className="accordion-content">
                      <h3>6.1 Insignias (Badges)</h3>
                      <p>A medida que interactúas (haciendo posts, recibiendo reacciones, etc.), se te otorgarán medallas y logros visibles en tu perfil.</p>
                      <h3>6.2 Moderación y Apelaciones</h3>
                      <p>Para mantener una comunidad sana, implementamos avisos y shadowbans. Si consideras que se te ha sancionado incorrectamente, tendrás acceso al <strong>Sistema de Apelaciones</strong> para hablar con los moderadores.</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .settings-page {
          width: 100%;
          max-width: 980px;
          margin: 0 auto;
          padding: 2rem 1rem 5rem;
        }

        .settings-header {
          margin-bottom: 2rem;
          animation: aninexo-enter var(--motion-duration-cinematic) var(--motion-ease-emphasized) both;
        }

        .settings-kicker {
          display: inline-block;
          color: var(--color-primary);
          font-size: 0.75rem;
          font-weight: 950;
          letter-spacing: 1.6px;
          text-transform: uppercase;
          margin-bottom: 0.7rem;
        }

        .settings-header h1 {
          color: var(--color-text-main);
          font-size: clamp(2rem, 5vw, 3.6rem);
          line-height: 1;
          letter-spacing: -0.06em;
          margin-bottom: 0.8rem;
        }

        .settings-header p {
          color: var(--color-text-muted);
          line-height: 1.7;
          max-width: 620px;
        }

        .settings-container {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
        }

        .settings-sidebar {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 220px;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.02);
          padding: 1rem;
          border-radius: var(--border-radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(8px);
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          text-align: left;
          padding: 10px 16px;
          border-radius: var(--border-radius-md);
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: var(--color-text-main);
          background: rgba(255, 255, 255, 0.04);
        }

        .tab-btn.active {
          color: #00E5FF;
          background: rgba(0, 229, 255, 0.08);
          border-left: 3px solid #00E5FF;
          padding-left: 13px;
        }

        .settings-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .settings-card {
          padding: 1.6rem;
          animation: aninexo-enter var(--motion-duration-cinematic) var(--motion-ease-emphasized) 120ms both;
        }

        .settings-card-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.4rem;
        }

        .settings-card-header h2 {
          color: var(--color-text-main);
          font-size: 1.35rem;
          margin-bottom: 0.4rem;
        }

        .settings-card-header p {
          color: var(--color-text-muted);
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .mode-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .mode-option {
          min-height: 170px;
          text-align: left;
          padding: 1rem;
          border-radius: var(--border-radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.035);
          color: var(--color-text-main);
          cursor: pointer;
          transition: transform var(--motion-duration-normal) var(--motion-ease-standard), border-color var(--motion-duration-normal) var(--motion-ease-standard), background var(--motion-duration-normal) var(--motion-ease-standard), box-shadow var(--motion-duration-normal) var(--motion-ease-standard);
        }

        .mode-option:hover {
          transform: translateY(-2px);
          border-color: rgba(0, 229, 255, 0.24);
          background: rgba(0, 229, 255, 0.045);
        }

        .mode-option.active {
          border-color: rgba(0, 229, 255, 0.48);
          background: linear-gradient(180deg, rgba(0, 229, 255, 0.1), rgba(255, 255, 255, 0.035));
          box-shadow: 0 0 28px rgba(0, 229, 255, 0.12);
        }

        .mode-option-top {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1rem;
        }

        .mode-dot {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 999px;
          background: var(--color-primary);
          box-shadow: 0 0 18px rgba(0, 229, 255, 0.45);
        }

        .mode-label {
          font-size: 1rem;
          font-weight: 950;
        }

        .mode-description {
          display: block;
          color: var(--color-text-muted);
          line-height: 1.6;
          font-size: 0.9rem;
        }

        .motion-note {
          margin-top: 1rem;
          padding: 0.9rem 1rem;
          border-radius: var(--border-radius-md);
          border: 1px solid rgba(0, 229, 255, 0.22);
          background: rgba(0, 229, 255, 0.07);
          color: rgba(248, 251, 255, 0.86);
          line-height: 1.6;
        }

        /* Security simulated styles */
        .simulated-form {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-group label {
          color: var(--color-text-muted);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .form-group input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          padding: 10px 14px;
          border-radius: var(--border-radius-md);
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-group input:focus, .settings-textarea:focus {
          border-color: rgba(0, 229, 255, 0.5);
        }

        .profile-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .settings-textarea {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          padding: 10px 14px;
          border-radius: var(--border-radius-md);
          font-size: 0.95rem;
          outline: none;
          resize: vertical;
          transition: border-color 0.2s;
        }

        .fav-selected-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--border-radius-md);
          background: rgba(0, 229, 255, 0.05);
          border: 1px solid rgba(0, 229, 255, 0.22);
        }

        .fav-cover-thumb {
          width: 46px;
          height: 64px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .fav-char-thumb {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .fav-cover-thumb.placeholder, .fav-char-thumb.placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.07);
        }

        .fav-selected-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .fav-selected-info strong {
          color: #fff;
          font-size: 0.95rem;
        }

        .fav-selected-info span {
          color: var(--color-text-muted);
          font-size: 0.78rem;
        }

        .fav-clear-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }

        .fav-search-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .fav-searching-text {
          font-size: 0.8rem;
          color: #00E5FF;
        }

        .fav-results-dropdown {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: rgba(12, 16, 26, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--border-radius-md);
          padding: 6px;
          max-height: 220px;
          overflow-y: auto;
        }

        .fav-result-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: none;
          color: #eee;
          padding: 6px 8px;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          font-size: 0.9rem;
        }

        .fav-result-row:hover {
          background: rgba(0, 229, 255, 0.12);
        }

        .fav-result-row img {
          width: 34px;
          height: 46px;
          object-fit: cover;
          border-radius: 6px;
        }

        .error-toast {
          color: #ff6b6b;
          font-size: 0.9rem;
          text-align: center;
        }

        .form-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 0.5rem 0;
        }

        .toggle-setting {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
        }

        .toggle-info h3 {
          font-size: 1rem;
          color: var(--color-text-main);
          margin-bottom: 0.2rem;
        }

        .toggle-info p {
          color: var(--color-text-muted);
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .toggle-switch {
          width: 50px;
          height: 26px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          position: relative;
          cursor: pointer;
          transition: background 0.3s;
        }

        .toggle-switch.active {
          background: #00E5FF;
        }

        .switch-knob {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: transform 0.3s;
        }

        .toggle-switch.active .switch-knob {
          transform: translateX(24px);
        }

        .save-btn {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(168, 85, 247, 0.2));
          border: 1px solid rgba(0, 229, 255, 0.4);
          color: white;
          font-weight: 700;
          padding: 12px;
          border-radius: var(--border-radius-md);
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 0.5rem;
        }

        .save-btn:hover {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.3), rgba(168, 85, 247, 0.3));
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.2);
        }

        .success-toast {
          color: #00FF88;
          font-size: 0.9rem;
          text-align: center;
          animation: fade-in-out 3s forwards;
        }

        /* Privacy page simulated styles */
        .privacy-options {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .privacy-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 12px;
          border-radius: var(--border-radius-md);
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: all 0.2s;
        }

        .privacy-item:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(0, 229, 255, 0.1);
        }

        .privacy-item input[type="checkbox"] {
          margin-top: 4px;
          accent-color: #00E5FF;
          cursor: pointer;
        }

        .privacy-text h3 {
          font-size: 0.95rem;
          color: var(--color-text-main);
          margin-bottom: 0.15rem;
        }

        .privacy-text p {
          color: var(--color-text-muted);
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .success-banner {
          background: rgba(0, 255, 136, 0.08);
          border: 1px solid rgba(0, 255, 136, 0.2);
          color: #00FF88;
          padding: 10px;
          border-radius: var(--border-radius-md);
          text-align: center;
          font-size: 0.85rem;
        }

        /* Help Page manual styles */
        .help-section-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .tour-box {
          background: linear-gradient(90deg, rgba(9, 9, 9, 0.9) 0%, rgba(0, 229, 255, 0.05) 100%);
          border-color: rgba(0, 229, 255, 0.3);
        }

        .tour-box-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
        }

        .tour-box-content h2 {
          color: var(--color-text-main);
          font-size: 1.25rem;
          margin-bottom: 0.3rem;
        }

        .tour-box-content p {
          color: var(--color-text-muted);
          font-size: 0.9rem;
        }

        .tour-trigger-btn {
          background: #00E5FF;
          color: black;
          border: none;
          font-weight: 800;
          padding: 10px 20px;
          border-radius: var(--border-radius-md);
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
        }

        .tour-trigger-btn:hover {
          box-shadow: 0 0 25px rgba(0, 229, 255, 0.5);
          transform: translateY(-1px);
        }

        .manual-accordion {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .accordion-item {
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.01);
          border-radius: var(--border-radius-md);
          overflow: hidden;
          transition: all 0.3s;
        }

        .accordion-item:hover {
          border-color: rgba(255, 255, 255, 0.1);
        }

        .accordion-item.open {
          border-color: rgba(0, 229, 255, 0.2);
          background: rgba(0, 229, 255, 0.01);
        }

        .accordion-trigger {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--color-text-main);
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        }

        .accordion-arrow {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          transition: transform 0.3s;
        }

        .accordion-item.open .accordion-arrow {
          transform: rotate(180deg);
          color: #00E5FF;
        }

        .accordion-content {
          padding: 0 20px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          display: none;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .accordion-item.open .accordion-content {
          display: block;
        }

        .accordion-content h3 {
          font-size: 0.95rem;
          color: #00E5FF;
          margin: 1rem 0 0.4rem;
        }

        .accordion-content h3:first-of-type {
          margin-top: 0.8rem;
        }

        .accordion-content p {
          margin-bottom: 0.6rem;
        }

        .accordion-content ul {
          margin: 0.5rem 0 0.5rem 1.2rem;
        }

        .accordion-content li {
          margin-bottom: 0.4rem;
        }

        @keyframes fade-in-out {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }

        @media (max-width: 820px) {
          .settings-container {
            flex-direction: column;
          }

          .settings-sidebar {
            width: 100%;
            flex-direction: row;
            overflow-x: auto;
          }

          .mode-grid {
            grid-template-columns: 1fr;
          }

          .mode-option {
            min-height: auto;
          }

          .tour-box-content {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
