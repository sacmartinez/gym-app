import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'gym-db.json');

const defaultData = {
  gymWorkouts: [],
  gymBodyWeights: [],
  gymGoals: {
    Ismael: {
      targetDaysPerWeek: 4,
      targetWeightKg: null,
      goalType: 'brazos_abs_grasa',
      goalLabel: '🔥💪🍫 Perder Grasa + Brazos y Tableta de Chocolate',
      customFocus: 'Perder peso, muscular brazos (bíceps/tríceps/hombros) y marcar tableta de abdominales con entreno duro',
      level: 'Duro / Progresivo'
    },
    Sandra: {
      targetDaysPerWeek: 3,
      targetWeightKg: null,
      goalType: 'tonificar',
      goalLabel: '⚡ Tonificar y Ponerse en Forma',
      customFocus: '',
      level: 'Adaptación / Progresivo'
    }
  },
  gymCustomRoutines: [],
  gymCoopSession: null,
  gymMeals: [],
  gymWaterLogs: {},
  gymInProgress: {},
  geminiApiKey: ''
};

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf8');
      return JSON.parse(JSON.stringify(defaultData));
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultData, ...parsed };
  } catch (err) {
    console.error('[Gym DB Read Error]', err);
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Gym DB Write Error]', err);
  }
}

// Helper para fecha en zona horaria Madrid
const getMadridDateStr = (daysOffset = 0) => {
  const d = new Date(Date.now() + daysOffset * 86400000);
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch (_) {
    return d.toISOString().split('T')[0];
  }
};

