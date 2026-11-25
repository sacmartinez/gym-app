import React, { useState } from 'react';

const GOAL_PRESETS = [
  {
    id: 'definicion_grasa',
    title: 'Definición & Pérdida de Grasa',
    icon: '🔥💪🍫',
    desc: 'Quemar grasa corporal acumulada, definir cintura y congestionar brazos, hombros y abdomen.',
    defaultDays: 4,
    defaultLevel: 'Duro / Progresivo',
    defaultKcal: 1950,
    routineKey: 'STRENGTH'
  },
  {
    id: 'tonificacion_firmeza',
    title: 'Tonificación & Escultura Corporal',
    icon: '⚡🍑',
    desc: 'Estilizar figura, firmeza en piernas y glúteos, fortalecer core y estilizar masa magra.',
    defaultDays: 3,
    defaultLevel: 'Adaptación / Progresivo',
    defaultKcal: 1700,
    routineKey: 'TONING'
  },
  {
    id: 'hipertrofia_fuerza',
    title: 'Hipertrofia & Fuerza Máxima',
    icon: '💥🦍',
    desc: 'Aumento de masa muscular, progresión continua de cargas en máquinas y ganancia de fuerza neta.',
    defaultDays: 4,
    defaultLevel: '¡Modo Bestia!',
    defaultKcal: 2400,
    routineKey: 'STRENGTH'
  },
  {
    id: 'cardio_salud',
    title: 'Rendimiento & Salud Cardiovascular',
    icon: '🏃‍♂️❤️',
    desc: 'Gran quema calórica, resistencia aeróbica en cinta y elíptica, vitalidad y energía diaria.',
    defaultDays: 3,
    defaultLevel: 'Constante / Progresivo',
    defaultKcal: 2050,
    routineKey: 'TONING'
  }
];

