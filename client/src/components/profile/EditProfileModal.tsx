'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface EditProfileModalProps {
  profile: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    bio: profile.bio || '',
    country: profile.country || '',
    themeColor: profile.themeColor || '#00E5FF'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const result = await res.json();
        // Actualizar datos en memoria y cerrar
        onSave(result.data);
        onClose();
      } else {
        alert('Error al actualizar el perfil');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="edit-modal-content"
        style={{ borderColor: formData.themeColor }}
      >
        <header className="modal-header">
          <h2 style={{ color: formData.themeColor }}>Personalizar Identidad</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </header>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-row">
            <div className="input-group">
              <label>Nombre</label>
              <input 
                type="text" 
                value={formData.firstName} 
                onChange={e => setFormData({...formData, firstName: e.target.value})} 
                placeholder="Tu nombre..."
              />
            </div>
            <div className="input-group">
              <label>Apellido</label>
              <input 
                type="text" 
                value={formData.lastName} 
                onChange={e => setFormData({...formData, lastName: e.target.value})} 
                placeholder="Tu apellido..."
              />
            </div>
          </div>

          <div className="input-group">
            <label>Biografía Nexo</label>
            <textarea 
              value={formData.bio} 
              onChange={e => setFormData({...formData, bio: e.target.value})} 
              placeholder="Cuéntale al mundo sobre tu camino ninja..."
              rows={3}
            />
          </div>

          <div className="input-group">
            <label>País / Dimensión</label>
            <input 
              type="text" 
              value={formData.country} 
              onChange={e => setFormData({...formData, country: e.target.value})} 
              placeholder="Ej: Colombia, Konoha..."
            />
          </div>

          <div className="color-section">
            <label>Color de tu Aura</label>
            <div className="color-options">
              {['#00E5FF', '#FF00E5', '#E5FF00', '#FF4D4D', '#A14DFF', '#FFFFFF'].map(c => (
                <div 
                  key={c} 
                  className={`color-pill ${formData.themeColor === c ? 'active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setFormData({...formData, themeColor: c})}
                />
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-save-profile" 
            style={{ backgroundColor: formData.themeColor }}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Actualizar Nexo ✨'}
          </button>
        </form>
      </motion.div>

      <style jsx>{`
        .edit-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }
        .edit-modal-content {
          background: #0a0a0a;
          border: 1px solid;
          border-radius: 28px;
          width: 100%;
          max-width: 500px;
          padding: 30px;
          box-shadow: 0 0 50px rgba(0,0,0,0.5);
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .modal-header h2 { margin: 0; font-size: 1.5rem; font-weight: 900; }
        .btn-close { background: transparent; border: none; color: #555; font-size: 1.2rem; cursor: pointer; }
        
        .edit-form { display: flex; flex-direction: column; gap: 20px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 0.75rem; font-weight: 800; color: #666; text-transform: uppercase; }
        .input-group input, .input-group textarea {
          background: #111;
          border: 1px solid #222;
          border-radius: 12px;
          padding: 12px;
          color: white;
          outline: none;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .input-group input:focus, .input-group textarea:focus { border-color: rgba(255,255,255,0.3); }
        
        .color-options { display: flex; gap: 10px; margin-top: 5px; }
        .color-pill { width: 35px; height: 35px; border-radius: 50%; cursor: pointer; transition: transform 0.2s; border: 2px solid transparent; }
        .color-pill.active { transform: scale(1.2); border-color: white; }
        
        .btn-save-profile {
          margin-top: 10px;
          padding: 15px;
          border-radius: 12px;
          border: none;
          color: black;
          font-weight: 900;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn-save-profile:hover { transform: translateY(-2px); }
        .btn-save-profile:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};
