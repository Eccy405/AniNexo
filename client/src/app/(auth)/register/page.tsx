'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { OnboardingWizard } from '@/components/auth/OnboardingWizard';
import { motion, AnimatePresence } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', username: '', email: '',
    password: '', confirmPassword: '', birthDate: '', gender: '', country: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'account' | 'verification' | 'profiling'>('account');
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.data.token);
        setUserId(data.data.user.id);
        setUserData(data.data.user);
        setStep('verification'); // Ir a verificación de email
      } else {
        setError(data.message || 'Error al registrarse');
      }
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: verificationCode })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setStep('profiling'); // Ir al cuestionario inteligente
      } else {
        setError('Código incorrecto. Revisa tu correo.');
      }
    } catch (e) {
      setError('Error verificando código');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3001/api/auth/google';
  };

  return (
    <main className="register-container">
      {/* LADO IZQUIERDO */}
      <section className="side-form">
        <AnimatePresence mode="wait">
          {step === 'account' && (
            <motion.div key="account" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="register-box">
              <h1 className="title">Registro</h1>
              <p className="subtitle">PASO 1: IDENTIDAD PERSONAL</p>
              {error && <div className="error-msg">{error}</div>}

              <button type="button" className="btn-google" onClick={handleGoogleLogin}>
                <FcGoogle size={22} />
                Continuar con Google
              </button>

              <div className="divider"><span>O CON TU EMAIL</span></div>

              <form onSubmit={handleRegister} className="grid-form">
                <div className="field"><label>Nombres</label><input name="firstName" value={formData.firstName} onChange={handleChange} required /></div>
                <div className="field"><label>Apellidos</label><input name="lastName" value={formData.lastName} onChange={handleChange} required /></div>
                <div className="field"><label>Usuario</label><input name="username" value={formData.username} onChange={handleChange} required /></div>
                <div className="field"><label>Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} required /></div>
                <div className="field"><label>Nacimiento</label><input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required /></div>
                <div className="field"><label>Género</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Género</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div className="field full"><label>País</label><input name="country" value={formData.country} onChange={handleChange} required /></div>
                <div className="field"><label>Contraseña</label><input name="password" type="password" value={formData.password} onChange={handleChange} required /></div>
                <div className="field"><label>Confirmar</label><input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required /></div>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creando...' : 'Crear Cuenta →'}</button>
              </form>
              <p className="footer-link">¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></p>
            </motion.div>
          )}

          {step === 'verification' && (
            <motion.div key="verification" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="register-box centered-box">
              <h1 className="title">Verifica tu Email</h1>
              <p className="subtitle">Hemos enviado un código de 6 dígitos a tu correo.</p>
              {error && <div className="error-msg">{error}</div>}
              <form onSubmit={handleVerify} className="verify-form">
                <input 
                  type="text" 
                  maxLength={6} 
                  placeholder="000000" 
                  className="code-input"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Verificando...' : 'Confirmar Código'}</button>
              </form>
              <button className="resend-link" onClick={() => setStep('account')}>Volver al registro</button>
            </motion.div>
          )}

          {step === 'profiling' && (
            <motion.div key="profiling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="wizard-container">
              <OnboardingWizard onComplete={() => window.location.href = '/dashboard'} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="side-image">
        <div className="image-wrapper">
          <img src="/nexo-register.png" alt="Nexo" className="hero-img" />
          <div className="hero-overlay">
             <h2>{step === 'verification' ? 'Seguridad Ante Todo' : 'Empieza tu aventura'}</h2>
             <p>{step === 'verification' ? 'Protegemos tu cuenta para que nadie más la use.' : 'Crea tu perfil inteligente y deja que Nexo AI te guíe.'}</p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .register-container { display: flex; height: 100vh; width: 100vw; background: #000; overflow: hidden; }
        .side-form { flex: 1; height: 100%; display: flex; align-items: center; justify-content: center; background: #050505; z-index: 2; padding: 20px; }
        .side-image { flex: 1; position: relative; }
        .image-wrapper { width: 100%; height: 100%; }
        .hero-img { width: 100%; height: 100%; object-fit: cover; }
        .hero-overlay { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 60%); display: flex; flex-direction: column; justify-content: flex-end; padding: 60px; color: white; }
        .register-box { width: 100%; max-width: 500px; padding: 40px; background: rgba(15, 15, 15, 0.6); border: 1px solid rgba(255,255,255,0.05); backdrop-filter: blur(20px); border-radius: 32px; }
        .title { color: #00E5FF; font-size: 2.5rem; font-weight: 900; }
        .subtitle { color: #555; font-size: 0.7rem; font-weight: 800; letter-spacing: 2px; margin-bottom: 30px; }
        
        .btn-google { width: 100%; padding: 14px; background: white; color: black; border-radius: 12px; border: none; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; margin-bottom: 20px; transition: all 0.2s; }
        .btn-google:hover { background: #eee; transform: translateY(-2px); }
        
        .divider { text-align: center; border-bottom: 1px solid #222; height: 10px; margin-bottom: 30px; }
        .divider span { background: #050505; padding: 0 15px; color: #444; font-size: 0.7rem; font-weight: 800; }

        .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field.full { grid-column: span 2; }
        .field label { color: #666; font-size: 0.75rem; font-weight: 700; }
        .field input, .field select { background: #111; border: 1px solid #222; padding: 12px; border-radius: 12px; color: white; outline: none; }
        .field input:focus { border-color: #00E5FF; }

        .btn-primary { grid-column: span 2; width: 100%; background: #00E5FF; color: #000; border: none; padding: 16px; border-radius: 12px; font-weight: 900; cursor: pointer; margin-top: 10px; }
        .error-msg { background: rgba(255,0,0,0.1); color: #ff4d4d; padding: 12px; border-radius: 12px; margin-bottom: 20px; text-align: center; }
        .footer-link { margin-top: 25px; text-align: center; color: #444; }
        
        /* Verificación */
        .verify-form { display: flex; flex-direction: column; gap: 20px; align-items: center; }
        .code-input { background: #111; border: 1px solid #222; color: #00E5FF; font-size: 3rem; font-weight: 900; text-align: center; letter-spacing: 15px; width: 100%; padding: 20px; border-radius: 16px; outline: none; }
        .resend-link { background: none; border: none; color: #555; cursor: pointer; margin-top: 20px; font-size: 0.9rem; }
        .resend-link:hover { color: #00E5FF; }
      `}</style>
    </main>
  );
}
