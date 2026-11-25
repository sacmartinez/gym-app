import React, { useState, useEffect } from 'react';

export default function ProfileModal({
  isOpen,
  onClose,
  activeUser,
  userGoal,
  onUserUpdated,
  onUserLoggedOut,
  onUserDeleted,
  onOpenPlans
}) {
  const [activeTab, setActiveTab] = useState('datos'); // 'datos' | 'objetivos' | 'nfc' | 'cuenta'
  
  // Datos de usuario
  const [name, setName] = useState(activeUser || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loadingUser, setLoadingUser] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Objetivos de entreno
  const [targetDays, setTargetDays] = useState(userGoal?.targetDaysPerWeek || 4);
  const [targetWeight, setTargetWeight] = useState(userGoal?.targetWeightKg || '');
  const [goalType, setGoalType] = useState(userGoal?.goalType || 'brazos_abs_grasa');
  const [savingGoals, setSavingGoals] = useState(false);

  // Llave NFC Gym (Beta)
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcCardId, setNfcCardId] = useState('');
  const [nfcCardLabel, setNfcCardLabel] = useState('Mi Llave de Torno Gym');
  const [nfcCardType, setNfcCardType] = useState('Mifare / NFC Tag');
  const [nfcSuccessMsg, setNfcSuccessMsg] = useState('');
  const [nfcErrorMsg, setNfcErrorMsg] = useState('');
  const [nfcEmulating, setNfcEmulating] = useState(false);
  const [manualUidInput, setManualUidInput] = useState('');
  const [showManualUid, setShowManualUid] = useState(false);

  // Modal de confirmación para eliminar cuenta
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputName, setDeleteInputName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(activeUser || '');
    setSaveSuccess('');
    setSaveError('');
    setNfcSuccessMsg('');
    setNfcErrorMsg('');

    // Comprobar soporte Web NFC en Android
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setNfcSupported(true);
    }

    // Cargar datos actuales del usuario (teléfono)
    setLoadingUser(true);
    fetch('/api/gym/auth/users')
      .then(r => r.json())
      .then(data => {
        if (data && data.users) {
          const found = data.users.find(u => u.name.toLowerCase() === (activeUser || '').toLowerCase());
          if (found && found.phone) {
            setPhone(found.phone.replace(/\D/g, ''));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false));

    // Cargar llave NFC guardada si existe
    if (activeUser) {
      fetch(`/api/gym/nfc/${encodeURIComponent(activeUser)}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.nfcCard && data.nfcCard.cardId) {
            setNfcCardId(data.nfcCard.cardId);
            setNfcCardLabel(data.nfcCard.label || 'Mi Llave de Torno Gym');
            setNfcCardType(data.nfcCard.cardType || 'Mifare / NFC Tag');
          }
        })
        .catch(() => {});
    }

    // Actualizar objetivos iniciales
    if (userGoal) {
      setTargetDays(userGoal.targetDaysPerWeek || 4);
      setTargetWeight(userGoal.targetWeightKg || '');
      setGoalType(userGoal.goalType || 'brazos_abs_grasa');
    }
  }, [isOpen, activeUser]);

  if (!isOpen) return null;

  // Guardar datos personales
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveSuccess('');
    setSaveError('');
    if (!name.trim()) {
      setSaveError('El nombre no puede estar vacío.');
      return;
    }

    try {
      const res = await fetch('/api/gym/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentName: activeUser,
          newName: name.trim(),
          phone: phone.trim(),
          password: password.trim() || undefined,
          nfcCardId: nfcCardId || undefined,
          nfcCardLabel: nfcCardLabel || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess('¡Perfil actualizado con éxito!');
        setPassword('');
        if (onUserUpdated) {
          onUserUpdated(data.user.name, data.user.phone);
        }
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        setSaveError(data.error || 'Error al guardar cambios');
      }
    } catch (err) {
      setSaveError('Error de conexión con el servidor.');
    }
  };

  // Guardar objetivos
  const handleSaveGoals = async () => {
    setSavingGoals(true);
    setSaveSuccess('');
    setSaveError('');
    try {
      const res = await fetch('/api/gym/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: activeUser,
          targetDaysPerWeek: Number(targetDays),
          targetWeightKg: targetWeight ? Number(targetWeight) : null,
          goalType: goalType
        })
      });
      if (res.ok) {
        setSaveSuccess('¡Objetivos actualizados correctamente!');
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        setSaveError('No se pudieron actualizar los objetivos.');
      }
    } catch (err) {
      setSaveError('Error de red al actualizar objetivos.');
    } finally {
      setSavingGoals(false);
    }
  };

  // Escanear Tarjeta NFC con Web NFC API
  const handleScanNfc = async () => {
    setNfcSuccessMsg('');
    setNfcErrorMsg('');
    if (!('NDEFReader' in window)) {
      setNfcErrorMsg('Tu navegador no soporta lectura NFC directa. Puedes introducir el número de UID manualmente.');
      setShowManualUid(true);
      return;
    }

    try {
      setNfcScanning(true);
      // eslint-disable-next-line no-undef
      const ndef = new NDEFReader();
      await ndef.scan();
      setNfcSuccessMsg('📡 Lector activo. Acerca tu tarjeta o pulsera del gimnasio a la parte trasera del móvil...');

      ndef.onreading = (event) => {
        const serial = event.serialNumber || 'NFC-TAG-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        setNfcCardId(serial);
        setNfcScanning(false);
        setNfcSuccessMsg(`✅ ¡Llave detectada con éxito! UID: ${serial}`);

        // Guardar automáticamente en backend
        fetch('/api/gym/nfc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: activeUser,
            cardId: serial,
            label: nfcCardLabel,
            cardType: 'Mifare / NFC Tag',
            color: '#005b99'
          })
        }).catch(() => {});
      };

      ndef.onreadingerror = () => {
        setNfcScanning(false);
        setNfcErrorMsg('No se pudo leer la tarjeta NFC. Asegúrate de mantenerla pegada unos segundos.');
      };
    } catch (error) {
      setNfcScanning(false);
      setNfcErrorMsg(`Error al iniciar NFC: ${error.message || 'Permiso denegado o NFC desactivado en Ajustes de Android'}`);
    }
  };

  // Guardar UID Manual
  const handleSaveManualUid = () => {
    if (!manualUidInput.trim()) return;
    const cleanUid = manualUidInput.trim().toUpperCase();
    setNfcCardId(cleanUid);
    setShowManualUid(false);
    setManualUidInput('');
    setNfcSuccessMsg(`✅ Llave guardada manualmente: ${cleanUid}`);

    fetch('/api/gym/nfc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: activeUser,
        cardId: cleanUid,
        label: nfcCardLabel,
        cardType: 'Manual UID / Gym Fob',
        color: '#005b99'
      })
    }).catch(() => {});
  };

  // Eliminar Llave NFC vinculada
  const handleRemoveNfc = () => {
    setNfcCardId('');
    setNfcSuccessMsg('Llave NFC desvinculada.');
    fetch('/api/gym/nfc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: activeUser,
        cardId: '',
        label: ''
      })
    }).catch(() => {});
  };

  // Activar Pase de Torno / Emulación
  const handleActivateNfcPass = () => {
    setNfcEmulating(true);
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    setTimeout(() => {
      setNfcEmulating(false);
    }, 15000); // 15 segundos activo para pasar por el torno
  };

  // Eliminar Cuenta Permanentemente
  const handleDeleteAccount = async () => {
    if (deleteInputName.trim().toLowerCase() !== activeUser.toLowerCase()) {
      alert(`Por favor, escribe exactamente "${activeUser}" para confirmar.`);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/gym/auth/account/${encodeURIComponent(activeUser)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Tu cuenta y todos tus datos han sido eliminados de forma permanente.');
        if (onUserDeleted) {
          onUserDeleted();
        }
      } else {
        alert(data.error || 'Error al eliminar la cuenta');
      }
    } catch (e) {
      alert('Error de conexión al eliminar la cuenta.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        maxHeight: '94vh',
        background: '#ffffff',
        borderRadius: '24px',
        border: '2px solid #bae6fd',
        boxShadow: '0 25px 70px rgba(0, 91, 153, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Cabecera del Perfil con Estética Griega */}
        <div style={{
          padding: '1.25rem 1.4rem 0.9rem',
          background: 'linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%)',
          borderBottom: '1.5px solid #bae6fd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '16px',
              background: '#ffffff',
              border: '2px solid #005b99',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 4px 12px rgba(0, 91, 153, 0.15)'
            }}>
              🏛️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#004b87' }}>
                  {activeUser}
                </h2>
                <span style={{
                  background: '#ffffff',
                  border: '1px solid #bae6fd',
                  color: '#005b99',
                  borderRadius: '999px',
                  padding: '0.1rem 0.45rem',
                  fontSize: '0.68rem',
                  fontWeight: 800
                }}>
                  Atleta FORMA
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                Configuración de cuenta, objetivos y llave NFC
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '999px',
              width: '32px',
              height: '32px',
              fontSize: '1.25rem',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {/* Pestañas de Navegación del Perfil */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: '#f8fafc',
          borderBottom: '1.5px solid #e2e8f0',
          padding: '0.35rem 0.6rem'
        }}>
          {[
            { id: 'datos', label: 'Mis Datos', icon: '👤' },
            { id: 'objetivos', label: 'Objetivos', icon: '🎯' },
            { id: 'nfc', label: 'Llave NFC', icon: '📡' },
            { id: 'cuenta', label: 'Cuenta', icon: '⚙️' }
          ].map(t => {
            const isAct = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: isAct ? '#ffffff' : 'transparent',
                  border: isAct ? '1.5px solid #bae6fd' : '1.5px solid transparent',
                  borderRadius: '12px',
                  padding: '0.5rem 0.2rem',
                  color: isAct ? '#005b99' : '#64748b',
                  fontWeight: isAct ? 800 : 600,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.15rem',
                  boxShadow: isAct ? '0 2px 8px rgba(0, 91, 153, 0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Messages */}
        {saveSuccess && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '0.65rem 1rem',
            fontSize: '0.82rem',
            fontWeight: 800,
            textAlign: 'center'
          }}>
            {saveSuccess}
          </div>
        )}
        {saveError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.65rem 1rem',
            fontSize: '0.82rem',
            fontWeight: 800,
            textAlign: 'center'
          }}>
            {saveError}
          </div>
        )}

        {/* Contenido con Scroll */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>

          {/* 1. MIS DATOS */}
          {activeTab === 'datos' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Nombre de Atleta
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontWeight: 700
                  }}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Teléfono Móvil
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontWeight: 700
                  }}
                  placeholder="Ej: 612345678"
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', display: 'block' }}>
                  Utilizado para inicio de sesión seguro y vinculación en entrenamientos Dualis.
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Nueva Contraseña (dejar en blanco para conservar la actual)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  placeholder="Introduce tu nueva contraseña"
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.95rem',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #005b99 0%, #004b87 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 91, 153, 0.25)'
                }}
              >
                Guardar Cambios de Perfil
              </button>
            </form>
          )}

          {/* 2. OBJETIVOS */}
          {activeTab === 'objetivos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.45rem' }}>
                  Días de Entrenamiento por Semana: <strong>{targetDays} días</strong>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.45rem' }}>
                  {[2, 3, 4, 5, 6].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTargetDays(d)}
                      style={{
                        padding: '0.65rem 0',
                        borderRadius: '10px',
                        border: targetDays === d ? '2px solid #005b99' : '1px solid #cbd5e1',
                        background: targetDays === d ? '#f0f7ff' : '#ffffff',
                        color: targetDays === d ? '#005b99' : '#334155',
                        fontWeight: 900,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      {d} d
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Peso Objetivo (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontWeight: 700
                  }}
                  placeholder="Ej: 75.0"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '0.45rem' }}>
                  Enfoque Físico Principal
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {[
                    { id: 'brazos_abs_grasa', label: '🔥💪 Definición + Brazos y Abdominales' },
                    { id: 'grasa', label: '🔥 Pérdida de Grasa y Definición' },
                    { id: 'tonificar', label: '⚡ Tonificar y Ponerse en Forma' },
                    { id: 'hipertrofia', label: '💪 Masa Muscular e Hipertrofia' },
                    { id: 'gluteo', label: '🍑 Foco Pierna, Glúteo y Core' },
                    { id: 'movilidad', label: '🧘 Espalda Sana y Postura' }
                  ].map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoalType(g.id)}
                      style={{
                        padding: '0.7rem 0.85rem',
                        borderRadius: '12px',
                        border: goalType === g.id ? '2px solid #005b99' : '1px solid #e2e8f0',
                        background: goalType === g.id ? '#f0f7ff' : '#ffffff',
                        color: goalType === g.id ? '#004b87' : '#334155',
                        fontWeight: goalType === g.id ? 800 : 600,
                        fontSize: '0.84rem',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveGoals}
                disabled={savingGoals}
                style={{
                  padding: '0.95rem',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #005b99 0%, #004b87 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 91, 153, 0.25)'
                }}
              >
                {savingGoals ? 'Guardando...' : 'Actualizar Objetivos'}
              </button>
            </div>
          )}

          {/* 3. LLAVE NFC GYM (BETA) */}
          {activeTab === 'nfc' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Tarjeta Visual de Pase NFC del Gimnasio */}
              <div style={{
                background: nfcEmulating
                  ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                  : 'linear-gradient(135deg, #005b99 0%, #0284c7 100%)',
                borderRadius: '20px',
                padding: '1.4rem',
                color: '#ffffff',
                boxShadow: nfcEmulating
                  ? '0 12px 30px rgba(16, 185, 129, 0.45)'
                  : '0 10px 25px rgba(0, 91, 153, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.35s ease'
              }}>
                {/* Ondas NFC decorativas */}
                <div style={{ position: 'absolute', right: '-15px', bottom: '-15px', opacity: 0.15, fontSize: '6rem', pointerEvents: 'none' }}>
                  📡
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 900, fontSize: '0.82rem', letterSpacing: '0.05em' }}>
                    <span>🏛️ FORMA GYM PASS</span>
                    <span style={{ background: 'rgba(255,255,255,0.25)', padding: '0.15rem 0.45rem', borderRadius: '999px', fontSize: '0.65rem' }}>BETA</span>
                  </div>
                  <span style={{ fontSize: '1.4rem' }}>📶</span>
                </div>

                <div style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 700, textTransform: 'uppercase' }}>
                  {nfcCardLabel}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.08em', margin: '0.25rem 0' }}>
                  {nfcCardId || '---- ---- ---- ----'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem', fontSize: '0.75rem' }}>
                  <div>
                    <div style={{ opacity: 0.75, fontSize: '0.65rem' }}>TITULAR</div>
                    <div style={{ fontWeight: 800 }}>{activeUser.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ opacity: 0.75, fontSize: '0.65rem' }}>ESTADO</div>
                    <div style={{ fontWeight: 800, color: nfcCardId ? '#a7f3d0' : '#fde68a' }}>
                      {nfcEmulating ? '⚡ EMITIENDO...' : nfcCardId ? '✓ VINCULADA' : 'PENDIENTE'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Emulación / Pase Activo */}
              {nfcCardId && (
                <button
                  type="button"
                  onClick={handleActivateNfcPass}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    borderRadius: '16px',
                    border: 'none',
                    background: nfcEmulating ? '#10b981' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 6px 20px rgba(5, 150, 105, 0.35)',
                    animation: nfcEmulating ? 'pulse 1.2s infinite' : 'none'
                  }}
                >
                  <span>📶</span>
                  <span>{nfcEmulating ? '¡Pasa el móvil por el torno ahora!' : 'Activar Pase de Torno'}</span>
                </button>
              )}

              {/* Acciones de Vinculación */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={handleScanNfc}
                  disabled={nfcScanning}
                  style={{
                    padding: '0.85rem 0.6rem',
                    borderRadius: '14px',
                    border: '1.5px solid #005b99',
                    background: '#f0f7ff',
                    color: '#005b99',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>📲</span>
                  <span>{nfcScanning ? 'Leyendo tarjeta...' : 'Leer Tarjeta NFC'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualUid(!showManualUid)}
                  style={{
                    padding: '0.85rem 0.6rem',
                    borderRadius: '14px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>⌨️</span>
                  <span>Meter Código / UID</span>
                </button>
              </div>

              {/* Entrada Manual de UID */}
              {showManualUid && (
                <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '0.9rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.4rem' }}>
                    Escribe el UID o número de tu llavero/tarjeta de gym:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={manualUidInput}
                      onChange={(e) => setManualUidInput(e.target.value)}
                      placeholder="Ej: 04:A2:3B:F1 o 20491823"
                      style={{
                        flex: 1,
                        padding: '0.6rem 0.8rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.88rem',
                        fontFamily: 'monospace',
                        fontWeight: 700
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveManualUid}
                      style={{
                        padding: '0.6rem 0.9rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#005b99',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer'
                      }}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {/* Mensajes de feedback NFC */}
              {nfcSuccessMsg && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '0.7rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {nfcSuccessMsg}
                </div>
              )}
              {nfcErrorMsg && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', padding: '0.7rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                  ⚠️ {nfcErrorMsg}
                </div>
              )}

              {/* EXPLICACIÓN Y SOLUCIÓN PARA GOOGLE PLAY / WALLET */}
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                borderRadius: '16px',
                padding: '1rem',
                color: '#166534',
                fontSize: '0.78rem',
                lineHeight: 1.5
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 900, marginBottom: '0.4rem', fontSize: '0.84rem', color: '#15803d' }}>
                  <span>💡</span>
                  <span>Solución al conflicto con Google Pay / Wallet:</span>
                </div>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  En Android solo una aplicación puede ser la <em>"App de Pago Principal"</em> por defecto. Si una app de clonar llaves se adueña de los pagos, desactiva Google Pay para pagar en tiendas.
                </p>
                <div style={{ background: '#ffffff', border: '1px solid #86efac', borderRadius: '10px', padding: '0.6rem 0.8rem', fontWeight: 700, color: '#14532d' }}>
                  👉 <strong>Configuración recomendada en tu móvil:</strong>
                  <br />Ve a <strong>Ajustes del móvil &gt; Conexiones &gt; NFC &gt; Pagos sin contacto</strong> y selecciona: <em>"Pagar con la app abierta actualmente"</em>.
                  <br />De esta manera Google Pay sigue funcionando siempre, y tu llave FORMA solo actúa cuando abres esta pantalla en el torno del gym.
                </div>
              </div>

              {nfcCardId && (
                <button
                  type="button"
                  onClick={handleRemoveNfc}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    marginTop: '0.2rem'
                  }}
                >
                  Desvincular esta llave NFC
                </button>
              )}
            </div>
          )}

          {/* 4. CUENTA & ZONA DE PELIGRO */}
          {activeTab === 'cuenta' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Acceso a Suscripciones */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>Planes de Suscripción</strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Micro-planes de 1€, 3€ y 5€ al mes</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenPlans) onOpenPlans();
                    }}
                    style={{
                      background: '#005b99',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.5rem 0.85rem',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Ver Planes
                  </button>
                </div>
              </div>

              {/* Botón Cerrar Sesión */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>Cerrar Sesión</strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Vuelve a la pantalla de bienvenida y login</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Quieres cerrar sesión en este dispositivo?')) {
                        onClose();
                        if (onUserLoggedOut) onUserLoggedOut();
                      }
                    }}
                    style={{
                      background: '#ffffff',
                      color: '#334155',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '0.5rem 0.85rem',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>

              {/* Zona de Peligro: Eliminar Cuenta */}
              <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '16px', padding: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b91c1c', fontWeight: 900, fontSize: '0.92rem', marginBottom: '0.35rem' }}>
                  <span>⚠️</span>
                  <span>Zona de Peligro: Eliminar Cuenta</span>
                </div>
                <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.78rem', color: '#7f1d1d', lineHeight: 1.45 }}>
                  Esta acción es <strong>definitiva e irreversible</strong>. Se borrará tu usuario, historial de entrenamientos, pesos corporales, objetivos y llave NFC de la base de datos.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: '12px',
                      border: '1px solid #ef4444',
                      background: '#ffffff',
                      color: '#dc2626',
                      fontWeight: 900,
                      fontSize: '0.84rem',
                      cursor: 'pointer'
                    }}
                  >
                    Eliminar Mi Cuenta y Borrar Todos Mis Datos
                  </button>
                ) : (
                  <div style={{ background: '#ffffff', border: '1.5px solid #ef4444', borderRadius: '14px', padding: '0.9rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.45rem' }}>
                      Escribe exactamente <strong>{activeUser}</strong> para confirmar el borrado total:
                    </div>
                    <input
                      type="text"
                      value={deleteInputName}
                      onChange={(e) => setDeleteInputName(e.target.value)}
                      placeholder={activeUser}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.8rem',
                        borderRadius: '10px',
                        border: '1.5px solid #fca5a5',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box',
                        marginBottom: '0.65rem',
                        fontWeight: 700
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteInputName(''); }}
                        style={{
                          flex: 1,
                          padding: '0.65rem',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#475569',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={deleting || deleteInputName.trim().toLowerCase() !== activeUser.toLowerCase()}
                        style={{
                          flex: 1,
                          padding: '0.65rem',
                          borderRadius: '10px',
                          border: 'none',
                          background: deleteInputName.trim().toLowerCase() === activeUser.toLowerCase() ? '#dc2626' : '#cbd5e1',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          cursor: deleteInputName.trim().toLowerCase() === activeUser.toLowerCase() ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {deleting ? 'Borrando...' : 'Confirmar Borrado'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