export default function OnboardingGoalsScreen({
  userName = 'Atleta',
  onFinishOnboarding
}) {
  const [selectedGoalId, setSelectedGoalId] = useState('definicion_grasa');
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [intensityLevel, setIntensityLevel] = useState('Duro / Progresivo');
  const [customFocus, setCustomFocus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentGoal = GOAL_PRESETS.find(g => g.id === selectedGoalId) || GOAL_PRESETS[0];
  const targetKcal = currentGoal.defaultKcal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const goalPayload = {
      user: userName,
      targetDaysPerWeek: Number(daysPerWeek) || 4,
      targetWeightKg: targetWeight ? Number(targetWeight) : null,
      currentWeightKg: currentWeight ? Number(currentWeight) : null,
      goalType: currentGoal.id,
      goalLabel: `${currentGoal.icon} ${currentGoal.title}`,
      customFocus: customFocus.trim() || currentGoal.desc,
      level: intensityLevel,
      routineKey: currentGoal.routineKey
    };

    try {
      await fetch('/api/gym/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalPayload)
      });

      if (currentWeight) {
        await fetch('/api/gym/weights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: userName,
            weightKg: Number(currentWeight),
            date: new Date().toISOString().split('T')[0],
            notes: 'Peso inicial calibrado en FORMA'
          })
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('[Onboarding Save Backend Warning]', err);
    }

    localStorage.setItem(`gym_onboarded_${userName}`, 'true');
    localStorage.setItem(`gym_goal_${userName}`, JSON.stringify(goalPayload));

    setSubmitting(false);
    onFinishOnboarding(goalPayload);
  };

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
      <div style={{
        maxWidth: '560px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '26px',
        padding: '1.8rem 1.5rem',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 25px 70px rgba(0, 91, 153, 0.1)',
        color: '#0f172a',
        boxSizing: 'border-box'
      }}>
        {/* Cabecera Griega / Bienvenida de Coach FORMA */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%)',
          border: '1.5px solid #bae6fd',
          borderRadius: '18px',
          padding: '1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.9rem',
          marginBottom: '1.4rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #005b99, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: '0 4px 14px rgba(0, 91, 153, 0.25)',
            flexShrink: 0
          }}>
            🏛️
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#005b99', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Coach Olímpico FORMA
            </div>
            <h2 style={{ margin: '0.15rem 0', fontSize: '1.18rem', fontWeight: 900, color: '#004b87' }}>
              ¡Hola {userName}! Calibremos tu objetivo
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
              Configura tu plan para ajustar tus rutinas de fuerza, volumen de series y descansos inteligentes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Paso 1: Objetivo Principal */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
              1️⃣ ¿Cuál es tu objetivo prioritario?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {GOAL_PRESETS.map((g) => {
                const isSel = selectedGoalId === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => {
                      setSelectedGoalId(g.id);
                      setDaysPerWeek(g.defaultDays);
                      setIntensityLevel(g.defaultLevel);
                    }}
                    style={{
                      border: isSel ? '2.5px solid #005b99' : '1.5px solid #e2e8f0',
                      background: isSel ? '#f0f7ff' : '#ffffff',
                      borderRadius: '16px',
                      padding: '0.85rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      transition: 'all 0.15s ease',
                      boxShadow: isSel ? '0 4px 14px rgba(0, 91, 153, 0.08)' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>{g.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{g.title}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.35 }}>
                        {g.desc}
                      </div>
                    </div>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: isSel ? '6px solid #005b99' : '2px solid #cbd5e1',
                      background: '#ffffff',
                      flexShrink: 0
                    }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Paso 2: Días por semana */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              2️⃣ ¿Cuántos días a la semana te comprometes a entrenar?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { days: 3, label: '3 días / sem', desc: 'Adaptación & Tono' },
                { days: 4, label: '4 días / sem', desc: 'Rutina Completa' },
                { days: 5, label: '5 días / sem', desc: 'Alto Rendimiento' }
              ].map(d => {
                const isSel = daysPerWeek === d.days;
                return (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => setDaysPerWeek(d.days)}
                    style={{
                      padding: '0.75rem 0.4rem',
                      borderRadius: '14px',
                      border: isSel ? '2.5px solid #005b99' : '1.5px solid #e2e8f0',
                      background: isSel ? '#f0f7ff' : '#ffffff',
                      color: isSel ? '#004b87' : '#475569',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxShadow: isSel ? '0 4px 14px rgba(0, 91, 153, 0.08)' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '0.95rem', fontWeight: 900 }}>{d.label}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.15rem' }}>{d.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paso 3: Pesos y Nivel de Intensidad */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                ⚖️ Peso actual (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ej. 75.0"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '14px',
                  padding: '0.7rem 0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
                🎯 Peso objetivo (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ej. 70.0"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '14px',
                  padding: '0.7rem 0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Nivel de intensidad */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>
              ⚡ Nivel de exigencia deseado
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {['Adaptación suave', 'Duro / Progresivo', '¡Modo Bestia!'].map(lvl => {
                const isSel = intensityLevel === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setIntensityLevel(lvl)}
                    style={{
                      padding: '0.55rem 0.3rem',
                      borderRadius: '12px',
                      border: isSel ? '2px solid #005b99' : '1px solid #cbd5e1',
                      background: isSel ? '#f0f7ff' : '#ffffff',
                      color: isSel ? '#005b99' : '#64748b',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen dinámico de calibración */}
          <div style={{
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Meta Calórica Diaria Estimada</div>
              <div style={{ fontSize: '1.18rem', fontWeight: 900, color: '#005b99' }}>
                {targetKcal} kcal / día
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Ritmo Semanal</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                {daysPerWeek} sesiones / sem
              </div>
            </div>
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: 'linear-gradient(135deg, #005b99, #004b87)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 900,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(0, 91, 153, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            {submitting ? 'Calibrando FORMA...' : '🚀 ¡Guardar y Entrar en FORMA!'}
          </button>
        </form>
      </div>
    </div>
  );
}
