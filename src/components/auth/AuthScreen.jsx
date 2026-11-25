import React, { useState, useEffect, useRef } from 'react';

export default function AuthScreen({
  initialMode = 'register',
  initialUser = '',
  onSuccessLogin,
  onSuccessRegister,
  onBackToWelcome,
  onBackToCasita
}) {
  const [mode, setMode] = useState(initialMode); // 'register' | 'login'
  
  // Pasos de Registro: 1 = Nombre, 2 = Teléfono, 3 = Contraseña
  const [step, setStep] = useState(1);

  // Estados de Registro
  const [name, setName] = useState(initialUser || '');
  const [phone, setPhone] = useState('');
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [phoneRegistered, setPhoneRegistered] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de Login
  const [loginIdentifier, setLoginIdentifier] = useState(initialUser || '');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados de control
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputNameRef = useRef(null);
  const inputPhoneRef = useRef(null);
  const inputPasswordRef = useRef(null);

  // Autofoco suave en cada paso
  useEffect(() => {
    if (mode === 'register') {
      if (step === 1 && inputNameRef.current) inputNameRef.current.focus();
      if (step === 2 && inputPhoneRef.current) inputPhoneRef.current.focus();
      if (step === 3 && inputPasswordRef.current) inputPasswordRef.current.focus();
    }
  }, [step, mode]);

  // Formateador de teléfono en tiempo real (ej. 612 345 678)
  const handlePhoneChange = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 9);
    let formatted = raw;
    if (raw.length > 6) {
      formatted = `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 3)} ${raw.slice(3)}`;
    }
    setPhone(formatted);
    setError('');
    setPhoneRegistered(false);

    // Si ya completó 9 dígitos, comprobamos si ya existe
    if (raw.length === 9) {
      setPhoneChecking(true);
      fetch(`/api/gym/auth/check-phone?phone=${encodeURIComponent(raw)}`)
        .then(r => r.json())
        .then(data => {
          if (data.exists) {
            setPhoneRegistered(true);
            setError(`Este número ya pertenece a ${data.user?.name || 'un atleta'}. Puedes iniciar sesión directamente.`);
          }
        })
        .catch(() => {})
        .finally(() => setPhoneChecking(false));
    }
  };

  // Validación de Paso 1 -> Paso 2
  const handleNextFromStep1 = (e) => {
    if (e) e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setError('Por favor introduce tu nombre (mínimo 2 letras).');
      return;
    }
    setError('');
    setStep(2);
  };

  // Validación de Paso 2 -> Paso 3
  const handleNextFromStep2 = (e) => {
    if (e) e.preventDefault();
    const raw = phone.replace(/\D/g, '');
    if (raw.length < 9) {
      setError('Introduce un número de teléfono móvil válido (9 dígitos).');
      return;
    }
    if (phoneRegistered) {
      setError('Este teléfono ya está registrado. Inicia sesión o usa otro número.');
      return;
    }
    setError('');
    setStep(3);
  };

  // Envío final del registro (Paso 3)
  const handleFinalRegister = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanName) {
      setStep(1);
      setError('El nombre es obligatorio.');
      return;
    }
    if (cleanPhone.length < 9) {
      setStep(2);
      setError('El número de teléfono móvil es obligatorio.');
      return;
    }
    if (!password || password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/gym/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          password: password.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al completar el registro.');
      }

      localStorage.setItem(`gym_user_phone_${cleanName}`, cleanPhone);
      localStorage.setItem(`gym_user_password_${cleanName}`, password.trim());
      localStorage.setItem('forma_unlocked_user', cleanName);
      localStorage.setItem('hogar_user', cleanName);
      localStorage.setItem('marbella_fit_unlocked_user', cleanName);

      onSuccessRegister({
        name: cleanName,
        phone: cleanPhone
      });
    } catch (err) {
      console.warn('[Offline Register Fallback]', err);
      // Soporte offline para que el usuario nunca quede bloqueado
      localStorage.setItem(`gym_user_phone_${cleanName}`, cleanPhone);
      localStorage.setItem(`gym_user_password_${cleanName}`, password.trim());
      localStorage.setItem('forma_unlocked_user', cleanName);
      localStorage.setItem('hogar_user', cleanName);
      localStorage.setItem('marbella_fit_unlocked_user', cleanName);

      onSuccessRegister({
        name: cleanName,
        phone: cleanPhone
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejador de Login
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const idVal = loginIdentifier.trim();
    if (!idVal) {
      setError('Introduce tu nombre o teléfono móvil.');
      return;
    }
    if (!loginPassword) {
      setError('Introduce tu contraseña.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/gym/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: idVal,
          password: loginPassword.trim()
        })
      });

      const data = await res.json();

      if (data.requiresRegistration) {
        setError(`El usuario ${data.user?.name || idVal} debe completar su registro con teléfono y contraseña.`);
        setMode('register');
        if (data.user?.name) setName(data.user.name);
        setStep(2);
        setLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Usuario o contraseña incorrectos.');
      }

      const userName = data.user.name;
      localStorage.setItem('forma_unlocked_user', userName);
      localStorage.setItem('hogar_user', userName);
      localStorage.setItem('marbella_fit_unlocked_user', userName);
      localStorage.setItem(`gym_unlocked_${userName}`, 'true');

      onSuccessLogin({
        name: userName,
        phone: data.user.phone,
        onboarded: data.user.onboarded
      });
    } catch (err) {
      const localPass = localStorage.getItem(`gym_user_password_${idVal}`);
      if (localPass && localPass === loginPassword.trim()) {
        const localPhone = localStorage.getItem(`gym_user_phone_${idVal}`) || '';
        localStorage.setItem('forma_unlocked_user', idVal);
        localStorage.setItem('hogar_user', idVal);
        localStorage.setItem('marbella_fit_unlocked_user', idVal);
        localStorage.setItem(`gym_unlocked_${idVal}`, 'true');
        onSuccessLogin({
          name: idVal,
          phone: localPhone,
          onboarded: localStorage.getItem(`gym_onboarded_${idVal}`) === 'true'
        });
      } else {
        setError(err.message || 'Contraseña incorrecta. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const cleanDigits = phone.replace(/\D/g, '');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 0%, #dbeafe 0%, #ffffff 50%, #f0f7ff 100%)',
      color: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.2rem',
      fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* Tarjeta Griega Luminosa Mármol Blanco */}
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '26px',
        padding: '2rem 1.6rem',
        boxShadow: '0 25px 70px rgba(0, 91, 153, 0.1)',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {/* Cabecera de Navegación y Marca */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.4rem'
        }}>
          <button
            type="button"
            onClick={mode === 'register' && step > 1 ? () => { setStep(s => s - 1); setError(''); } : onBackToWelcome}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '999px',
              padding: '0.42rem 0.9rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#005b99',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>‹</span>
            <span>{mode === 'register' && step > 1 ? 'Atrás' : 'Inicio'}</span>
          </button>

          {/* Badge FORMA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#005b99',
              boxShadow: '0 0 10px rgba(0, 91, 153, 0.5)'
            }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 900, letterSpacing: '0.12em', color: '#004b87' }}>
              FORMA
            </span>
          </div>
        </div>

        {/* Selector de modo Login / Registro */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
          padding: '4px',
          borderRadius: '16px',
          marginBottom: '1.8rem'
        }}>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              padding: '0.65rem',
              borderRadius: '12px',
              border: 'none',
              background: mode === 'register' ? 'linear-gradient(135deg, #005b99, #004b87)' : 'transparent',
              color: mode === 'register' ? '#ffffff' : '#64748b',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: mode === 'register' ? '0 4px 14px rgba(0, 91, 153, 0.25)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            Crear Cuenta
          </button>

          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            style={{
              padding: '0.65rem',
              borderRadius: '12px',
              border: 'none',
              background: mode === 'login' ? 'linear-gradient(135deg, #005b99, #004b87)' : 'transparent',
              color: mode === 'login' ? '#ffffff' : '#64748b',
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: mode === 'login' ? '0 4px 14px rgba(0, 91, 153, 0.25)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            Iniciar Sesión
          </button>
        </div>

        {/* ========================================================= */}
        {/* VISTA 1: REGISTRO PASO A PASO (STEP-BY-STEP FLOW)          */}
        {/* ========================================================= */}
        {mode === 'register' && (
          <div>
            {/* Barra de Progreso Step by Step */}
            <div style={{ marginBottom: '1.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#005b99' }}>
                  Paso {step} de 3
                </span>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                  {step === 1 && 'Identidad'}
                  {step === 2 && 'Teléfono Móvil'}
                  {step === 3 && 'Seguridad'}
                </span>
              </div>

              {/* Segmentos de barra de progreso */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    style={{
                      height: '5px',
                      borderRadius: '999px',
                      background: s <= step
                        ? 'linear-gradient(90deg, #005b99, #0ea5e9)'
                        : '#e2e8f0',
                      boxShadow: s <= step ? '0 0 8px rgba(0, 91, 153, 0.3)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* PASO 1: NOMBRE */}
            {step === 1 && (
              <form onSubmit={handleNextFromStep1} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: '#f0f7ff',
                    border: '1.5px solid #bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    marginBottom: '0.85rem'
                  }}>
                    👤
                  </div>
                  <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.35rem', fontWeight: 900, color: '#004b87' }}>
                    ¿Cómo te llamas?
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45 }}>
                    Tu nombre se mostrará en tus marcas personales, entrenamientos y en el modo en pareja <strong>DUALIS</strong>.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '0.45rem' }}>
                    Nombre o Apodo de Atleta
                  </label>
                  <input
                    ref={inputNameRef}
                    type="text"
                    placeholder="Ej. Alex, Laura, Dani..."
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '16px',
                      padding: '0.9rem 1.1rem',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#005b99';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 91, 153, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {error && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!name.trim()}
                  style={{
                    background: name.trim()
                      ? 'linear-gradient(135deg, #005b99, #004b87)'
                      : '#e2e8f0',
                    color: name.trim() ? '#ffffff' : '#94a3b8',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '0.95rem',
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    cursor: name.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: name.trim() ? '0 8px 24px rgba(0, 91, 153, 0.25)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>Continuar</span>
                  <span>→</span>
                </button>
              </form>
            )}

            {/* PASO 2: TELÉFONO MÓVIL */}
            {step === 2 && (
              <form onSubmit={handleNextFromStep2} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: '#f0f7ff',
                    border: '1.5px solid #bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    marginBottom: '0.85rem'
                  }}>
                    📱
                  </div>
                  <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.35rem', fontWeight: 900, color: '#004b87' }}>
                    Tu número de teléfono
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45 }}>
                    Imprescindible para vincular tu app y para que tu compañero te encuentre para entrenar en pareja en Modo <strong>DUALIS</strong>.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '0.45rem' }}>
                    <span>Teléfono Móvil (España)</span>
                    <span style={{ color: '#005b99', fontSize: '0.7rem' }}>
                      {cleanDigits.length}/9 dígitos
                    </span>
                  </label>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '0 1rem',
                    transition: 'all 0.2s ease'
                  }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#64748b', marginRight: '0.65rem' }}>
                      🇪🇸 +34
                    </span>
                    <input
                      ref={inputPhoneRef}
                      type="tel"
                      inputMode="numeric"
                      placeholder="600 000 000"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'transparent',
                        border: 'none',
                        padding: '0.9rem 0',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                    />
                    {phoneChecking && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>⏳</span>
                    )}
                    {!phoneChecking && cleanDigits.length === 9 && !phoneRegistered && (
                      <span style={{ fontSize: '0.9rem', color: '#005b99', fontWeight: 900 }}>✓</span>
                    )}
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: phoneRegistered ? '#eff6ff' : '#fef2f2',
                    border: `1px solid ${phoneRegistered ? '#bfdbfe' : '#fecaca'}`,
                    color: phoneRegistered ? '#1d4ed8' : '#dc2626',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    {phoneRegistered ? 'ℹ️' : '⚠️'} {error}
                    {phoneRegistered && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setLoginIdentifier(phone.replace(/\D/g, ''));
                          setError('');
                        }}
                        style={{
                          display: 'block',
                          marginTop: '0.4rem',
                          background: '#005b99',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.35rem 0.7rem',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Ir a Iniciar Sesión →
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    style={{
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#475569',
                      borderRadius: '16px',
                      padding: '0.95rem',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    ‹ Atrás
                  </button>

                  <button
                    type="submit"
                    disabled={cleanDigits.length < 9 || phoneRegistered}
                    style={{
                      background: cleanDigits.length === 9 && !phoneRegistered
                        ? 'linear-gradient(135deg, #005b99, #004b87)'
                        : '#e2e8f0',
                      color: cleanDigits.length === 9 && !phoneRegistered ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '0.95rem',
                      fontSize: '0.95rem',
                      fontWeight: 900,
                      cursor: cleanDigits.length === 9 && !phoneRegistered ? 'pointer' : 'not-allowed',
                      boxShadow: cleanDigits.length === 9 && !phoneRegistered ? '0 8px 24px rgba(0, 91, 153, 0.25)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      flex: 2,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>Continuar</span>
                    <span>→</span>
                  </button>
                </div>
              </form>
            )}

            {/* PASO 3: CONTRASEÑA */}
            {step === 3 && (
              <form onSubmit={handleFinalRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: '#fef3c7',
                    border: '1.5px solid #fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    marginBottom: '0.85rem'
                  }}>
                    🔐
                  </div>
                  <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.35rem', fontWeight: 900, color: '#004b87' }}>
                    Crea tu contraseña
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45 }}>
                    Protege tu historial y récords de fuerza personal.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '0.45rem' }}>
                    Contraseña (mínimo 4 caracteres)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={inputPasswordRef}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '16px',
                        padding: '0.9rem 2.8rem 0.9rem 1.1rem',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '0.45rem' }}>
                    Repite tu contraseña
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#f8fafc',
                      border: `1.5px solid ${confirmPassword && confirmPassword === password ? '#005b99' : '#cbd5e1'}`,
                      borderRadius: '16px',
                      padding: '0.9rem 1.1rem',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />
                </div>

                {error && (
                  <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                {/* Resumen de cuenta a crear en tarjeta griega limpia */}
                <div style={{
                  background: '#f0f7ff',
                  border: '1px dashed #bae6fd',
                  borderRadius: '14px',
                  padding: '0.75rem 0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem'
                }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Atleta: </span>
                    <strong style={{ color: '#004b87' }}>{name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Móvil: </span>
                    <strong style={{ color: '#005b99' }}>+34 {phone}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => { setStep(2); setError(''); }}
                    style={{
                      background: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#475569',
                      borderRadius: '16px',
                      padding: '0.95rem',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    ‹ Atrás
                  </button>

                  <button
                    type="submit"
                    disabled={loading || password.length < 4 || password !== confirmPassword}
                    style={{
                      background: !loading && password.length >= 4 && password === confirmPassword
                        ? 'linear-gradient(135deg, #005b99, #004b87)'
                        : '#e2e8f0',
                      color: !loading && password.length >= 4 && password === confirmPassword ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '0.95rem',
                      fontSize: '0.95rem',
                      fontWeight: 900,
                      cursor: !loading && password.length >= 4 && password === confirmPassword ? 'pointer' : 'not-allowed',
                      boxShadow: !loading && password.length >= 4 && password === confirmPassword ? '0 8px 24px rgba(0, 91, 153, 0.25)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      flex: 2,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loading ? 'Creando perfil...' : '🚀 Finalizar Registro'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VISTA 2: INICIAR SESIÓN DIRECTO                            */}
        {/* ========================================================= */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: '#f0f7ff',
                border: '1.5px solid #bae6fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                marginBottom: '0.85rem'
              }}>
                🏛️
              </div>
              <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.35rem', fontWeight: 900, color: '#004b87' }}>
                Te damos la bienvenida
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.45 }}>
                Accede a tu plan de entrenamiento, pesos guardados y estadísticas.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '0.45rem' }}>
                Nombre o teléfono móvil
              </label>
              <input
                type="text"
                placeholder="Ej. Alex o 600000000"
                value={loginIdentifier}
                onChange={(e) => { setLoginIdentifier(e.target.value); setError(''); }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '0.9rem 1.1rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '0.45rem' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '0.9rem 2.8rem 0.9rem 1.1rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.65rem 0.85rem',
                borderRadius: '12px',
                fontSize: '0.78rem',
                fontWeight: 700
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !loginIdentifier.trim() || !loginPassword}
              style={{
                background: !loading && loginIdentifier.trim() && loginPassword
                  ? 'linear-gradient(135deg, #005b99, #004b87)'
                  : '#e2e8f0',
                color: !loading && loginIdentifier.trim() && loginPassword ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '16px',
                padding: '0.95rem',
                fontSize: '0.95rem',
                fontWeight: 900,
                cursor: !loading && loginIdentifier.trim() && loginPassword ? 'pointer' : 'not-allowed',
                boxShadow: !loading && loginIdentifier.trim() && loginPassword ? '0 8px 24px rgba(0, 91, 153, 0.25)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.4rem',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Accediendo...' : '⚡ Entrar a FORMA'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.4rem' }}>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setStep(1); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                ¿Aún no tienes cuenta? <span style={{ color: '#005b99', fontWeight: 800 }}>Regístrate gratis aquí</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
