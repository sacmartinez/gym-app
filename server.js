import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir estáticos de public (iconos, manifest)
app.use(express.static(path.join(__dirname, 'public')));

// Servir la build de producción de Vite si existe
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Descarga directa segura del APK para móviles (Forma.apk y CasitaGym.apk)
app.get(['/Forma.apk', '/CasitaGym.apk'], (req, res) => {
  const possiblePaths = [
    path.join(__dirname, 'Forma.apk'),
    path.join(__dirname, 'dist', 'Forma.apk'),
    path.join(__dirname, 'public', 'Forma.apk'),
    path.join(__dirname, 'CasitaGym.apk')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="Forma.apk"');
      return res.sendFile(p);
    }
  }
  res.status(404).send('APK no disponible todavía.');
});

// ==========================================
// RUTAS API GYM & PERSONAL TRAINER
// ==========================================

// --- AUTH & USUARIOS (ISMAEL & SANDRA) ---
app.get('/api/gym/auth/check-phone', (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.json({ exists: false });
    const user = db.findUserByPhone(phone);
    if (user) {
      return res.json({
        exists: true,
        user: {
          name: user.name,
          phone: user.phone,
          onboarded: !!user.onboarded
        }
      });
    }
    res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar teléfono' });
  }
});

app.get('/api/gym/auth/users', (req, res) => {
  try {
    const rawUsers = db.getUsers();
    const users = rawUsers.map(u => ({
      name: u.name,
      phone: u.phone ? u.phone.replace(/(\d{3})\d{3}(\d{3})/, '$1***$2') : '',
      hasPassword: !!u.password,
      onboarded: !!u.onboarded
    }));
    res.json({ users });
  } catch (error) {
    console.error('[Auth Users Error]', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

app.delete('/api/gym/auth/user/:phone', (req, res) => {
  try {
    const { phone } = req.params;
    const result = db.deleteUserByPhone(phone);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/gym/auth/profile', (req, res) => {
  try {
    const { currentName, newName, phone, password, nfcCardId, nfcCardLabel } = req.body;
    if (!currentName) {
      return res.status(400).json({ error: 'Falta especificar el usuario actual.' });
    }
    const result = db.updateUserProfile({ currentName, newName, phone, password, nfcCardId, nfcCardLabel });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('[Profile Update Error]', error);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

app.delete('/api/gym/auth/account/:user', (req, res) => {
  try {
    const { user } = req.params;
    const result = db.deleteUserByName(user);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('[Account Delete Error]', error);
    res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
});

app.get('/api/gym/nfc/:user', (req, res) => {
  try {
    const { user } = req.params;
    const card = db.getNfcCard(user);
    res.json({ nfcCard: card });
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar tarjeta NFC' });
  }
});

app.post('/api/gym/nfc', (req, res) => {
  try {
    const { user, cardId, label, cardType, color } = req.body;
    if (!user) return res.status(400).json({ error: 'Usuario requerido' });
    const card = db.saveNfcCard(user, { cardId, label, cardType, color });
    res.json({ success: true, nfcCard: card });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar tarjeta NFC' });
  }
});

app.post('/api/gym/auth/register', (req, res) => {
  try {
    const { name, phone, password, targetDaysPerWeek, targetWeightKg, goalType, goalLabel, customFocus, level } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre de usuario es obligatorio.' });
    }
    if (!phone || !phone.trim() || phone.trim().replace(/\D/g, '').length < 9) {
      return res.status(400).json({ error: 'El número de teléfono es obligatorio y debe tener al menos 9 dígitos.' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'La contraseña es obligatoria.' });
    }

    const result = db.registerUser({
      name,
      phone,
      password,
      targetDaysPerWeek,
      targetWeightKg,
      goalType,
      goalLabel,
      customFocus,
      level
    });

    res.json(result);
  } catch (error) {
    console.error('[Auth Register Error]', error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

app.post('/api/gym/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !identifier.trim() || !password || !password.trim()) {
      return res.status(400).json({ error: 'Debes indicar usuario o teléfono y tu contraseña.' });
    }

    const result = db.loginUser({ identifier, password });
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('[Auth Login Error]', error);
    res.status(500).json({ error: 'Error al procesar el inicio de sesión' });
  }
});

app.post('/api/gym/auth/onboarding', (req, res) => {
  try {
    const { user, targetDaysPerWeek, targetWeightKg, goalType, goalLabel, customFocus, level } = req.body;
    if (!user) {
      return res.status(400).json({ error: 'Falta especificar el usuario.' });
    }
    const goals = db.updateGymGoal(user, {
      targetDaysPerWeek,
      targetWeightKg,
      goalType,
      goalLabel,
      customFocus,
      level
    });
    db.setUserOnboarded(user, true);
    res.json({ success: true, user, goals });
  } catch (error) {
    console.error('[Auth Onboarding Error]', error);
    res.status(500).json({ error: 'Error al guardar objetivos de enfoque' });
  }
});

// 1. Obtener todos los datos de Gym
app.get('/api/gym', (req, res) => {
  try {
    res.json(db.getGymData());
  } catch (error) {
    console.error('[Gym Data Error]', error);
    res.status(500).json({ error: 'Error al obtener datos del gimnasio' });
  }
});

// 2. Guardar nuevo entrenamiento
app.post('/api/gym/workouts', async (req, res) => {
  try {
    const workout = req.body;
    const trainTogether = !!workout.trainTogether;
    const partner = workout.user === 'Ismael' ? 'Sandra' : 'Ismael';

    let workouts = db.addGymWorkout(workout);

    if (trainTogether && workout.type !== 'home') {
      workouts = db.addGymWorkout({ ...workout, user: partner });
    }

    res.status(201).json({ workouts });
  } catch (error) {
    console.error('[Gym Workout Error]', error);
    res.status(500).json({ error: 'Error al registrar el entrenamiento' });
  }
});

// 3. Eliminar entrenamiento
app.delete('/api/gym/workouts/:id', (req, res) => {
  try {
    const workouts = db.deleteGymWorkout(req.params.id);
    res.json({ workouts });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el entrenamiento' });
  }
});

// 4. Registro de peso corporal
app.post('/api/gym/weights', (req, res) => {
  try {
    const bodyWeights = db.addGymBodyWeight(req.body);
    res.status(201).json({ bodyWeights });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar peso corporal' });
  }
});

app.delete('/api/gym/weights/:id', (req, res) => {
  try {
    const bodyWeights = db.deleteGymBodyWeight(req.params.id);
    res.json({ bodyWeights });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar registro de peso' });
  }
});

// 5. Objetivos de entrenamiento
app.post('/api/gym/goals', (req, res) => {
  try {
    const { user, targetDaysPerWeek, targetWeightKg, goalType, goalLabel, customFocus, level } = req.body;
    const goals = db.updateGymGoal(user, { targetDaysPerWeek, targetWeightKg, goalType, goalLabel, customFocus, level });
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar objetivo' });
  }
});

// 6. Rutinas personalizadas
app.post('/api/gym/routines', (req, res) => {
  try {
    const customRoutines = db.saveCustomGymRoutine(req.body);
    res.status(201).json({ customRoutines });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar rutina' });
  }
});

app.delete('/api/gym/routines/:id', (req, res) => {
  try {
    const customRoutines = db.deleteCustomGymRoutine(req.params.id);
    res.json({ customRoutines });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar rutina' });
  }
});

// Suscripciones FORMA (1€, 3€, 5€ / mes)
app.get('/api/gym/subscription/:user', (req, res) => {
  try {
    const sub = db.getSubscription(req.params.user);
    res.json({ subscription: sub });
  } catch (error) {
    res.json({ subscription: { planId: 'free', planName: 'Free', price: 0 } });
  }
});

app.post('/api/gym/subscription', (req, res) => {
  try {
    const { user, planId, planName, price } = req.body;
    const sub = db.updateSubscription(user, { planId, planName, price });
    res.json({ success: true, subscription: sub });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar suscripción' });
  }
});

// 7. Registro de agua
app.post('/api/gym/water', (req, res) => {
  try {
    const { user, date, glasses } = req.body;
    const waterLogs = db.updateGymWater(user || 'Ismael', date || new Date().toISOString().split('T')[0], glasses);
    res.json({ waterLogs });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar vasos de agua' });
  }
});

// 8. Estado del entrenamiento en curso (in-progress live sync)
app.post('/api/gym/inprogress', (req, res) => {
  try {
    const { user, date, state } = req.body;
    const inProgress = db.saveGymInProgress(
      user || 'Ismael',
      date || new Date().toISOString().split('T')[0],
      state
    );
    res.json({ inProgress });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar estado en curso' });
  }
});

// 9. Modo Cooperativo / Arena Gym en pareja
app.get('/api/gym/coop', (req, res) => {
  try {
    const coopSession = db.getGymCoopSession();
    res.json({ coopSession });
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar sesión coop' });
  }
});

app.post('/api/gym/coop/start', (req, res) => {
  try {
    const { user, routineName, exercises } = req.body;
    const hostUser = user || 'Ismael';
    const partnerUser = hostUser === 'Ismael' ? 'Sandra' : 'Ismael';

    let session = db.getGymCoopSession();
    if (!session || session.status === 'completed' || session.status === 'cancelled') {
      session = {
        id: 'coop-' + Date.now(),
        hostUser,
        partnerUser,
        routineName: routineName || '🔥 Sesión Co-Op en Pareja',
        status: 'waiting',
        hostConfirmed: true,
        partnerConfirmed: false,
        startedAt: new Date().toISOString(),
        exercises: (exercises || []).map((ex, idx) => ({
          idx,
          name: ex.name,
          machine: ex.machine,
          totalSets: Number(ex.sets) || 3,
          reps: ex.reps || '12',
          hostSetsDone: 0,
          partnerSetsDone: 0,
          completed: false
        })),
        currentExerciseIdx: 0,
        activeTurn: hostUser,
        cheers: []
      };
      db.setGymCoopSession(session);
    }
    res.json({ coopSession: session });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión coop' });
  }
});

app.post('/api/gym/coop/confirm', (req, res) => {
  try {
    const { user } = req.body;
    const session = db.getGymCoopSession();
    if (!session) return res.status(404).json({ error: 'No hay sesión activa' });

    if (user === session.hostUser) session.hostConfirmed = true;
    if (user === session.partnerUser) session.partnerConfirmed = true;

    if (session.hostConfirmed && session.partnerConfirmed && session.status === 'waiting') {
      session.status = 'active';
      session.activeTurn = session.hostUser;
    }
    db.setGymCoopSession(session);
    res.json({ coopSession: session });
  } catch (error) {
    res.status(500).json({ error: 'Error al confirmar sesión coop' });
  }
});

app.post('/api/gym/coop/turn', (req, res) => {
  try {
    const { user, exerciseIdx, setDetails } = req.body;
    const session = db.getGymCoopSession();
    if (!session || session.status !== 'active') return res.status(400).json({ error: 'Sesión no activa' });

    const ex = session.exercises[exerciseIdx];
    if (ex) {
      if (user === session.hostUser) ex.hostSetsDone = Math.min(ex.totalSets, ex.hostSetsDone + 1);
      if (user === session.partnerUser) ex.partnerSetsDone = Math.min(ex.totalSets, ex.partnerSetsDone + 1);

      if (ex.hostSetsDone >= ex.totalSets && ex.partnerSetsDone >= ex.totalSets) {
        ex.completed = true;
        if (exerciseIdx + 1 < session.exercises.length) {
          session.currentExerciseIdx = exerciseIdx + 1;
        } else {
          session.status = 'completed';
          session.completedAt = new Date().toISOString();
        }
      }
    }
    session.activeTurn = user === session.hostUser ? session.partnerUser : session.hostUser;
    db.setGymCoopSession(session);
    res.json({ coopSession: session });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar turno coop' });
  }
});

app.post('/api/gym/coop/cheer', (req, res) => {
  try {
    const { user, text, emoji } = req.body;
    const session = db.getGymCoopSession();
    if (!session) return res.status(404).json({ error: 'Sin sesión activa' });

    if (!session.cheers) session.cheers = [];
    session.cheers.push({
      user,
      text: text || '¡Vamos con todo!',
      emoji: emoji || '🔥',
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    });
    if (session.cheers.length > 20) session.cheers.shift();
    db.setGymCoopSession(session);
    res.json({ coopSession: session });
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar ánimo' });
  }
});

app.post('/api/gym/coop/leave', (req, res) => {
  try {
    db.clearGymCoopSession();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al salir' });
  }
});

// 10. IA: Análisis de foto de pantalla de cardio (Gemini Vision)
app.post('/api/gym/analyze-cardio-screen', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Imagen requerida' });
    }
    const apiKey = db.getGeminiKey();
    if (!apiKey) {
      return res.status(400).json({ error: 'Falta la clave de Gemini en el servidor' });
    }

    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    const mimeType = match ? match[1] : 'image/jpeg';
    const rawBase64 = match ? match[2] : imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const promptText = `Analiza esta foto de la pantalla de una máquina de cardio de gimnasio (cinta, elíptica o bicicleta).
Extrae los valores que aparecen en pantalla (por ejemplo TOTAL RUNNING TIME, RUNNING DISTANCE Km, TOTAL CALORIES, AVG RPM, AVG PULSE, MAXIMUM LEVEL).
Devuelve EXCLUSIVAMENTE un JSON válido con esta estructura:
{
  "timeStr": "20:43 min",
  "distanceKm": 3.28,
  "caloriesKcal": 115.2,
  "avgRpm": 40,
  "avgPulse": 107,
  "levelMax": 6
}
Si algún dato no aparece en pantalla, pon null en ese campo.`;

    const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
    for (const model of models) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 16000);
        const bodyPayload = {
          contents: [{
            parts: [
              { text: promptText },
              { inline_data: { mime_type: mimeType, data: rawBase64 } }
            ]
          }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
        };
        if (model.startsWith('gemini-2.5')) {
          bodyPayload.generationConfig.thinkingConfig = { thinkingBudget: 0 };
        }
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload),
            signal: controller.signal
          }
        );
        clearTimeout(timer);
        if (resp.ok) {
          const data = await resp.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
          const fb = cleaned.indexOf('{');
          const lb = cleaned.lastIndexOf('}');
          if (fb !== -1 && lb !== -1) {
            const parsed = JSON.parse(cleaned.slice(fb, lb + 1));
            return res.json({ cardioData: parsed, model });
          }
        }
      } catch (_) {}
    }
    res.status(500).json({ error: 'No se pudieron extraer datos de la pantalla de cardio' });
  } catch (error) {
    console.error('[Cardio Scan Error]', error);
    res.status(500).json({ error: 'Error al analizar la pantalla de cardio' });
  }
});

// 11. IA: Registro y desglose nutricional de comidas
app.post('/api/gym/meals', async (req, res) => {
  try {
    const { user, date, mealType, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Describe qué has comido' });
    }

    const apiKey = db.getGeminiKey();
    const gymData = db.getGymData();
    const userGoalObj = (gymData.goals && gymData.goals[user]) || {};
    const goalText = userGoalObj.goalLabel || 'Perder peso y ponerse en forma';

    let analyzed = null;

    if (apiKey) {
      const prompt = `Eres el nutricionista y entrenador personal de ${user || 'Ismael'} (Objetivo: ${goalText}).
Acaba de registrar esta comida (${mealType || 'Comida'}): "${text.trim()}".
Estima de forma realista las calorías aproximadas, gramos de proteína y dale un consejo breve, cercano y práctico de 1-2 frases.
Devuelve EXCLUSIVAMENTE un JSON válido con este formato:
{
  "calories": 550,
  "proteinG": 32,
  "score": "🟢 Muy equilibrado",
  "coachFeedback": "Buen aporte de proteína y saciante. Para la noche acompaña con verdura o algo ligero."
}
(En "score" usa solo uno de: "🟢 Muy equilibrado", "🟡 Bien (mejorable)", "🟠 Alto en calorías / Capricho").`;

      const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
      for (const model of models) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 14000);
          const bodyPayload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
          };
          if (model.startsWith('gemini-2.5')) {
            bodyPayload.generationConfig.thinkingConfig = { thinkingBudget: 0 };
          }
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bodyPayload),
              signal: controller.signal
            }
          );
          clearTimeout(timer);
          if (resp.ok) {
            const data = await resp.json();
            const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
            const fb = cleaned.indexOf('{');
            const lb = cleaned.lastIndexOf('}');
            if (fb !== -1 && lb !== -1) {
              analyzed = JSON.parse(cleaned.slice(fb, lb + 1));
              break;
            }
          }
        } catch (_) {}
      }
    }

    if (!analyzed) {
      // Estimador local inteligente si no hay Gemini
      const lower = text.toLowerCase();
      let kcal = 380;
      let prot = 18;
      if (lower.includes('pollo') || lower.includes('pavo') || lower.includes('ternera') || lower.includes('carne')) { kcal += 180; prot += 26; }
      if (lower.includes('huevo') || lower.includes('tortilla')) { kcal += 150; prot += 14; }
      if (lower.includes('atun') || lower.includes('atún') || lower.includes('pescado') || lower.includes('salmon') || lower.includes('salmón') || lower.includes('merluza')) { kcal += 170; prot += 24; }
      if (lower.includes('arroz') || lower.includes('pasta') || lower.includes('macarrones') || lower.includes('lentejas') || lower.includes('garbanzos')) { kcal += 220; prot += 8; }
      if (lower.includes('tostada') || lower.includes('pan') || lower.includes('bocadillo')) { kcal += 160; prot += 5; }
      if (lower.includes('pizza') || lower.includes('hamburguesa') || lower.includes('frito') || lower.includes('patatas fritas') || lower.includes('cerveza') || lower.includes('helado')) { kcal += 420; prot += 10; }
      if (lower.includes('ensalada') || lower.includes('verdura') || lower.includes('fruta') || lower.includes('manzana') || lower.includes('platano') || lower.includes('plátano')) { kcal += 80; prot += 2; }
      if (lower.includes('cafe') || lower.includes('café') || lower.includes('yogur') || lower.includes('leche')) { kcal += 90; prot += 6; }

      const isTreat = kcal > 780;
      const isHighProt = prot >= 28;
      analyzed = {
        calories: kcal,
        proteinG: prot,
        score: isTreat ? '🟠 Alto en calorías / Capricho' : isHighProt ? '🟢 Muy equilibrado' : '🟡 Bien (mejorable)',
        coachFeedback: isTreat
          ? '¡Disfrútalo sin culpa! Compensa en la siguiente comida con proteína limpia y verdura.'
          : isHighProt
          ? '¡Excelente elección! Buena cantidad de proteína para proteger el músculo.'
          : 'Comida correcta. Asegura siempre proteína de calidad para saciarte.'
      };
    }

    const meals = db.addGymMeal({
      user: user || 'Ismael',
      date: date || new Date().toISOString().split('T')[0],
      mealType: mealType || 'Comida',
      text: text.trim(),
      calories: analyzed.calories,
      proteinG: analyzed.proteinG,
      score: analyzed.score,
      coachFeedback: analyzed.coachFeedback
    });

    res.status(201).json({ meals, analyzed });
  } catch (error) {
    console.error('[Gym Meal Error]', error);
    res.status(500).json({ error: 'Error al registrar comida' });
  }
});

