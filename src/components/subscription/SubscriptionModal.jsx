import React, { useState } from 'react';

export const PLANS = [
  {
    id: 'hermes',
    name: 'Plan Hermes',
    subtitle: 'Inicio & Registro Continuo',
    icon: '🪽',
    price: 1,
    period: 'mes',
    badge: 'Económico',
    accentColor: '#0ea5e9',
    features: [
      'Historial de entrenamientos ilimitado',
      'Gráficas de progresión de cargas',
      'Evolución de peso corporal y notas',
      'Control diario de calorías y agua'
    ]
  },
  {
    id: 'apolo',
    name: 'Plan Apolo · Dualis Pro',
    subtitle: 'Entrenamiento en Pareja & Sobrecarga',
    icon: '⚡',
    price: 3,
    period: 'mes',
    popular: true,
    badge: '⭐ Más Popular',
    accentColor: '#005b99',
    features: [
      'Todo lo incluido en Plan Hermes',
      'Modo DUALIS completo en 2 móviles en vivo',
      'Sobrecarga Progresiva asistida por Coach FORMA',
      'Lector de pantallas de cardio con cámara',
      'Cronómetro con avisos sonoros y vibración'
    ]
  },
  {
    id: 'zeus',
    name: 'Plan Zeus · Olimpo VIP',
    subtitle: 'Acceso Total & Sin Límites',
    icon: '🏛️',
    price: 5,
    period: 'mes',
    badge: '👑 Élite',
    accentColor: '#c59b27',
    features: [
      'Todo lo incluido en Plan Apolo',
      'Rutinas personalizadas ilimitadas',
      'Exportación de Stories HD sin marca de agua',
      'Modo Offline Total con sincronización nube',
      'Soporte prioritario y acceso anticipado'
    ]
  }
];

export default function SubscriptionModal({
  isOpen,
  onClose,
  activeUser = 'Atleta',
  currentPlanId = 'free',
  onPlanChanged
}) {
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId === 'free' ? 'apolo' : currentPlanId);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const currentPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[1];

  const handleActivatePlan = async (plan) => {
    setLoading(true);
    setSuccessMessage('');
    try {
      const res = await fetch('/api/gym/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: activeUser,
          planId: plan.id,
          planName: plan.name,
          price: plan.price
        })
      });
      if (res.ok) {
        localStorage.setItem(`forma_plan_${activeUser}`, plan.id);
        localStorage.setItem(`forma_plan_name_${activeUser}`, plan.name);
        if (onPlanChanged) onPlanChanged(plan);
        setSuccessMessage(`¡Enhorabuena ${activeUser}! Has activado el ${plan.name} (${plan.price}€/mes). Funciones desbloqueadas.`);
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1800);
      }
    } catch (e) {
      // Fallback local
      localStorage.setItem(`forma_plan_${activeUser}`, plan.id);
      localStorage.setItem(`forma_plan_name_${activeUser}`, plan.name);
      if (onPlanChanged) onPlanChanged(plan);
      setSuccessMessage(`¡Enhorabuena! Has activado el ${plan.name} (${plan.price}€/mes).`);
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '95%',
          maxHeight: '94vh',
          background: '#ffffff',
          borderRadius: '26px',
          border: '1.5px solid #e2e8f0',
          padding: '1.6rem 1.4rem',
          boxShadow: '0 25px 70px rgba(0, 91, 153, 0.16)',
          color: '#0f172a',
          position: 'relative'
        }}
      >
        {/* Encabezado Griego Minimalista */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
          <div>
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
              color: '#005b99',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.4rem'
            }}>
              <span>🏛️</span>
              <span>PLANES OLÍMPICOS · FORMA</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#004b87' }}>
              Desbloquea el Máximo Potencial
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Suscripción mensual accesible sin permanencia. Cancela o cambia cuando quieras.
            </p>
          </div>

          <button
            type="button"
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

        {/* Mensaje de éxito al activar */}
        {successMessage && (
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
            border: '1.5px solid #34d399',
            borderRadius: '16px',
            padding: '1rem',
            textAlign: 'center',
            color: '#065f46',
            fontWeight: 800,
            fontSize: '0.92rem',
            marginBottom: '1rem',
            animation: 'fadeIn 0.25s ease'
          }}>
            🎉 {successMessage}
          </div>
        )}

        {/* Selector de los 3 Planes: 1€, 3€, 5€ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.4rem' }}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isCurrent = currentPlanId === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                style={{
                  border: isSelected ? `2.5px solid ${plan.accentColor}` : '1.5px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '1rem',
                  background: isSelected ? '#f8fafc' : '#ffffff',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? `0 8px 24px rgba(0, 91, 153, 0.1)` : 'none'
                }}
              >
                {/* Badge flotante */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{plan.icon}</span>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>
                        {plan.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {plan.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: plan.accentColor, lineHeight: 1 }}>
                      {plan.price}€
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>/mes</span>
                    </div>
                    {plan.badge && (
                      <span style={{
                        display: 'inline-block',
                        background: plan.popular ? '#005b99' : '#f1f5f9',
                        color: plan.popular ? '#ffffff' : '#334155',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '999px',
                        marginTop: '0.2rem'
                      }}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Lista de características del plan */}
                <div style={{
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '0.6rem',
                  marginTop: '0.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#334155' }}>
                      <span style={{ color: plan.accentColor, fontWeight: 900 }}>✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {isCurrent && (
                  <div style={{
                    marginTop: '0.6rem',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#059669',
                    background: '#ecfdf5',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '8px',
                    display: 'inline-block'
                  }}>
                    ● Tu plan actualmente activo
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Botón de Activación / Confirmación */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleActivatePlan(currentPlan)}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #005b99 0%, #004b87 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '16px',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: 900,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(0, 91, 153, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          {loading ? 'Activando suscripción...' : `⚡ Activar ${currentPlan.name} por ${currentPlan.price}€/mes`}
        </button>

        <div style={{ textAlign: 'center', marginTop: '0.65rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            🔒 Pago seguro · Sin permanencia · Cancela cuando quieras con 1 toque
          </span>
        </div>
      </div>
    </div>
  );
}
