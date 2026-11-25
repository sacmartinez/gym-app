import React, { useState, useEffect } from 'react';

export default function AppTutorialModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [cameraStatus, setCameraStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [notifStatus, setNotifStatus] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [soundTested, setSoundTested] = useState(false);

  useEffect(() => {
    // Check initial camera permission if query is supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' })
        .then(p => {
          setCameraStatus(p.state);
          p.onchange = () => setCameraStatus(p.state);
        })
        .catch(() => {});
    }
  }, []);

  if (!isOpen) return null;

  const handleRequestCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Stop stream immediately after permission granted
        stream.getTracks().forEach(t => t.stop());
        setCameraStatus('granted');
      } else {
        alert('Tu navegador o dispositivo no soporta acceso directo a la cámara.');
      }
    } catch (err) {
      console.warn('Permiso de cámara denegado o cancelado:', err);
      setCameraStatus('denied');
    }
  };

  const handleRequestNotifications = async () => {
    try {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        setNotifStatus(perm);
        if (perm === 'granted') {
          new Notification('🏛️ FORMA Activada', {
            body: '¡Notificaciones habilitadas para avisos de descanso y modo DUALIS!',
            icon: '/icon-192.png'
          });
        }
      } else {
        alert('Las notificaciones no están disponibles en este dispositivo/navegador.');
      }
    } catch (e) {
      console.warn('Error solicitando notificaciones:', e);
    }
  };

  const handleTestSoundAndVibrate = () => {
    try {
      // Audio Beep
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);

      // Vibration
      if (navigator.vibrate) {
        navigator.vibrate([150, 80, 150]);
      }
      setSoundTested(true);
    } catch (e) {
      console.warn('Error testing audio/vibrate:', e);
    }
  };

  const handleClose = () => {
    localStorage.setItem('forma_tutorial_seen', 'true');
    onClose && onClose();
  };

  const steps = [
    {
      badge: '🏛️ FILOSOFÍA FORMA',
      title: 'Bienvenido a FORMA',
      subtitle: 'Tu templo de fuerza, constancia y estética griega',
      color: '#005b99',
      icon: '🏛️',
      content: (
        <div>
          <p style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '0.92rem', lineHeight: 1.55 }}>
            Diseñada desde cero con una <strong>estética luminosa, limpia y minimalista</strong> en mármol blanco, azul egeo y oro olímpico. Nada de fondos oscuros ni distracciones.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem', textAlign: 'left' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>⚡</div>
              <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>Fuerza Inteligente</strong>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Rutinas guiadas día a día para ganar masa muscular y quemar grasa.</span>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem', textAlign: 'left' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>📈</div>
              <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>Sobrecarga Real</strong>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Registra tus cargas y progresa cada semana sin estancarte.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: '👫 MODO DUALIS',
      title: 'Entrena en Pareja con DUALIS',
      subtitle: 'Desde 1 móvil o 2 móviles sincronizados',
      color: '#7c3aed',
      icon: '⚡',
      content: (
        <div>
          <p style={{ margin: '0 0 0.9rem 0', color: '#334155', fontSize: '0.92rem', lineHeight: 1.55 }}>
            ¿Entrenas con tu pareja o amigo? El modo <strong>DUALIS</strong> hace que entrenar juntos sea fluido y motivador:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left' }}>
            <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '14px', padding: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1.1rem' }}>📱</span>
                <strong style={{ fontSize: '0.86rem', color: '#1e40af' }}>Modo 1 Solo Móvil (Ficha Dinámica)</strong>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#3b82f6', lineHeight: 1.45 }}>
                La pantalla cambia de color automáticamente a quien le toque la serie: <strong>Azul Egeo</strong> para un atleta y <strong>Morado Amatista</strong> para el compañero, mostrando sus kilos y repeticiones personalizados sin rodeos.
              </div>
            </div>

            <div style={{ background: '#faf5ff', border: '1.5px solid #ddd6fe', borderRadius: '14px', padding: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1.1rem' }}>📲📲</span>
                <strong style={{ fontSize: '0.86rem', color: '#6b21a8' }}>Modo 2 Móviles Sincronizados</strong>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#7c3aed', lineHeight: 1.45 }}>
                Cada uno entrena con su propio móvil. Las series completadas se sincronizan al instante en la nube para ambos.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: '📖 TÉCNICA & CALIBRACIÓN',
      title: 'Instrucciones & Sobrecarga',
      subtitle: 'Nunca dudes en una máquina ni en qué peso poner',
      color: '#059669',
      icon: '🏋️',
      content: (
        <div>
          <p style={{ margin: '0 0 0.9rem 0', color: '#334155', fontSize: '0.92rem', lineHeight: 1.55 }}>
            Cada estación de entrenamiento está equipada con asistencia instantánea:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📖</span>
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>Técnica & Músculos</strong>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Postura, colocación de hombros, rango de movimiento y músculos implicados.</span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📸</span>
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>Ver Máquina / Foto</strong>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Foto ilustrativa de la máquina para encontrarla rápido en el gimnasio.</span>
              </div>
            </div>

            <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: '12px', padding: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🎯</span>
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#047857', display: 'block' }}>Calibración de Carga</strong>
                <span style={{ fontSize: '0.74rem', color: '#065f46' }}>Al acabar el ejercicio, indica si te resultó fácil para subir (+2.5 kg), mantener o bajar para la próxima vez.</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: '🔐 PERMISOS DEL DISPOSITIVO',
      title: 'Permisos Recomendados',
      subtitle: 'Actívalos ahora para disfrutar de la experiencia completa',
      color: '#0284c7',
      icon: '📱',
      content: (
        <div>
          <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.86rem', lineHeight: 1.5 }}>
            FORMA respeta tu privacidad y solo usa estos permisos para funciones de entrenamiento:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
            {/* Permiso de Cámara */}
            <div style={{
              background: '#ffffff',
              border: cameraStatus === 'granted' ? '2px solid #10b981' : '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.6rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>📸</span>
                <div>
                  <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>Cámara</strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Escaneo de pantallas de cardio y fotos de máquinas.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestCamera}
                disabled={cameraStatus === 'granted'}
                style={{
                  background: cameraStatus === 'granted' ? '#ecfdf5' : '#005b99',
                  color: cameraStatus === 'granted' ? '#047857' : '#ffffff',
                  border: cameraStatus === 'granted' ? '1px solid #a7f3d0' : 'none',
                  borderRadius: '10px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: cameraStatus === 'granted' ? 'default' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cameraStatus === 'granted' ? '✅ Permitida' : 'Permitir'}
              </button>
            </div>

            {/* Permiso de Notificaciones */}
            <div style={{
              background: '#ffffff',
              border: notifStatus === 'granted' ? '2px solid #10b981' : '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.6rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🔔</span>
                <div>
                  <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>Notificaciones</strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Avisos de fin de descanso y tu turno en DUALIS.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRequestNotifications}
                disabled={notifStatus === 'granted'}
                style={{
                  background: notifStatus === 'granted' ? '#ecfdf5' : '#005b99',
                  color: notifStatus === 'granted' ? '#047857' : '#ffffff',
                  border: notifStatus === 'granted' ? '1px solid #a7f3d0' : 'none',
                  borderRadius: '10px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: notifStatus === 'granted' ? 'default' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {notifStatus === 'granted' ? '✅ Activas' : 'Activar'}
              </button>
            </div>

            {/* Audio y Vibración */}
            <div style={{
              background: '#ffffff',
              border: soundTested ? '2px solid #10b981' : '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.6rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.4rem' }}>⏱️</span>
                <div>
                  <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>Sonido y Vibración</strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Alerta acústica y háptica de recuperación.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestSoundAndVibrate}
                style={{
                  background: soundTested ? '#ecfdf5' : '#f0f9ff',
                  color: soundTested ? '#047857' : '#0369a1',
                  border: '1px solid #bae6fd',
                  borderRadius: '10px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {soundTested ? '✅ Probado' : 'Probar'}
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      badge: '🏛️ PLANES OLÍMPICOS',
      title: 'Planes Micro: 1€, 3€ y 5€/mes',
      subtitle: 'Sin letra pequeña ni precios inflados',
      color: '#c59b27',
      icon: '💳',
      content: (
        <div>
          <p style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '0.92rem', lineHeight: 1.55 }}>
            Puedes usar FORMA gratis o desbloquear el poder completo de tu templo cuando lo necesites:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left' }}>
            <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>Plan Hermes</strong>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Historial ilimitado, gráficas y macros.</span>
              </div>
              <span style={{ background: '#f1f5f9', color: '#334155', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 900 }}>1 € / mes</span>
            </div>

            <div style={{ background: '#f0f9ff', border: '2px solid #005b99', borderRadius: '12px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#005b99', display: 'block' }}>Plan Apolo · Dualis Pro ⭐</strong>
                <span style={{ fontSize: '0.72rem', color: '#0369a1' }}>DUALIS en 2 móviles, IA y lector OCR de cardio.</span>
              </div>
              <span style={{ background: '#005b99', color: '#ffffff', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 900 }}>3 € / mes</span>
            </div>

            <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#92400e', display: 'block' }}>Plan Zeus · Olimpo VIP</strong>
                <span style={{ fontSize: '0.72rem', color: '#78350f' }}>Rutinas ilimitadas, stories HD y modo offline.</span>
              </div>
              <span style={{ background: '#fef3c7', color: '#b45309', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 900 }}>5 € / mes</span>
            </div>
          </div>
          <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
            💡 Accede a los planes en cualquier momento desde el botón <strong>🏛️ Planes</strong> en la cabecera.
          </div>
        </div>
      )
    }
  ];

  const activeStepObj = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '24px',
        border: '2px solid #bae6fd',
        boxShadow: '0 20px 60px rgba(0, 91, 153, 0.25)',
        padding: '1.5rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Cabecera del modal: Barra de pasos y Botón Cerrar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#f0f7ff',
            border: '1px solid #bae6fd',
            borderRadius: '999px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: activeStepObj.color
          }}>
            <span>{activeStepObj.badge}</span>
            <span>·</span>
            <span>Paso {currentStep + 1} de {steps.length}</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '999px',
              width: '32px',
              height: '32px',
              color: '#64748b',
              fontSize: '1.2rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}
            title="Cerrar tutorial"
          >
            &times;
          </button>
        </div>

        {/* Título e Icono del paso */}
        <div style={{ textAlign: 'center', marginBottom: '1.1rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%)',
            border: '1.5px solid #bae6fd',
            margin: '0 auto 0.75rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 6px 18px rgba(0, 91, 153, 0.08)'
          }}>
            {activeStepObj.icon}
          </div>

          <h2 style={{
            margin: '0 0 0.25rem 0',
            fontSize: '1.3rem',
            fontWeight: 900,
            color: '#0f172a',
            lineHeight: 1.25
          }}>
            {activeStepObj.title}
          </h2>

          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            {activeStepObj.subtitle}
          </div>
        </div>

        {/* Contenido dinámico del paso */}
        <div style={{ flex: 1, marginBottom: '1.4rem' }}>
          {activeStepObj.content}
        </div>

        {/* Indicador de puntos (Dots) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.45rem', marginBottom: '1.1rem' }}>
          {steps.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentStep(i)}
              style={{
                width: currentStep === i ? '24px' : '8px',
                height: '8px',
                borderRadius: '999px',
                background: currentStep === i ? '#005b99' : '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            />
          ))}
        </div>

        {/* Botones de navegación y Cerrar */}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              style={{
                flex: 1,
                padding: '0.85rem',
                borderRadius: '14px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              ← Anterior
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (isLast) {
                handleClose();
              } else {
                setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
              }
            }}
            style={{
              flex: 2,
              padding: '0.85rem',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #005b99 0%, #004b87 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 91, 153, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <span>{isLast ? '🏛️ ¡Entendido! Empezar' : 'Siguiente'}</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    </div>
  );
}