app.delete('/api/gym/meals/:id', (req, res) => {
  try {
    const meals = db.deleteGymMeal(req.params.id);
    res.json({ meals });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar comida' });
  }
});

// 12. IA: Entrenador Personal Inteligente
app.post('/api/gym/ai-coach', async (req, res) => {
  try {
    const { prompt, user, durationMin, goalLabel, customFocus } = req.body;
    const apiKey = db.getGeminiKey();
    const targetMins = Number(durationMin) || 45;
    const gymData = db.getGymData();
    const userGoalObj = (gymData.goals && gymData.goals[user]) || {};
    const activeGoalText = goalLabel || userGoalObj.goalLabel || 'Ponerse en forma, ganar fuerza y salud';
    const extraFocusText = customFocus || userGoalObj.customFocus || '';

    if (apiKey) {
      const systemPrompt = `Eres el Entrenador Personal (Personal Trainer) de ${user || 'Ismael y Sandra'} en el Gimnasio Marbella.
El objetivo elegido por ${user || 'el usuario'} es: "${activeGoalText}"${extraFocusText ? ` (Foco personal extra: "${extraFocusText}")` : ''}.
El usuario pide: "${prompt || 'Hazme una sesión adaptada a mi objetivo para hoy'}" con duración aproximada de ${targetMins} minutos.
Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura:
{
  "title": "Nombre motivador de la sesión",
  "subtitle": "Enfoque principal adaptado al objetivo del usuario",
  "duration": "${targetMins} min",
  "calories": "~350-450 kcal",
  "goal": "${activeGoalText}",
  "coachTip": "Consejo técnico y motivador de 2 frases de su entrenador personal para esta sesión",
  "exercises": [
    {
      "name": "Nombre del ejercicio",
      "machine": "Zona / Máquina recomendada",
      "sets": 3,
      "reps": "10-12",
      "weightKg": 0,
      "durationMin": 0,
      "tip": "Consejo rápido de postura, tempo o ejecución"
    }
  ]
}`;

      const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
      for (const model of models) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 18000);
          const bodyPayload = {
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { temperature: 0.4, responseMimeType: 'application/json' }
          };
          if (model.startsWith('gemini-2.5')) {
            bodyPayload.generationConfig.thinkingConfig = { thinkingBudget: 0 };
          }
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bodyPayload),
              signal: controller.signal
            }
          );
          clearTimeout(timer);
          if (resp.ok) {
            const data = await resp.json();
            const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
            const fb = cleaned.indexOf('{');
            const lb = cleaned.lastIndexOf('}');
            if (fb !== -1 && lb !== -1) {
              const parsed = JSON.parse(cleaned.slice(fb, lb + 1));
              return res.json({ routine: parsed, model });
            }
          }
        } catch (_) {}
      }
    }

    // Rutina de fallback adaptativa
    const isHard = activeGoalText.includes('Brazos') || activeGoalText.includes('Duro');
    res.json({
      routine: {
        title: isHard ? '🔥 Full Body Potente + Bombeo de Brazos' : '⚡ Circuito Fitness Marbella: Tono y Resistencia',
        subtitle: `Sesión de ${targetMins} min adaptada a ${activeGoalText}`,
        duration: `${targetMins} min`,
        calories: '~380 kcal',
        goal: activeGoalText,
        coachTip: 'Controla la bajada en 2 segundos y aprieta con fuerza arriba. Respira continuo.',
        exercises: [
          { name: 'Press de Pecho en Máquina', machine: 'Máquina de Pecho', sets: 3, reps: '12', weightKg: 25, durationMin: 0, tip: 'Espalda bien pegada al respaldo y codos a 45º.' },
          { name: 'Jalón al Pecho en Polea Alta', machine: 'Polea Alta', sets: 3, reps: '12', weightKg: 30, durationMin: 0, tip: 'Lleva la barra al pecho sacando pecho, sin balancearte.' },
          { name: 'Prensa de Piernas Sentada', machine: 'Prensa Inclinada / Placas', sets: 3, reps: '12', weightKg: 60, durationMin: 0, tip: 'Baja profundo sin despegar el glúteo y empuja con talones.' },
          { name: 'Extensión de Tríceps en Polea', machine: 'Polea Alta (Cuerda)', sets: 3, reps: '12', weightKg: 15, durationMin: 0, tip: 'Codos clavados a los costados y abre la cuerda al final.' },
          { name: 'Curl de Bíceps con Mancuernas', machine: 'Zona Mancuernas', sets: 3, reps: '12', weightKg: 10, durationMin: 0, tip: 'Gira la muñeca hacia afuera en la subida (supinación).' },
          { name: 'Plancha Abdominal o Crunch', machine: 'Colchonetas', sets: 3, reps: '40 seg', weightKg: 0, durationMin: 0, tip: 'Aprieta el ombligo hacia dentro para proteger las lumbares.' },
          { name: 'Cardio Final Quema-Grasa', machine: 'Cinta / Elíptica', sets: 1, reps: '15 min', weightKg: 0, durationMin: 15, tip: 'Ritmo continuo que te permita mantener la frecuencia alta.' }
        ]
      },
      fallback: true
    });
  } catch (error) {
    console.error('[AI Coach Error]', error);
    res.status(500).json({ error: 'Error al generar rutina con el Entrenador IA' });
  }
});

// Enrutado SPA: cualquier otra ruta entrega index.html en producción
if (fs.existsSync(distPath)) {
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`🏋️ Servidor Gym Pro / Marbella Fit activo en http://localhost:${PORT}`);
});
