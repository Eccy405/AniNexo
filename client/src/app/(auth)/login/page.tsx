'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Redirección inteligente por rol
        if (data.data.user.role === 'ADMIN') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-split-page">
      {/* Lado Izquierdo: Imagen de Nexo */}
      <section className="image-side">
        <div className="nexo-image-container">
           <img src="/nexo-login.png" alt="Nexo" className="nexo-bg" />
           <div className="image-overlay"></div>
           <div className="image-text">
             <p>Explora el mundo del anime como nunca antes.</p>
             <p>Descubre personajes, historias y habla con tu personaje favorito.</p>
           </div>
        </div>
      </section>

      {/* Lado Derecho: Formulario */}
      <section className="form-side">
        <div className="login-card">
          <h1 className="login-title">Login</h1>
          
          <form onSubmit={handleLogin} className="auth-form">
            <div className="input-group">
              <input 
                type="email" 
                placeholder="Correo" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group password-group">
              <input 
                type="password" 
                placeholder="Contraseña" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="eye-icon">👁️</span>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Cargando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="signup-link">
            ¿No tienes cuenta? <Link href="/register">Crear cuenta</Link>
          </p>
        </div>
      </section>

      <style jsx>{`
        .login-split-page {
          display: flex;
          height: 100vh;
          width: 100vw;
          background-color: #050505;
          overflow: hidden;
        }

        /* Lado de la Imagen */
        .image-side {
          flex: 1;
          position: relative;
        }

        .nexo-image-container {
          height: 100%;
          width: 100%;
        }

        .nexo-bg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(-90deg, #050505 0%, transparent 40%),
                      linear-gradient(0deg, #050505 0%, transparent 30%);
        }

        .image-text {
          position: absolute;
          bottom: 40px;
          left: 40px;
          text-align: left;
          max-width: 400px;
          color: #888;
          font-size: 0.9rem;
          line-height: 1.5;
          animation: fadeIn 1s ease 0.5s both;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Lado del Formulario */
        .form-side {
          flex: 0 0 45%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .login-card {
          width: 100%;
          max-width: 380px;
          padding: 40px;
          background: rgba(15, 15, 15, 0.4);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(20px);
        }

        .login-title {
          color: #00E5FF;
          font-size: 2rem;
          font-weight: 900;
          margin-bottom: 30px;
          letter-spacing: -0.5px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .input-group input {
          width: 100%;
          padding: 16px 20px;
          background: #11141D;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          color: white;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
        }

        .input-group input:focus {
          border-color: #00E5FF;
          background: #161a25;
        }

        .password-group {
          position: relative;
        }

        .eye-icon {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.5;
          cursor: pointer;
        }

        .login-btn {
          margin-top: 10px;
          background: #00E5FF;
          color: #000;
          padding: 16px;
          border-radius: 12px;
          border: none;
          font-weight: 900;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .login-btn:hover {
          background: #00f2ff;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 229, 255, 0.2);
        }

        .signup-link {
          margin-top: 25px;
          text-align: center;
          color: #888;
          font-size: 0.9rem;
        }

        .signup-link :global(a) {
          color: #00E5FF;
          text-decoration: none;
          font-weight: bold;
        }

        @media (max-width: 1000px) {
          .image-side { display: none; }
          .form-side { flex: 1; }
        }
      `}</style>
    </main>
  );
}
