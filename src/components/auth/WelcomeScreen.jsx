import React, { useState } from 'react';
import AppTutorialModal from '../tutorial/AppTutorialModal';

export default function WelcomeScreen({
  onGoLogin,
  onGoRegister,
  onDirectContinue,
  savedUser,
  onBackToCasita
}) {
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('forma_tutorial_seen');
  });
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% -10%, #dbeafe 0%, #ffffff 55%, #f0f7ff 100%)',
      color: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1.4rem 1.25rem calc(1.4rem + env(safe-area-inset-bottom, 0px))',
      fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* Barra superior con badge minimalista griego */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: '#ffffff',
          border: '1.5px solid #e2e8f0',
          borderRadius: '999px',
          padding: '0.35rem 0.85rem',
          fontSize: '0.72rem',
          fontWeight: 800,
          color: '#005b99',
          boxShadow: '0 2px 8px rgba(0, 91, 153, 0.06)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}>
          <span style={{ color: '#0ea5e9' }}>🏛️</span>
          <span>STRENGTH & DUALIS</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            style={{
              background: '#ffffff',
              border: '1.5px solid #bae6fd',
              borderRadius: '999px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#005b99',
              boxShadow: '0 2px 8px rgba(0, 91, 153, 0.05)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>📖</span>
            <span>Tutorial & Permisos</span>
          </button>

          {onBackToCasita && (
            <button
              type="button"
              onClick={onBackToCasita}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ‹ CasitaHub
            </button>
          )}
        </div>
      </div>

      {/* Contenido Central / Hero Griego Minimalista */}
      <div style={{ maxWidth: '440px', margin: '0 auto', width: '100%', textAlign: 'center', padding: '1rem 0' }}>
        {/* Logo FORMA Minimalista Griego */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 1.4rem auto',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(0, 91, 153, 0.2) 0%, rgba(14, 165, 233, 0.15) 100%)',
            filter: 'blur(16px)',
            opacity: 0.8
          }} />
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '24px',
            background: '#ffffff',
            border: '2px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0, 91, 153, 0.15)'
          }}>
            {/* Isotipo FORMA en Azul Egeo y Oro */}
            <svg width="44" height="44" viewBox="0 0 512 512" fill="none">
              <rect x="135" y="110" width="60" height="290" rx="16" fill="#005B99" />
              <rect x="195" y="110" width="190" height="65" rx="16" fill="#0EA5E9" />
              <rect x="195" y="220" width="140" height="60" rx="14" fill="#0284C7" />
              <circle cx="370" cy="355" r="20" fill="#C59B27" />
            </svg>
          </div>
        </div>

        <h1 style={{
          fontSize: '2.6rem',
          lineHeight: 1.08,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          margin: '0 0 0.35rem 0',
          color: '#004b87'
        }}>
          FORMA
        </h1>

        <div style={{
          fontSize: '0.88rem',
          fontWeight: 800,
          color: '#005b99',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '0.9rem'
        }}>
          Intelligent Strength & Dualis Training
        </div>

        <p style={{
          color: '#475569',
          fontSize: '0.92rem',
          lineHeight: 1.55,
          margin: '0 0 1.8rem 0',
          fontWeight: 500
        }}>
          Tu sistema inteligente de entrenamiento en gimnasio, sobrecarga progresiva, nutrición y modo <strong style={{ color: '#005b99' }}>Dualis</strong> en pareja.
        </p>

        {/* Tarjetas de características clave en blanco mármol */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.65rem',
          textAlign: 'left',
          marginBottom: '1.8rem'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '0.85rem 0.95rem',
            boxShadow: '0 4px 14px rgba(0, 91, 153, 0.04)'
          }}>
            <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>⚡</div>
            <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>Sobrecarga Real</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
              Progresión precisa de kilos y repeticiones.
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1.5px solid #bae6fd',
            borderRadius: '16px',
            padding: '0.85rem 0.95rem',
            boxShadow: '0 4px 14px rgba(0, 91, 153, 0.06)'
          }}>
            <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>👫</div>
            <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#005b99' }}>Modo DUALIS</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
              Entrena en pareja en 1 o 2 móviles sincronizados.
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '0.85rem 0.95rem',
            boxShadow: '0 4px 14px rgba(0, 91, 153, 0.04)'
          }}>
            <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>⏱️</div>
            <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>Cronos & Audio</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
              Recuperación guiada y avisos sin bloqueos.
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1.5px solid #fef08a',
            borderRadius: '16px',
            padding: '0.85rem 0.95rem',
            boxShadow: '0 4px 14px rgba(197, 155, 39, 0.08)'
          }}>
            <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>🏛️</div>
            <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#92400e' }}>Planes Micro</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
              Desde 1€, 3€ y 5€ al mes sin permanencia.
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Inferiores */}
      <div style={{ maxWidth: '440px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Si ya hay usuario guardado */}
        {savedUser && (
          <button
            type="button"
            onClick={() => onDirectContinue(savedUser)}
            style={{
              background: 'linear-gradient(135deg, #005b99 0%, #004b87 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '18px',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              boxShadow: '0 10px 25px rgba(0, 91, 153, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Continuar como <strong>{savedUser}</strong></span>
            <span>→</span>
          </button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: savedUser ? '1fr 1fr' : '1fr', gap: '0.65rem' }}>
          {!savedUser && (
            <button
              type="button"
              onClick={onGoRegister}
              style={{
                background: 'linear-gradient(135deg, #005b99 0%, #004b87 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '18px',
                padding: '1.05rem',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(0, 91, 153, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🚀 Empezar ahora</span>
              <span>→</span>
            </button>
          )}

          <button
            type="button"
            onClick={onGoLogin}
            style={{
              background: '#ffffff',
              color: '#005b99',
              border: '1.5px solid #bae6fd',
              borderRadius: '18px',
              padding: '0.95rem',
              fontSize: '0.92rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 91, 153, 0.05)',
              transition: 'all 0.15s ease'
            }}
          >
            {savedUser ? 'Cambiar cuenta' : 'Ya tengo cuenta (Iniciar sesión)'}
          </button>
        </div>

        {/* Enlace para descargar APK en Android */}
        <div style={{ textAlign: 'center', marginTop: '0.4rem' }}>
          <a
            href="/Forma.apk"
            download="Forma.apk"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#005b99',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              background: '#f0f7ff',
              border: '1px solid #bae6fd'
            }}
          >
            <span>📲</span>
            <span>Instalar Forma.apk en Android</span>
          </a>
        </div>
      </div>

      {/* Tutorial Interactivo con Permisos de Dispositivo */}
      <AppTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  );
}