export const db = {
  getGeminiKey: () => {
    const data = readDB();
    return process.env.GEMINI_API_KEY || data.geminiApiKey || '';
  },
  setGeminiKey: (key) => {
    const data = readDB();
    data.geminiApiKey = key ? key.trim() : '';
    writeDB(data);
    return !!data.geminiApiKey;
  },

  getGymData: () => {
    const data = readDB();
    const defaultIsmael = {
      goalType: 'brazos_abs_grasa',
      goalLabel: '🔥💪🍫 Perder Grasa + Brazos y Tableta de Chocolate',
      customFocus: 'Perder peso, muscular brazos (bíceps/tríceps/hombros) y marcar tableta de abdominales con entreno duro',
      level: 'Duro / Progresivo',
      targetDaysPerWeek: 4,
      targetWeightKg: null
    };
    const defaultSandra = {
      goalType: 'tonificar',
      goalLabel: '⚡ Tonificar y Ponerse en Forma',
      customFocus: '',
      level: 'Adaptación / Progresivo',
      targetDaysPerWeek: 3,
      targetWeightKg: null
    };

    if (!data.gymWorkouts) data.gymWorkouts = [];

    // Semilla dinámica inicial si no hay entrenamientos
    if (!data.gymSeededDynamicV2) {
      const realToday = getMadridDateStr(0);
      const realYesterday = getMadridDateStr(-1);

      data.gymWorkouts = data.gymWorkouts.filter(
        w => !(w.id && String(w.id).startsWith('seed-') && String(w.date).startsWith('2026-11-'))
      );

      const hasGymRecent = data.gymWorkouts.some(
        w => w.user === 'Ismael' && w.type !== 'home' && (w.date === realYesterday || w.date === realToday)
      );
      if (!hasGymRecent) {
        data.gymWorkouts.push({
          id: 'seed-gym-ismael-' + realYesterday,
          user: 'Ismael',
          type: 'gym',
          routineId: 'dia-1',
          date: realYesterday,
          routineName: '🔥💪 Día 1: Pecho, Espalda, Bombeo de Brazos + Tableta + Cardio',
          category: 'Gimnasio Marbella',
          durationMin: 55,
          caloriesBurned: 367,
          totalVolumeKg: 4860,
          feeling: '💪 Muy bien',
          notes: 'Sesión completada en Gimnasio Marbella + Cardio 20:43 (3.28 Km · 115.2 kcal · Nivel 6)',
          exercises: [
            { name: 'Press de Pecho Sentado', machine: 'Máquina de Pecho', sets: 4, reps: '12', weightKg: 30, isCardio: false, nextAction: 'mejorar', completed: true, setDetails: [] },
            { name: 'Jalón al Pecho en Polea Alta', machine: 'Polea Alta (Espalda en V)', sets: 4, reps: '12', weightKg: 35, isCardio: false, nextAction: 'mejorar', completed: true, setDetails: [] },
            { name: 'Curl de Bíceps en Polea Baja o Mancuernas', machine: 'Polea Baja / Mancuernas', sets: 4, reps: '12', weightKg: 12, isCardio: false, nextAction: 'mejorar', completed: true, setDetails: [] },
            { name: 'Extensión de Tríceps con Cuerda en Polea', machine: 'Estación de Poleas', sets: 4, reps: '12', weightKg: 17.5, isCardio: false, nextAction: 'mejorar', completed: true, setDetails: [] },
            { name: 'Crunch Abdominal con Peso en Polea / Máquina', machine: 'Polea Alta / Máquina Abs', sets: 4, reps: '15', weightKg: 25, isCardio: false, nextAction: 'mejorar', completed: true, setDetails: [] },
            { name: 'Plancha Abdominal Dura (Core de Acero)', machine: 'Zona Colchonetas', sets: 3, reps: '45 seg', weightKg: 0, isCardio: true, nextAction: 'mejorar', completed: true, setDetails: [] },
            { name: 'Cardio Quema-Grasa (Elíptica / Cinta / Bici)', machine: 'Zona Cardio (Pantalla)', sets: 1, reps: '20:43', weightKg: 0, isCardio: true, distanceKm: 3.28, caloriesKcal: 115.2, levelMax: 6, avgPulse: 107, avgRpm: 40, nextAction: 'mejorar', completed: true, setDetails: [] }
          ],
          createdAt: new Date(Date.now() - 86400000).toISOString()
        });
      }

      data.gymSeededDynamicV2 = true;
      data.gymWorkouts.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
      writeDB(data);
    }

    const goals = data.gymGoals || {};
    return {
      workouts: data.gymWorkouts || [],
      bodyWeights: data.gymBodyWeights || [],
      meals: data.gymMeals || [],
      waterLogs: data.gymWaterLogs || {},
      inProgress: data.gymInProgress || {},
      goals: {
        Ismael: { ...defaultIsmael, ...(goals.Ismael || {}) },
        Sandra: { ...defaultSandra, ...(goals.Sandra || {}) }
      },
      customRoutines: data.gymCustomRoutines || [],
      coopSession: data.gymCoopSession || null
    };
  },

  saveGymInProgress: (user, date, stateObj) => {
    const data = readDB();
    if (!data.gymInProgress) data.gymInProgress = {};
    const key = `${user}_${date}`;
    const prev = data.gymInProgress[key] || {};
    data.gymInProgress[key] = {
      ...prev,
      ...(stateObj || {}),
      byRoutine: {
        ...(prev.byRoutine || {}),
        ...((stateObj && stateObj.byRoutine) || {})
      },
      homeCheckedByRoutine: {
        ...(prev.homeCheckedByRoutine || {}),
        ...((stateObj && stateObj.homeCheckedByRoutine) || {})
      },
      updatedAt: new Date().toISOString()
    };
    writeDB(data);
    return data.gymInProgress;
  },

  clearGymInProgress: (user, date) => {
    const data = readDB();
    if (!data.gymInProgress) data.gymInProgress = {};
    const key = `${user}_${date}`;
    delete data.gymInProgress[key];
    writeDB(data);
    return data.gymInProgress;
  },

  addGymWorkout: (workout) => {
    const data = readDB();
    if (!data.gymWorkouts) data.gymWorkouts = [];
    const exercises = Array.isArray(workout.exercises) ? workout.exercises.map(ex => {
      const setDetails = Array.isArray(ex.setDetails) ? ex.setDetails.map(s => ({
        reps: String(s.reps ?? ex.reps ?? '12'),
        weightKg: s.weightKg !== undefined && s.weightKg !== '' ? Number(s.weightKg) : 0,
        done: s.done !== false
      })) : [];
      return {
        name: (ex.name || '').trim(),
        machine: (ex.machine || '').trim(),
        sets: setDetails.length > 0 ? setDetails.length : (Number(ex.sets) || 3),
        reps: String(ex.reps || '12'),
        weightKg: ex.weightKg !== undefined && ex.weightKg !== '' ? Number(ex.weightKg) : 0,
        durationMin: ex.durationMin !== undefined && ex.durationMin !== '' ? Number(ex.durationMin) : 0,
        isCardio: !!ex.isCardio,
        nextAction: ex.nextAction || 'mantener',
        distanceKm: ex.distanceKm !== undefined && ex.distanceKm !== '' && ex.distanceKm !== null ? Number(ex.distanceKm) : null,
        caloriesKcal: ex.caloriesKcal !== undefined && ex.caloriesKcal !== '' && ex.caloriesKcal !== null ? Number(ex.caloriesKcal) : null,
        levelMax: ex.levelMax !== undefined && ex.levelMax !== '' && ex.levelMax !== null ? Number(ex.levelMax) : null,
        avgPulse: ex.avgPulse !== undefined && ex.avgPulse !== '' && ex.avgPulse !== null ? Number(ex.avgPulse) : null,
        avgRpm: ex.avgRpm !== undefined && ex.avgRpm !== '' && ex.avgRpm !== null ? Number(ex.avgRpm) : null,
        completed: ex.completed !== false,
        setDetails
      };
    }) : [];

    const totalVolumeKg = exercises.reduce((sum, ex) => {
      if (ex.completed === false) return sum;
      if (Array.isArray(ex.setDetails) && ex.setDetails.length > 0) {
        return sum + ex.setDetails.reduce((sSum, s) => {
          if (!s.done) return sSum;
          const r = parseInt(String(s.reps), 10) || 0;
          const w = Number(s.weightKg) || 0;
          return sSum + (r * w);
        }, 0);
      }
      const setsNum = Number(ex.sets) || 0;
      const repsNum = parseInt(String(ex.reps), 10) || 0;
      const weightNum = Number(ex.weightKg) || 0;
      return sum + (setsNum * repsNum * weightNum);
    }, 0);

    const workoutDate = workout.date || new Date().toISOString().split('T')[0];
    const workoutUser = workout.user || 'Ismael';
    const workoutType = workout.type || 'gym';

    if (workoutType === 'gym') {
      data.gymWorkouts = data.gymWorkouts.filter(w => !(w.user === workoutUser && w.type !== 'home' && w.date === workoutDate));
    } else if (workoutType === 'home' && workout.routineId) {
      data.gymWorkouts = data.gymWorkouts.filter(w => !(w.user === workoutUser && w.type === 'home' && w.date === workoutDate && w.routineId === workout.routineId));
    }

    const newWorkout = {
      id: Date.now().toString() + '-' + Math.floor(Math.random() * 10000),
      user: workoutUser,
      type: workoutType,
      routineId: workout.routineId || null,
      date: workoutDate,
      routineName: (workout.routineName || 'Entrenamiento en Gimnasio Marbella').trim(),
      category: workout.category || 'General',
      durationMin: Number(workout.durationMin) || 45,
      caloriesBurned: Number(workout.caloriesBurned) || 300,
      totalVolumeKg: Math.round(totalVolumeKg),
      feeling: workout.feeling || '💪 Muy bien',
      notes: (workout.notes || '').trim(),
      exercises,
      createdAt: new Date().toISOString()
    };
    data.gymWorkouts.unshift(newWorkout);
    data.gymWorkouts.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));

    if (workoutType === 'gym' && data.gymInProgress) {
      delete data.gymInProgress[`${workoutUser}_${workoutDate}`];
    }

    writeDB(data);
    return data.gymWorkouts;
  },

  deleteGymWorkout: (id) => {
    const data = readDB();
    if (!data.gymWorkouts) return [];
    data.gymWorkouts = data.gymWorkouts.filter(w => w.id !== id);
    writeDB(data);
    return data.gymWorkouts;
  },

  addGymBodyWeight: (entry) => {
    const data = readDB();
    if (!data.gymBodyWeights) data.gymBodyWeights = [];
    const weightNum = parseFloat(String(entry.weightKg).replace(',', '.'));
    if (isNaN(weightNum) || weightNum <= 0) return data.gymBodyWeights;

    const newEntry = {
      id: Date.now().toString() + '-' + Math.floor(Math.random() * 10000),
      user: entry.user || 'Ismael',
      date: entry.date || new Date().toISOString().split('T')[0],
      weightKg: Number(weightNum.toFixed(1)),
      note: (entry.note || '').trim(),
      createdAt: new Date().toISOString()
    };
    data.gymBodyWeights.unshift(newEntry);
    data.gymBodyWeights.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    writeDB(data);
    return data.gymBodyWeights;
  },

  deleteGymBodyWeight: (id) => {
    const data = readDB();
    if (!data.gymBodyWeights) return [];
    data.gymBodyWeights = data.gymBodyWeights.filter(w => w.id !== id);
    writeDB(data);
    return data.gymBodyWeights;
  },

  updateGymGoal: (user, goalData) => {
    const data = readDB();
    if (!data.gymGoals) {
      data.gymGoals = {
        Ismael: { targetDaysPerWeek: 4, targetWeightKg: null, goalType: 'brazos_abs_grasa', goalLabel: '🔥💪🍫 Perder Grasa + Brazos y Tableta de Chocolate', customFocus: '', level: 'Duro / Progresivo' },
        Sandra: { targetDaysPerWeek: 3, targetWeightKg: null, goalType: 'tonificar', goalLabel: '⚡ Tonificar y Ponerse en Forma', customFocus: '', level: 'Adaptación / Progresivo' }
      };
    }
    if (!data.gymGoals[user]) {
      data.gymGoals[user] = { targetDaysPerWeek: 3, targetWeightKg: null, goalType: 'tonificar', goalLabel: '⚡ Tonificar y Ponerse en Forma', customFocus: '', level: 'Adaptación / Progresivo' };
    }
    if (goalData.targetDaysPerWeek !== undefined) {
      data.gymGoals[user].targetDaysPerWeek = Number(goalData.targetDaysPerWeek) || 3;
    }
    if (goalData.targetWeightKg !== undefined) {
      const w = parseFloat(String(goalData.targetWeightKg).replace(',', '.'));
      data.gymGoals[user].targetWeightKg = (!isNaN(w) && w > 0) ? Number(w.toFixed(1)) : null;
    }
    if (goalData.goalType !== undefined) {
      data.gymGoals[user].goalType = goalData.goalType;
    }
    if (goalData.goalLabel !== undefined) {
      data.gymGoals[user].goalLabel = goalData.goalLabel;
    }
    if (goalData.customFocus !== undefined) {
      data.gymGoals[user].customFocus = String(goalData.customFocus).trim();
    }
    if (goalData.level !== undefined) {
      data.gymGoals[user].level = goalData.level;
    }
    writeDB(data);
    return db.getGymData().goals;
  },

  saveCustomGymRoutine: (routine) => {
    const data = readDB();
    if (!data.gymCustomRoutines) data.gymCustomRoutines = [];
    const newRoutine = {
      id: 'custom-' + Date.now().toString(),
      title: (routine.title || 'Rutina Personalizada').trim(),
      subtitle: (routine.subtitle || 'Creada por tu Personal Trainer').trim(),
      duration: routine.duration || '45-55 min',
      calories: routine.calories || '~350-450 kcal',
      goal: routine.goal || 'Quema de grasa y tonificación',
      coachTip: routine.coachTip || 'Mantén descansos de 60-75 segundos entre series para mantener las pulsaciones activas.',
      exercises: Array.isArray(routine.exercises) ? routine.exercises : [],
      createdBy: routine.createdBy || 'Entrenador IA',
      createdAt: new Date().toISOString()
    };
    data.gymCustomRoutines.unshift(newRoutine);
    writeDB(data);
    return data.gymCustomRoutines;
  },

  deleteCustomGymRoutine: (id) => {
    const data = readDB();
    if (!data.gymCustomRoutines) return [];
    data.gymCustomRoutines = data.gymCustomRoutines.filter(r => r.id !== id);
    writeDB(data);
    return data.gymCustomRoutines;
  },

  getGymCoopSession: () => {
    const data = readDB();
    return data.gymCoopSession || null;
  },

  setGymCoopSession: (session) => {
    const data = readDB();
    data.gymCoopSession = session;
    writeDB(data);
    return data.gymCoopSession;
  },

  clearGymCoopSession: () => {
    const data = readDB();
    data.gymCoopSession = null;
    writeDB(data);
    return null;
  },

  addGymMeal: (meal) => {
    const data = readDB();
    if (!data.gymMeals) data.gymMeals = [];
    const newMeal = {
      id: Date.now().toString() + '-' + Math.floor(Math.random() * 10000),
      user: meal.user || 'Ismael',
      date: meal.date || new Date().toISOString().split('T')[0],
      mealType: meal.mealType || 'Comida del día',
      text: (meal.text || '').trim(),
      calories: Number(meal.calories) || 0,
      proteinG: Number(meal.proteinG) || 0,
      score: meal.score || '🟢 Equilibrado',
      coachFeedback: (meal.coachFeedback || '').trim(),
      createdAt: new Date().toISOString()
    };
    data.gymMeals.unshift(newMeal);
    writeDB(data);
    return data.gymMeals;
  },

  deleteGymMeal: (id) => {
    const data = readDB();
    if (!data.gymMeals) return [];
    data.gymMeals = data.gymMeals.filter(m => m.id !== id);
    writeDB(data);
    return data.gymMeals;
  },

  updateGymWater: (user, date, glasses) => {
    const data = readDB();
    if (!data.gymWaterLogs) data.gymWaterLogs = {};
    const key = `${user}_${date}`;
    data.gymWaterLogs[key] = Math.max(0, Number(glasses) || 0);
    writeDB(data);
    return data.gymWaterLogs;
  }
};
