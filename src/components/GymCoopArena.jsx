import React, { useState, useEffect, useRef } from 'react';

// Sonido sintetizado agradable y vibración para el final del crono
function playCoopTimerBeep() {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 250]);
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.16);
      osc.stop(ctx.currentTime + idx * 0.16 + 0.15);
    });
  } catch (_) {}
}

export default function GymCoopArena({
  activeUser = 'Ismael',
  coopSession,
  deviceMode = 'single', // 'single' (1 móvil compartido) | 'dual' (2 móviles)
  partnerName = 'Sandra',
  partnerPhone = '',
  isRegisteredPartner = true,
  onRefreshSession,
  onOpenShareModal,
  onOpenVisualModal,
  onExitCoop,
  onWorkoutCompleted
}) {
  const isHostIsmael = activeUser === 'Ismael';
  const effectivePartner = partnerName || (isHostIsmael ? 'Sandra' : 'Ismael');

  // En modo 1 móvil, gestionamos el turno local ('Ismael' o partnerName)
  const [singleTurnUser, setSingleTurnUser] = useState(activeUser);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSetNum, setCurrentSetNum] = useState(1);
  const [exercisesList, setExercisesList] = useState(() => coopSession?.exercises || []);

  // Pesos y repeticiones ajustables en vivo por usuario
  const [userWeights, setUserWeights] = useState({});
  const [userReps, setUserReps] = useState({});

  // Cronómetro de descanso entre series
  const [restSeconds, setRestSeconds] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const restTimerRef = useRef(null);

  // Modal de sobrecarga progresiva ("¿Qué tal fue el ejercicio?")
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackDecisions, setFeedbackDecisions] = useState({}); // { [exIdx]: 'subir' | 'mantener' | 'bajar' }

  // Duración total del entreno
  const [startTime] = useState(() => Date.now());
  const [elapsedMin, setElapsedMin] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setElapsedMin(Math.max(1, Math.round((Date.now() - startTime) / 60000)));
    }, 10000);
    return () => clearInterval(t);
  }, [startTime]);

  // Manejo del cronómetro de descanso
  useEffect(() => {
    if (!restRunning) {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      return;
    }

    restTimerRef.current = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(restTimerRef.current);
          setRestRunning(false);
          playCoopTimerBeep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [restRunning]);

  const startRestTimer = (seconds = 60) => {
    setRestSeconds(seconds);
    setRestRunning(true);
  };

  const currentEx = exercisesList[currentExIdx] || null;
  const targetSets = currentEx?.sets || 3;

  // Determinar de quién es el turno
  const isTurnIsmael = deviceMode === 'single'
    ? singleTurnUser === 'Ismael'
    : (coopSession?.activeTurn === 'Ismael');

  const currentTurnUserName = deviceMode === 'single'
    ? singleTurnUser
    : (coopSession?.activeTurn || activeUser);

  const nextTurnUserName = currentTurnUserName === 'Ismael' ? effectivePartner : 'Ismael';

  // Configuración del ejercicio actual para quien entrena en este turno
  const currentConfig = currentEx?.userConfigs?.[currentTurnUserName] || {
    weightKg: currentEx?.weightKg || (currentTurnUserName === 'Ismael' ? 30 : 15),
    reps: currentEx?.reps || 12
  };

  const effectiveWeight = userWeights[`${currentExIdx}_${currentTurnUserName}`] !== undefined
    ? userWeights[`${currentExIdx}_${currentTurnUserName}`]
    : currentConfig.weightKg;

  const effectiveReps = userReps[`${currentExIdx}_${currentTurnUserName}`] !== undefined
    ? userReps[`${currentExIdx}_${currentTurnUserName}`]
    : currentConfig.reps;

  // =========================================================================
  // ACCIÓN AL COMPLETAR SERIE EN 1 MÓVIL O 2 MÓVILES
  // =========================================================================
  const handleCompleteSetSingleDevice = () => {
    // Iniciar cronómetro de descanso automático para el que acaba de terminar
    startRestTimer(60);

    // Alternar turno
    if (singleTurnUser === 'Ismael') {
      setSingleTurnUser(effectivePartner);
    } else {
      // Ambos han hecho su serie en este ciclo
      if (currentSetNum < targetSets) {
        setCurrentSetNum((s) => s + 1);
        setSingleTurnUser('Ismael');
      } else {
        // Han completado todas las series de esta máquina -> Preguntar qué tal fue
        setShowFeedbackModal(true);
      }
    }
  };

  const handleDecisionSubmit = (decision) => {
    // Guardar decisión de sobrecarga ('subir' | 'mantener' | 'bajar')
    setFeedbackDecisions((prev) => ({
      ...prev,
      [currentExIdx]: decision
    }));

    setShowFeedbackModal(false);

    // Pasar a la siguiente máquina o finalizar entreno
    if (currentExIdx + 1 < exercisesList.length) {
      setCurrentExIdx((idx) => idx + 1);
      setCurrentSetNum(1);
      setSingleTurnUser('Ismael');
      setRestSeconds(90); // descanso más largo al cambiar de máquina
      setRestRunning(true);
    } else {
      // ENTRENAMIENTO COMPLETO!
      finishCoopWorkout();
    }
  };

  // Guardado y sincronización dual
  const finishCoopWorkout = async () => {
    const totalVolume = exercisesList.reduce((acc, ex, idx) => {
      const ismaKg = userWeights[`${idx}_Ismael`] || ex.userConfigs?.Ismael?.weightKg || 30;
      const sandraKg = userWeights[`${idx}_Sandra`] || ex.userConfigs?.Sandra?.weightKg || 15;
      return acc + (ismaKg * 12 * 3) + (sandraKg * 12 * 3);
    }, 0);

    const workoutDate = new Date().toISOString().split('T')[0];

    // Payload para Ismael
    const ismaelWorkout = {
      user: 'Ismael',
      type: 'gym',
      date: workoutDate,
      routineName: `🔥 Entreno Dúo: Ismael & ${effectivePartner} (1 Móvil)`,
      category: 'Gimnasio Marbella',
      durationMin: elapsedMin || 48,
      caloriesBurned: Math.round(380 + elapsedMin * 4.5),
      totalVolumeKg: Math.round(totalVolume / 2),
      feeling: '🔥 100% Sincronización en Pareja',
      notes: `Sesión compartida con ${effectivePartner}. feedback: ${JSON.stringify(feedbackDecisions)}`,
      trainTogether: true,
      partner: effectivePartner,
      exercises: exercisesList.map((ex, idx) => ({
        name: ex.name,
        machine: ex.machine,
        sets: ex.sets || 3,
        reps: String(userReps[`${idx}_Ismael`] || ex.userConfigs?.Ismael?.reps || 12),
        weightKg: Number(userWeights[`${idx}_Ismael`] || ex.userConfigs?.Ismael?.weightKg || 30),
        nextAction: feedbackDecisions[idx] || 'mantener',
        completed: true
      }))
    };

    // Payload para Sandra si está registrada o es el partner
    const sandraWorkout = {
      user: effectivePartner,
      type: 'gym',
      date: workoutDate,
      routineName: `🔥 Entreno Dúo: ${effectivePartner} & Ismael (1 Móvil)`,
      category: 'Gimnasio Marbella',
      durationMin: elapsedMin || 48,
      caloriesBurned: Math.round(320 + elapsedMin * 3.8),
      totalVolumeKg: Math.round(totalVolume / 2),
      feeling: '🔥 100% Sincronización en Pareja',
      notes: `Sesión compartida con Ismael. feedback: ${JSON.stringify(feedbackDecisions)}`,
      trainTogether: true,
      partner: 'Ismael',
      exercises: exercisesList.map((ex, idx) => ({
        name: ex.name,
        machine: ex.machine,
        sets: ex.sets || 3,
        reps: String(userReps[`${idx}_${effectivePartner}`] || ex.userConfigs?.[effectivePartner]?.reps || 12),
        weightKg: Number(userWeights[`${idx}_${effectivePartner}`] || ex.userConfigs?.[effectivePartner]?.weightKg || 15),
        nextAction: feedbackDecisions[idx] || 'mantener',
        completed: true
      }))
    };

    try {
      // Guardar para Ismael
      await fetch('/api/gym/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ismaelWorkout)
      });

      // Si el compañero está registrado en la base de datos (Sandra u otro), guardar también en su perfil
      if (isRegisteredPartner || effectivePartner === 'Sandra' || effectivePartner === 'Ismael') {
        await fetch('/api/gym/workouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sandraWorkout)
        });
      }
    } catch (e) {
      console.warn('Error guardando entrenos cooperativos:', e);
    }

    if (onWorkoutCompleted) {
      onWorkoutCompleted({ ismaelWorkout, sandraWorkout });
    }
  };

  // Estilos de la tarjeta según de quién sea el turno (Estética Griega Clara Minimalista)
  // Turno 1: Azul Egeo olímpico (#005B99) sobre mármol blanco
  // Turno 2: Amatista / Lavanda mediterráneo (#7C3AED) sobre mármol blanco
  const cardGradient = isTurnIsmael
    ? 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 50%, #e0f2fe 100%)'
    : 'linear-gradient(145deg, #ffffff 0%, #faf5ff 50%, #f3e8ff 100%)';

  const cardBorder = isTurnIsmael
    ? '2.5px solid #005B99'
    : '2.5px solid #7c3aed';

  const cardShadow = isTurnIsmael
    ? '0 16px 36px rgba(0, 91, 153, 0.16)'
    : '0 16px 36px rgba(124, 58, 237, 0.16)';

  const userEmoji = currentTurnUserName === (effectivePartner || 'Compañero') ? '⚡' : '🏛️';
  const userColor = isTurnIsmael ? '#005b99' : '#6d28d9';

  return (
    <div style={{ margin: '0.8rem 0', position: 'relative', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Barra Superior con Estado del Modo */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.65rem 0.95rem',
        borderRadius: '16px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        marginBottom: '0.85rem',
        color: '#0f172a',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.3rem' }}>⚡</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0f172a' }}>
              <span>DUALIS: {activeUser || 'Atleta 1'} & {effectivePartner || 'Atleta 2'}</span>
              <span style={{
                fontSize: '0.65rem',
                background: deviceMode === 'single' ? '#e0f2fe' : '#f3e8ff',
                color: deviceMode === 'single' ? '#005b99' : '#6d28d9',
                border: deviceMode === 'single' ? '1px solid #bae6fd' : '1px solid #ddd6fe',
                padding: '0.15rem 0.45rem',
                borderRadius: '999px',
                fontWeight: 800
              }}>
                {deviceMode === 'single' ? '📱 1 Móvil' : '📲📲 2 Móviles'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Estación {currentExIdx + 1} de {exercisesList.length} · {elapsedMin} min
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('¿Quieres salir del entrenamiento conjunto?')) {
              onExitCoop && onExitCoop();
            }
          }}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#dc2626',
            borderRadius: '999px',
            padding: '0.35rem 0.75rem',
            fontSize: '0.74rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Salir
        </button>
      </div>

      {/* TARJETA DINÁMICA QUE CAMBIA DE COLOR (AZUL EGEO / MORADO AMATISTA) */}
      <div style={{
        padding: '1.4rem',
        borderRadius: '24px',
        background: cardGradient,
        border: cardBorder,
        boxShadow: cardShadow,
        color: '#0f172a',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}>
        {/* Cabecera de Turno Directa: muestra la ficha con el color del usuario */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: '#ffffff',
            border: `1.5px solid ${isTurnIsmael ? '#93c5fd' : '#c4b5fd'}`,
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 900,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <span style={{ fontSize: '1.1rem' }}>{userEmoji}</span>
            <span style={{ color: userColor }}>{currentTurnUserName.toUpperCase()}</span>
          </div>

          <div style={{
            fontSize: '0.78rem',
            fontWeight: 900,
            color: '#005b99',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            padding: '0.3rem 0.7rem',
            borderRadius: '999px'
          }}>
            SERIE {currentSetNum} DE {targetSets}
          </div>
        </div>

        {/* Nombre del Ejercicio y Máquina */}
        <h2 style={{
          margin: '0 0 0.25rem 0',
          fontSize: '1.35rem',
          fontWeight: 900,
          lineHeight: 1.25,
          color: '#0f172a'
        }}>
          {currentEx?.name}
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.82rem',
          color: '#64748b',
          fontWeight: 700,
          marginBottom: '1.1rem'
        }}>
          <span>🏢 {currentEx?.machine}</span>
        </div>

        {/* BOTONES: INSTRUCCIONES DE EJERCICIO + FOTO MÁQUINA */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.6rem',
          marginBottom: '1.2rem'
        }}>
          <button
            type="button"
            onClick={() => onOpenVisualModal && onOpenVisualModal({ name: currentEx.name, machine: currentEx.machine })}
            style={{
              padding: '0.65rem 0.6rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <span>📖</span>
            <span>Técnica & Músculos</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenVisualModal && onOpenVisualModal({ name: currentEx.name, machine: currentEx.machine })}
            style={{
              padding: '0.65rem 0.6rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <span>📸</span>
            <span>Ver Máquina / Foto</span>
          </button>
        </div>

        {/* AJUSTE DE PESOS Y REPETICIONES DEL USUARIO ACTUAL */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1.2rem'
        }}>
          {/* Kilos */}
          <div style={{
            background: '#ffffff',
            border: `1.5px solid ${isTurnIsmael ? '#bfdbfe' : '#ddd6fe'}`,
            borderRadius: '16px',
            padding: '0.85rem 0.5rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.04em' }}>
              PESO ({currentTurnUserName.toUpperCase()})
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>
              {effectiveWeight} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setUserWeights(prev => ({
                  ...prev,
                  [`${currentExIdx}_${currentTurnUserName}`]: Math.max(0, effectiveWeight - 2.5)
                }))}
                style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer' }}
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setUserWeights(prev => ({
                  ...prev,
                  [`${currentExIdx}_${currentTurnUserName}`]: effectiveWeight + 2.5
                }))}
                style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Repeticiones */}
          <div style={{
            background: '#ffffff',
            border: `1.5px solid ${isTurnIsmael ? '#bfdbfe' : '#ddd6fe'}`,
            borderRadius: '16px',
            padding: '0.85rem 0.5rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.04em' }}>
              REPETICIONES
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>
              {effectiveReps} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>reps</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setUserReps(prev => ({
                  ...prev,
                  [`${currentExIdx}_${currentTurnUserName}`]: Math.max(1, (parseInt(effectiveReps) || 10) - 1)
                }))}
                style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer' }}
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setUserReps(prev => ({
                  ...prev,
                  [`${currentExIdx}_${currentTurnUserName}`]: (parseInt(effectiveReps) || 10) + 1
                }))}
                style={{ width: '34px', height: '34px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer' }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* CRONÓMETRO DE DESCANSO CON SONIDO Y VIBRACIÓN */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '0.75rem 0.9rem',
          marginBottom: '1.3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 800 }}>CRONÓMETRO DE DESCANSO</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, fontFamily: 'monospace', color: restSeconds > 0 ? '#059669' : '#0f172a' }}>
              ⏱️ {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[30, 60, 90].map(sec => (
              <button
                key={sec}
                type="button"
                onClick={() => startRestTimer(sec)}
                style={{
                  padding: '0.4rem 0.6rem',
                  borderRadius: '10px',
                  border: restSeconds === sec && restRunning ? '1.5px solid #059669' : '1px solid #e2e8f0',
                  background: restSeconds === sec && restRunning ? '#ecfdf5' : '#f8fafc',
                  color: restSeconds === sec && restRunning ? '#059669' : '#334155',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* BOTÓN PRINCIPAL DE SERIE COMPLETADA */}
        <button
          type="button"
          onClick={handleCompleteSetSingleDevice}
          style={{
            width: '100%',
            padding: '1.05rem',
            borderRadius: '18px',
            border: 'none',
            background: isTurnIsmael
              ? 'linear-gradient(135deg, #005B99 0%, #004b87 100%)'
              : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '1.05rem',
            cursor: 'pointer',
            boxShadow: isTurnIsmael
              ? '0 8px 24px rgba(0, 91, 153, 0.3)'
              : '0 8px 24px rgba(124, 58, 237, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'transform 0.1s ease'
          }}
        >
          <span>✅</span>
          <span>¡Serie Hecha! Pasar a {nextTurnUserName} ➔</span>
        </button>
      </div>

      {/* MODAL DE SOBRECARGA PROGRESIVA AL FINAL DE CADA EJERCICIO */}
      {showFeedbackModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          background: 'rgba(5, 10, 20, 0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.2rem'
        }}>
          <div style={{
            maxWidth: '430px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '24px',
            padding: '1.6rem',
            color: '#0f172a',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.3rem' }}>📈</div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 900 }}>
              ¿Qué tal fue {currentEx?.name}?
            </h3>
            <p style={{ margin: '0 0 1.3rem 0', fontSize: '0.82rem', color: '#64748b' }}>
              Ayuda a Adán a calibrar los pesos de la próxima sesión para {activeUser} y {effectivePartner}:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => handleDecisionSubmit('subir')}
                style={{
                  padding: '0.85rem',
                  borderRadius: '14px',
                  border: '2px solid #10b981',
                  background: '#ecfdf5',
                  color: '#065f46',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>🟢</span>
                <span>Subir peso (+2.5 kg próxima vez - me resultó fácil)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionSubmit('mantener')}
                style={{
                  padding: '0.85rem',
                  borderRadius: '14px',
                  border: '2px solid #3b82f6',
                  background: '#eff6ff',
                  color: '#1e40af',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>🟡</span>
                <span>Mantener peso (ideal para consolidar técnica)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionSubmit('bajar')}
                style={{
                  padding: '0.85rem',
                  borderRadius: '14px',
                  border: '2px solid #f97316',
                  background: '#fff7ed',
                  color: '#c2410c',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>🔴</span>
                <span>Bajar peso (demasiado duro / fallamos reps)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}