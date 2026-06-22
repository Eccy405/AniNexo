'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { OnboardingWizard } from '@/components/auth/OnboardingWizard';
import { FcGoogle } from 'react-icons/fc';
import {
  validateRegisterField,
  getPasswordStrength,
  type RegisterForm,
  type PasswordStrength
} from '@/lib/validators/auth.validator';

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterForm>({
    firstName: '', lastName: '', username: '', email: '',
    password: '', confirmPassword: '', birthDate: '', gender: '', country: ''
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'account' | 'verification' | 'profiling'>('account');
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const FORBIDDEN_CHARS = /[><=&\/]/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof RegisterForm;

    // Block forbidden chars instantly
    if (FORBIDDEN_CHARS.test(value)) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: 'Contiene caracteres prohibidos (> < = & /)'
      }));
      return; // Don't update the value
    }

    const updated = { ...formData, [fieldName]: value };
    setFormData(updated);
    setError('');

    // Real-time validation
    const fieldError = validateRegisterField(fieldName, value, updated);
    setFieldErrors(prev => {
      const next = { ...prev };
      if (fieldError) {
        next[fieldName] = fieldError;
      } else {
        delete next[fieldName];
      }

      // Re-validate confirmPassword when password changes
      if (fieldName === 'password' && updated.confirmPassword) {
        const confirmErr = validateRegisterField('confirmPassword', updated.confirmPassword, updated);
        if (confirmErr) {
          next.confirmPassword = confirmErr;
        } else {
          delete next.confirmPassword;
        }
      }

      return next;
    });
  };

  const passwordStrength: PasswordStrength = getPasswordStrength(formData.password);

  const strengthColor = passwordStrength === 'strong' ? '#00E676' : passwordStrength === 'medium' ? '#FFD600' : '#ff4d4d';
  const strengthLabel = passwordStrength === 'strong' ? 'Fuerte' : passwordStrength === 'medium' ? 'Media' : 'Débil';
  const strengthWidth = passwordStrength === 'strong' ? '100%' : passwordStrength === 'medium' ? '60%' : '30%';

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submitting
    const allErrors: Partial<Record<keyof RegisterForm, string>> = {};
    (Object.keys(formData) as (keyof RegisterForm)[]).forEach(field => {
      const err = validateRegisterField(field, formData[field], formData);
      if (err) allErrors[field] = err;
    });

    if (Object.keys(allErrors).length > 0) {
      setFieldErrors(allErrors);
      setError('Corrige los errores antes de continuar.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.data.token);
        setUserId(data.data.user.id);
        setUserData(data.data.user);
        
        // TEMPORAL DEV FIX: Auto-fill verification code if provided by server
        if (data.data.verificationCode) {
          setVerificationCode(data.data.verificationCode);
        }
        
        setStep('verification');
      } else {
        setError(data.errors?.[0] || data.message || 'Error al registrarse');
      }
    } catch (e) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: verificationCode })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', token);
        const verifiedUser = { ...userData, isVerified: true };
        localStorage.setItem('user', JSON.stringify(verifiedUser));
        setStep('profiling');
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
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/google`;
  };

  const fieldStyle = (field: keyof RegisterForm) => ({
    borderColor: fieldErrors[field] ? '#ff4d4d' : undefined,
    boxShadow: fieldErrors[field] ? '0 0 0 1px rgba(255,77,77,0.3)' : undefined
  });

  return (
    <main className="register-container">
       {/* LADO IZQUIERDO */}
       <section className="side-form">
         <div>
           {step === 'account' && (
             <div key="account" className="register-box animate-fadeInUp animate-delay-100">
               <h1 className="title">Registro</h1>
               <p className="subtitle">PASO 1: IDENTIDAD PERSONAL</p>
               {error && <div className="error-msg">{error}</div>}
 
               <button type="button" className="btn-google" onClick={handleGoogleLogin}>
                 <FcGoogle size={22} />
                 Continuar con Google
               </button>
 
               <div className="divider"><span>O CON TU EMAIL</span></div>
 
               <form onSubmit={handleRegister} className="grid-form">
                 {/* Nombres */}
                 <div className="field">
                   <label>Nombres</label>
                   <input name="firstName" value={formData.firstName} onChange={handleChange} required style={fieldStyle('firstName')} />
                   {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
                 </div>
 
                 {/* Apellidos */}
                 <div className="field">
                   <label>Apellidos</label>
                   <input name="lastName" value={formData.lastName} onChange={handleChange} required style={fieldStyle('lastName')} />
                   {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
                 </div>
 
                 {/* Usuario */}
                 <div className="field">
                   <label>Usuario</label>
                   <input name="username" value={formData.username} onChange={handleChange} required style={fieldStyle('username')} placeholder="Solo letras y números" />
                   {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
                 </div>
 
                 {/* Email */}
                 <div className="field">
                   <label>Email</label>
                   <input name="email" type="email" value={formData.email} onChange={handleChange} required style={fieldStyle('email')} />
                   {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                 </div>
 
                 {/* Nacimiento */}
                 <div className="field">
                   <label>Nacimiento</label>
                   <input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required style={fieldStyle('birthDate')} />
                   {fieldErrors.birthDate && <span className="field-error">{fieldErrors.birthDate}</span>}
                 </div>
 
                 {/* Género */}
                 <div className="field">
                   <label>Género</label>
                   <select name="gender" value={formData.gender} onChange={handleChange} required style={fieldStyle('gender')}>
                     <option value="">Género</option>
                     <option value="Masculino">Masculino</option>
                     <option value="Femenino">Femenino</option>
                   </select>
                   {fieldErrors.gender && <span className="field-error">{fieldErrors.gender}</span>}
                 </div>
 
                 {/* País */}
                 <div className="field full">
                   <label>País</label>
                   <input name="country" value={formData.country} onChange={handleChange} required style={fieldStyle('country')} />
                   {fieldErrors.country && <span className="field-error">{fieldErrors.country}</span>}
                 </div>
 
                 {/* Contraseña */}
                 <div className="field password-wrapper">
                   <label>Contraseña</label>
                   <div className="input-with-eye">
                     <input
                       name="password"
                       type={showPassword ? 'text' : 'password'}
                       value={formData.password}
                       onChange={handleChange}
                       required
                       style={fieldStyle('password')}
                     />
                     <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                       {showPassword ? '🙈' : '👁️'}
                     </span>
                   </div>
                   {formData.password.length > 0 && (
                     <div className="strength-bar-container">
                       <div className="strength-bar" style={{ width: strengthWidth, background: strengthColor }} />
                       <span className="strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
                     </div>
                   )}
                   {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                 </div>
 
                 {/* Confirmar Contraseña */}
                 <div className="field password-wrapper">
                   <label>Confirmar</label>
                   <div className="input-with-eye">
                     <input
                       name="confirmPassword"
                       type={showConfirm ? 'text' : 'password'}
                       value={formData.confirmPassword}
                       onChange={handleChange}
                       required
                       style={fieldStyle('confirmPassword')}
                     />
                     <span className="eye-icon" onClick={() => setShowConfirm(!showConfirm)}>
                       {showConfirm ? '🙈' : '👁️'}
                     </span>
                   </div>
                   {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
                 </div>
 
                 <button type="submit" className="btn-primary" disabled={loading || hasFieldErrors}>
                   {loading ? (
                     <span className="loading-spinner">
                       <span className="spinner"></span> Creando...
                     </span>
                   ) : 'Crear Cuenta →'}
                 </button>
               </form>
               <p className="footer-link">¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></p>
             </div>
           )}
 
           {step === 'verification' && (
             <div key="verification" className="register-box centered-box animate-fadeInUp animate-delay-200">
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
                 <button type="submit" className="btn-primary" disabled={loading}>
                   {loading ? (
                     <span className="loading-spinner">
                       <span className="spinner"></span> Verificando...
                     </span>
                   ) : 'Confirmar Código'}
                 </button>
               </form>
               <button className="resend-link" onClick={() => setStep('account')}>Volver al registro</button>
             </div>
           )}
 
           {step === 'profiling' && (
             <div key="profiling" className="wizard-container animate-fadeInUp animate-delay-300">
               <OnboardingWizard onComplete={() => window.location.href = '/dashboard'} />
             </div>
           )}
         </div>
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
         .side-form { flex: 1; height: 100%; display: flex; align-items: center; justify-content: center; background: #050505; z-index: 2; padding: 20px; overflow-y: auto; }
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
         .field input, .field select { background: #111; border: 1px solid #222; padding: 12px; border-radius: 12px; color: white; outline: none; transition: all 0.2s; }
         .field input:focus, .field select:focus { border-color: #00E5FF; }
 
         /* Field error messages */
         .field-error {
           color: #ff4d4d;
           font-size: 0.7rem;
           margin-top: 2px;
           display: block;
           animation: fadeError 0.2s ease;
         }
 
         @keyframes fadeError {
           from { opacity: 0; transform: translateY(-4px); }
           to { opacity: 1; transform: translateY(0); }
         }
 
         /* Password visibility */
         .password-wrapper { position: relative; }
         .input-with-eye { position: relative; }
         .input-with-eye input { width: 100%; padding-right: 40px; }
         .eye-icon {
           position: absolute;
           right: 12px;
           top: 50%;
           transform: translateY(-50%);
           cursor: pointer;
           opacity: 0.5;
           font-size: 1rem;
           user-select: none;
           transition: opacity 0.2s;
         }
         .eye-icon:hover { opacity: 0.8; }
 
         /* Password strength meter */
         .strength-bar-container {
           display: flex;
           align-items: center;
           gap: 8px;
           margin-top: 4px;
         }
         .strength-bar {
           height: 3px;
           border-radius: 3px;
           transition: width 0.3s ease, background 0.3s ease;
           flex: 1;
           max-width: 60%;
         }
         .strength-label {
           font-size: 0.65rem;
           font-weight: 700;
           text-transform: uppercase;
           letter-spacing: 0.5px;
         }
 
         /* Loading spinner */
         .loading-spinner {
           display: flex;
           align-items: center;
           justify-content: center;
           gap: 8px;
         }
         .spinner {
           display: inline-block;
           width: 16px;
           height: 16px;
           border: 2px solid rgba(0,0,0,0.2);
           border-top-color: #000;
           border-radius: 50%;
           animation: spin 0.6s linear infinite;
         }
         @keyframes spin {
           to { transform: rotate(360deg); }
         }
 
         .btn-primary { grid-column: span 2; width: 100%; background: #00E5FF; color: #000; border: none; padding: 16px; border-radius: 12px; font-weight: 900; cursor: pointer; margin-top: 10px; transition: all 0.3s; }
         .btn-primary:hover:not(:disabled) { background: #00f2ff; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0, 229, 255, 0.2); }
         .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
         .error-msg { background: rgba(255,0,0,0.1); border: 1px solid rgba(255,77,77,0.2); color: #ff4d4d; padding: 12px; border-radius: 12px; margin-bottom: 20px; text-align: center; font-size: 0.85rem; }
         .footer-link { margin-top: 25px; text-align: center; color: #444; }
         .footer-link :global(a) { color: #00E5FF; text-decoration: none; font-weight: bold; }
         
         /* Verificación */
         .verify-form { display: flex; flex-direction: column; gap: 20px; align-items: center; }
         .code-input { background: #111; border: 1px solid #222; color: #00E5FF; font-size: 3rem; font-weight: 900; text-align: center; letter-spacing: 15px; width: 100%; padding: 20px; border-radius: 16px; outline: none; }
         .resend-link { background: none; border: none; color: #555; cursor: pointer; margin-top: 20px; font-size: 0.9rem; }
         .resend-link:hover { color: #00E5FF; }
 
         /* Entrance animations */
         .animate-fadeInUp {
           opacity: 0;
           transform: translateY(20px);
           animation: fadeInUp 0.8s ease-out forwards;
         }
         .animate-delay-100 { animation-delay: 0.1s; }
         .animate-delay-200 { animation-delay: 0.2s; }
         .animate-delay-300 { animation-delay: 0.3s; }
         .animate-delay-400 { animation-delay: 0.4s; }
         .animate-delay-500 { animation-delay: 0.5s; }
 
         @keyframes fadeInUp {
           to {
             opacity: 1;
             transform: translateY(0);
           }
         }
 
         @media (max-width: 1000px) {
           .side-image { display: none; }
           .side-form { flex: 1; }
         }
       `}</style>
    </main>
  );
}
