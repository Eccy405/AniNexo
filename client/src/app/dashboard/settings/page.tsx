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

type Tab = 'appearance' | 'security' | 'privacy' | 'help';

export default function DashboardSettingsPage() {
  const backgroundMode = useUIStore((state) => state.backgroundMode);
  const setBackgroundMode = useUIStore((state) => state.setBackgroundMode);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('appearance');

  // Simulated state for security
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [twoFactor, setTwoFactor] = useState(false);
  const [securitySaved, setSecuritySaved] = useState(false);

  // Simulated state for privacy
  const [privacySettings, setPrivacySettings] = useState({
    privateProfile: false,
    showAnimeList: true,
    allowDMs: true,
    showActivity: true,
  });
  const [privacySaved, setPrivacySaved] = useState(false);

  // Accordion state for User Manual
  const [openManualSection, setOpenManualSection] = useState<number | null>(null);

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
      window.location.href = '/dashboard';
    }
  };

  const handleSecuritySave = (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySaved(true);
    setTimeout(() => setSecuritySaved(false), 3000);
    setPasswordForm({ old: '', new: '', confirm: '' });
  };

  const togglePrivacy = (key: keyof typeof privacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
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

                <div className="privacy-item" onClick={() => togglePrivacy('showAnimeList')}>
                  <input type="checkbox" checked={privacySettings.showAnimeList} readOnly />
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
                  <div className="success-banner">✓ Preferencias de privacidad actualizadas (simulado)</div>
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

        .form-group input:focus {
          border-color: rgba(0, 229, 255, 0.5);
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
