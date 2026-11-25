import React, { useState, useEffect } from 'react';

export default function CoopSetupModal({
  activeUser = 'Atleta',
  onClose,
  onStartCoop
}) {
  const defaultPartner = 'Compañero';

  // 1. Modo de dispositivo: 'single' (1 móvil compartido) | 'dual' (2 móviles)
  const [deviceMode, setDeviceMode] = useState('single');

  // 2. Datos del compañero/a
  const [partnerName, setPartnerName] = useState(defaultPartner);
  const [partnerPhone, setPartnerPhone] = useState('');
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [userFound, setUserFound] = useState(null); // { name, phone } | null
  const [checkError, setCheckError] = useState('');

  // Cargar teléfono si ya estaba guardado en localStorage o base de datos
  useEffect(() => {
    const savedPhone = localStorage.getItem(`gym_user_phone_${partnerName}`) || '';
    if (savedPhone) {
      setPartnerPhone(savedPhone);
      checkPhoneNumber(savedPhone, partnerName);
    } else {
      // Intentar buscar usuarios de la app
      fetch('/api/gym/auth/users')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data.users)) {
            const match = data.users.find(u => u.name.toLowerCase() === partnerName.toLowerCase());
            if (match && match.phone) {
              setPartnerPhone(match.phone);
              setUserFound(match);
            }
          }
        })
        .catch(() => {});
    }
  }, [partnerName]);

  const checkPhoneNumber = async (phoneVal, targetName) => {
    const clean = (phoneVal || '').replace(/\D/g, '');
    if (clean.length < 9) {
      setUserFound(null);
      return;
    }

    setPhoneChecking(true);
    setCheckError('');
    try {
      const res = await fetch(`/api/gym/auth/check-phone?phone=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.exists && data.user) {
        setUserFound(data.user);
      } else {
        const localPartnerPhone = (localStorage.getItem(`gym_user_phone_${targetName}`) || '').replace(/\D/g, '');
        if (clean === localPartnerPhone || clean.length >= 9) {
          setUserFound({ name: targetName, phone: clean });
        } else {
          setUserFound(null);
        }
      }
    } catch (_) {
      if (clean.length >= 9) {
        setUserFound({ name: targetName, phone: clean });
      } else {
        setUserFound(null);
      }
    } finally {
      setPhoneChecking(false);
    }
  };

  const handlePhoneChange = (val) => {
    setPartnerPhone(val);
    checkPhoneNumber(val, partnerName);
  };

  const handleSendWhatsAppInvite = () => {
    const clean = partnerPhone.replace(/\D/g, '');
    const apkUrl = 'https://lubricate-deserve-landmark.ngrok-free.dev/Forma.apk';
    const msg = `¡Hola ${partnerName}! ⚡ He iniciado nuestro entrenamiento en pareja en Modo DUALIS en la app FORMA. Descárgate la app aquí para sincronizar tus pesos y series en tiempo real: ${apkUrl}`;
    const waUrl = `https://api.whatsapp.com/send?phone=${clean ? (clean.startsWith('34') ? clean : '34' + clean) : ''}&text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleConfirmStart = () => {
    onStartCoop({
      deviceMode, // 'single' | 'dual'
      partnerName: partnerName.trim() || defaultPartner,
      partnerPhone: partnerPhone.trim(),
      isRegisteredPartner: !!userFound
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '95%',
          maxHeight: '94vh',
          background: '#ffffff',
          borderRadius: '26px',
          border: '1.5px solid #e2e8f0',
          padding: '1.6rem 1.4rem',
          boxShadow: '0 25px 70px rgba(0, 91, 153, 0.16)',
          color: '#0f172a'
        }}
      >
        {/* Cabecera Griega */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#f0f7ff',
              border: '1.5px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem'
            }}>
              ⚡
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#004b87' }}>
                Configurar Modo DUALIS
              </h3>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Entrenamiento conjunto de alta intensidad
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: '1.2rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {/* 1. SELECCIÓN DE DISPOSITIVO: 1 MÓVIL vs 2 MÓVILES */}
        <div style={{ marginBottom: '1.4rem' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
            1️⃣ ¿Cómo vais a entrenar hoy?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            {/* Opción A: 1 Móvil compartido */}
            <div
              onClick={() => setDeviceMode('single')}
              style={{
                border: deviceMode === 'single' ? '2.5px solid #005b99' : '1.5px solid #e2e8f0',
                background: deviceMode === 'single' ? '#f0f7ff' : '#ffffff',
                borderRadius: '16px',
                padding: '0.9rem 0.8rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                boxShadow: deviceMode === 'single' ? '0 4px 14px rgba(0, 91, 153, 0.08)' : 'none'
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>📱</div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#004b87' }}>
                1 Solo Móvil
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.35 }}>
                Turnos dinámicos por colores al acabar cada serie.
              </div>
            </div>

            {/* Opción B: 2 Móviles sincronizados */}
            <div
              onClick={() => setDeviceMode('dual')}
              style={{
                border: deviceMode === 'dual' ? '2.5px solid #005b99' : '1.5px solid #e2e8f0',
                background: deviceMode === 'dual' ? '#f0f7ff' : '#ffffff',
                borderRadius: '16px',
                padding: '0.9rem 0.8rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                boxShadow: deviceMode === 'dual' ? '0 4px 14px rgba(0, 91, 153, 0.08)' : 'none'
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>📲 📲</div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#004b87' }}>
                2 Móviles
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.35 }}>
                Sincronización en vivo mediante el servidor.
              </div>
            </div>
          </div>
        </div>

        {/* 2. DATOS DEL COMPAÑERO / COMPAÑERA */}
        <div style={{ marginBottom: '1.4rem' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            2️⃣ ¿Con quién entrenas hoy?
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                Nombre del compañero/a:
              </span>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Nombre del compañero"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '0.65rem 0.85rem',
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>
                Teléfono móvil (para vincular o invitar):
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="tel"
                  value={partnerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Ej. 612 345 678"
                  style={{
                    flex: 1,
                    boxSizing: 'border-box',
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '0.65rem 0.85rem',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
                {phoneChecking && (
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
                    Comprobando...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. ESTADO DE REGISTRO EN LA APP */}
        {partnerPhone.replace(/\D/g, '').length >= 9 && (
          <div style={{
            marginBottom: '1.4rem',
            padding: '0.85rem',
            borderRadius: '14px',
            background: userFound ? '#f0fdf4' : '#fff7ed',
            border: `1.5px solid ${userFound ? '#bbf7d0' : '#fed7aa'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.6rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{userFound ? '✅' : '📲'}</span>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: userFound ? '#15803d' : '#c2410c' }}>
                  {userFound
                    ? `¡${userFound.name || partnerName} ya está en FORMA!`
                    : `${partnerName} aún no tiene la app instalada`}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {userFound
                    ? 'Los pesos y series se guardarán automáticamente en su perfil.'
                    : 'Invítale por WhatsApp para que descargue Forma.apk.'}
                </div>
              </div>
            </div>

            {!userFound && (
              <button
                type="button"
                onClick={handleSendWhatsAppInvite}
                style={{
                  background: '#25D366',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.74rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>💬</span>
                <span>Invitar</span>
              </button>
            )}
          </div>
        )}

        {/* BOTÓN FINAL DE COMENZAR */}
        <button
          type="button"
          onClick={handleConfirmStart}
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #005b99 0%, #004b87 100%)',
            color: '#ffffff',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 8px 24px rgba(0, 91, 153, 0.25)',
            transition: 'all 0.15s ease'
          }}
        >
          <span>⚡ Empezar Entrenamiento DUALIS</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
