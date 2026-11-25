import React, { useRef, useEffect, useState } from 'react';

export default function GymSocialShareModal({
  isOpen,
  onClose,
  workoutData,
  userName = 'Ismael'
}) {
  const canvasRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  useEffect(() => {
    if (!isOpen || !workoutData) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // Estándar oficial de Instagram Stories vertical 9:16
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // 1. Fondo Claro Mármol Griego Olímpico (Estética Luminosa Minimalista)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#ffffff');
    bgGrad.addColorStop(0.35, '#f8fafc');
    bgGrad.addColorStop(0.75, '#f1f5f9');
    bgGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Luces y Brillos Ambientales (Azul Egeo Olímpico y Oro Griego)
    const glow1 = ctx.createRadialGradient(250, 320, 30, 250, 320, 500);
    glow1.addColorStop(0, 'rgba(0, 91, 153, 0.08)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glowGold = ctx.createRadialGradient(width - 150, 250, 30, width - 150, 250, 480);
    glowGold.addColorStop(0, 'rgba(197, 155, 39, 0.12)');
    glowGold.addColorStop(0.6, 'rgba(197, 155, 39, 0.04)');
    glowGold.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGold;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(width - 250, height - 350, 30, width - 250, height - 350, 550);
    glow2.addColorStop(0, 'rgba(14, 165, 233, 0.08)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    // 3. Borde del Marco Exterior Elegante Griego
    ctx.strokeStyle = '#005b99';
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 80, width - 96, height - 160);

    ctx.strokeStyle = '#c59b27';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(58, 90, width - 116, height - 180);

    // 4. Título Principal de Marca: FORMA
    ctx.fillStyle = '#005b99';
    ctx.font = '900 88px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.textAlign = 'center';
    ctx.fillText('FORMA', width / 2, 205);

    // Línea decorativa dorada
    const lineGrad = ctx.createLinearGradient(width / 2 - 200, 0, width / 2 + 200, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, '#c59b27');
    lineGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 200, 238);
    ctx.lineTo(width / 2 + 200, 238);
    ctx.stroke();

    // Subtítulo de marca
    ctx.fillStyle = '#c59b27';
    ctx.font = '800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('INTELLIGENT STRENGTH & DUALIS', width / 2, 268);

    // Fecha del entrenamiento
    ctx.fillStyle = '#64748b';
    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const dateText = workoutData.dateFormatted || new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillText(dateText.toUpperCase(), width / 2, 305);

    const isDuo = workoutData.isDuo || workoutData.together || userName === 'Dúo' || userName === 'Dualis';

    // 6. Tarjeta Destacada de Atleta y Rutina
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(70, 355, width - 140, 160, 24);
    ctx.fill();
    ctx.strokeStyle = isDuo ? '#8b5cf6' : '#005b99';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = isDuo ? '#7c3aed' : '#005b99';
    ctx.font = '900 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isDuo ? '⚡ DUALIS WORKOUT · EN EQUIPO' : `🏋️ ATLETA: ${userName.toUpperCase()}`, width / 2, 415);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const routineTitle = (workoutData.routineName || 'Sesión de Entrenamiento').replace('Gimnasio Marbella', 'Forma').replace('Casita Gym', 'Forma').slice(0, 48);
    ctx.fillText(routineTitle, width / 2, 465);

    ctx.fillStyle = '#059669';
    ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isDuo ? '✨ ENTRENAMIENTO DUALIS SUPERADO EN EQUIPO' : '✨ ENTRENAMIENTO COMPLETADO CON ÉXITO', width / 2, 498);

    // 7. Grid de 4 Métricas Clave (2 columnas x 2 filas)
    const boxW = 450;
    const boxH = 155;
    const boxes = [
      {
        x: 70,
        y: 545,
        icon: '⏱️',
        label: isDuo ? 'TIEMPO EN EQUIPO' : 'TIEMPO ENTRENANDO',
        val: `${workoutData.durationMin || 60} MIN`,
        sub: `${workoutData.startTime || '18:30'} → ${workoutData.endTime || '19:35'}`
      },
      {
        x: 560,
        y: 545,
        icon: '🔥',
        label: isDuo ? 'QUEMA COMBINADA' : 'GASTO CALÓRICO',
        val: isDuo ? `~${(workoutData.caloriesBurned || 420) * 2} KCAL` : `~${workoutData.caloriesBurned || 450} KCAL`,
        sub: isDuo ? 'Gasto total de los dos' : 'Quema metabólica activa'
      },
      {
        x: 70,
        y: 725,
        icon: '💪',
        label: isDuo ? 'MÁQUINAS JUNTOS' : 'MÁQUINAS / SERIES',
        val: `${workoutData.completedCount || 7} / ${workoutData.totalCount || 7}`,
        sub: 'Series alternadas en pareja'
      },
      {
        x: 560,
        y: 725,
        icon: '⚡',
        label: isDuo ? 'SINCRONIZACIÓN' : 'SENSACIÓN FINAL',
        val: isDuo ? '100% EQUIPO' : (workoutData.feeling || 'Muy bien').replace(/[^\w\sñáéíóú]/gi, '').trim().toUpperCase(),
        sub: isDuo ? 'Compañerismo y fuerza' : 'Nivel de energía superado'
      }
    ];

    boxes.forEach(b => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, boxW, boxH, 20);
      ctx.fill();

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#005b99';
      ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${b.icon} ${b.label}`, b.x + 24, b.y + 44);

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(b.val, b.x + 24, b.y + 96);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(b.sub, b.x + 24, b.y + 132);
    });

    // 8. Lista Detallada de Ejercicios Realizados
    const listTopY = 910;
    const listHeight = 630;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(70, listTopY, width - 140, listHeight, 22);
    ctx.fill();
    ctx.strokeStyle = '#005b99';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#005b99';
    ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('📋 RESUMEN DE PROGRESIÓN Y CARGAS:', 105, listTopY + 50);

    const exercises = (workoutData.exercises || []).filter(e => e.completed).slice(0, 8);
    exercises.forEach((ex, i) => {
      const lineY = listTopY + 110 + (i * 62);

      // Fila alterna sutil
      if (i % 2 === 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(85, lineY - 38, width - 170, 54);
      }

      // Checkmark esmeralda
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('✓', 110, lineY);

      // Nombre ejercicio
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 25px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const cleanName = (ex.name || 'Ejercicio').replace('Gimnasio Marbella', '').trim();
      const nameTxt = cleanName.length > 32 ? cleanName.slice(0, 30) + '…' : cleanName;
      ctx.fillText(nameTxt, 145, lineY);

      // Carga o Reps
      ctx.textAlign = 'right';
      ctx.fillStyle = '#005b99';
      ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      let statsTxt = '';
      if (ex.isCardio) {
        statsTxt = `${ex.reps || '15 min'}${ex.distanceKm ? ` · ${ex.distanceKm} km` : ''}`;
      } else {
        statsTxt = `${ex.weightKg || 0} kg × ${ex.reps || 10}`;
      }
      ctx.fillText(statsTxt, width - 110, lineY);
      ctx.textAlign = 'left';
    });

    // 9. Frase Motivacional / Tag de Instagram
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(70, 1565, width - 140, 130, 20);
    ctx.fill();
    ctx.strokeStyle = isDuo ? '#8b5cf6' : '#c59b27';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isDuo ? '🎯 "Entrenar en pareja multiplica la motivación y los resultados."' : '🎯 "La constancia no se negocia. Un día más sumando."', width / 2, 1618);

    ctx.fillStyle = isDuo ? '#7c3aed' : '#005b99';
    ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isDuo ? '@forma.training · Modo Dualis en equipo' : '@forma.training · Fuerza & Constancia Diaria', width / 2, 1662);

    // 10. Pie de imagen / Watermark
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(isDuo ? '#Forma #Dualis #StrengthTraining · FORMA' : '#Forma #StrengthTraining #Fitness · FORMA', width / 2, 1780);

    // Exportar como URL de imagen para previsualización
    canvas.toBlob((blob) => {
      if (blob) {
        setImageUrl(URL.createObjectURL(blob));
      }
    }, 'image/png');

  }, [isOpen, workoutData, userName]);

  if (!isOpen || !workoutData) return null;

  const getInstagramCaption = () => {
    const isDuo = workoutData.isDuo || workoutData.together || userName === 'Dúo' || userName === 'Dualis';
    if (isDuo) {
      return `⚡ ¡Entrenamiento en pareja completado en #Forma (Modo Dualis)!\n\n` +
        `⏱️ ${workoutData.durationMin || 60} min juntos (${workoutData.startTime || '18:30'} - ${workoutData.endTime || '19:30'})\n` +
        `🔥 ~${(workoutData.caloriesBurned || 420) * 2} kcal quemadas en equipo\n` +
        `💪 ${workoutData.completedCount || 7}/${workoutData.totalCount || 7} ejercicios completados\n` +
        `⚡ ¡Superación conjunta y sobrecarga progresiva!\n\n` +
        `#Forma #Dualis #FitnessPareja #Workout @forma.training`;
    }
    return `🔥 ¡Entrenamiento completado en #Forma!\n\n` +
      `⏱️ ${workoutData.durationMin || 60} min (${workoutData.startTime || '18:30'} - ${workoutData.endTime || '19:30'})\n` +
      `🔥 ~${workoutData.caloriesBurned || 450} kcal activas\n` +
      `💪 ${workoutData.completedCount || 7}/${workoutData.totalCount || 7} ejercicios superados\n` +
      `⚡ Sensación: ${workoutData.feeling || 'A tope'}\n\n` +
      `#Forma #Fitness #Constancia #Workout @forma.training`;
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(getInstagramCaption());
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 3000);
    } catch (err) {
      console.warn('Error al copiar texto:', err);
    }
  };

  const handleInstagramShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSharing(true);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setSharing(false);
        return;
      }

      const fileName = `Forma-Story-${userName}-${workoutData.date || 'hoy'}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Intento compartir archivo nativo (en Android/iOS abre selector con Instagram / Stories)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Forma - Story de ${userName}`,
            text: getInstagramCaption()
          });
          setSharing(false);
          return;
        } catch (e) {
          console.log('Share canceled or dismissed:', e);
        }
      }

      // Si no soporta compartir archivo directo, descarga automáticamente la historia en 9:16
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      setSharing(false);
    }, 'image/png');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Forma-Story-${userName}-${workoutData.date || 'hoy'}.png`;
      a.click();
    }, 'image/png');
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
          overflowY: 'auto',
          padding: '1.25rem',
          borderRadius: '24px',
          background: '#ffffff',
          border: '2px solid #005b99',
          boxShadow: '0 20px 60px rgba(0, 91, 153, 0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.6rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#005b99', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900 }}>
            <span>📸</span>
            <span>Compartir · FORMA</span>
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.6rem', cursor: 'pointer', lineHeight: 1 }}>
            &times;
          </button>
        </div>

        {/* Canvas oculto para renderizar en alta resolución 1080x1920 */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Previsualización en proporción 9:16 */}
        {imageUrl ? (
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{
              display: 'inline-block',
              padding: '3px',
              borderRadius: '16px',
              background: 'linear-gradient(45deg, #005b99, #0ea5e9, #c59b27)',
              boxShadow: '0 8px 30px rgba(0, 91, 153, 0.2)'
            }}>
              <img
                src={imageUrl}
                alt="Story FORMA"
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: '52vh',
                  aspectRatio: '9 / 16',
                  objectFit: 'contain',
                  borderRadius: '13px'
                }}
              />
            </div>
            <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#64748b' }}>
              Formato vertical 9:16 (1080 × 1920 px) · Estilo Griego Olímpico
            </div>
          </div>
        ) : (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
            Generando historia de Instagram...
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {/* Botón principal Instagram */}
          <button
            type="button"
            onClick={handleInstagramShare}
            disabled={sharing || !imageUrl}
            style={{
              padding: '0.9rem',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 20px rgba(220, 39, 67, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <span>📸</span>
            <span>{sharing ? 'Preparando Historia...' : 'Compartir en Instagram Stories'}</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Copiar pie de foto */}
            <button
              type="button"
              onClick={handleCopyCaption}
              style={{
                flex: 1,
                padding: '0.65rem 0.5rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: copiedCaption ? '#ecfdf5' : '#f8fafc',
                color: copiedCaption ? '#059669' : '#0f172a',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem'
              }}
            >
              <span>{copiedCaption ? '✓' : '📋'}</span>
              <span>{copiedCaption ? '¡Copiado!' : 'Copiar Texto IG'}</span>
            </button>

            {/* Descargar PNG 9:16 */}
            <button
              type="button"
              onClick={handleDownload}
              style={{
                flex: 1,
                padding: '0.65rem 0.5rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem'
              }}
            >
              <span>📥</span>
              <span>Guardar Imagen</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem',
              borderRadius: '10px',
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '0.2rem'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
