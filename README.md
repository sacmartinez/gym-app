# 🏋️ Marbella Fit · Personal Trainer & Gym App

Aplicación web y PWA independiente de entrenamiento en gimnasio, rutinas guiadas, tracking de marcas personales (PRs), nutrición inteligente y modo cooperativo en pareja.

## 🚀 Inicio Rápido

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor backend:**
   ```bash
   npm run server
   ```
   *(Escuchando en http://localhost:3001)*

3. **Iniciar el frontend en modo desarrollo (Vite):**
   ```bash
   npm run dev
   ```
   *(Acceso en http://localhost:5174 con proxy automático a la API)*

4. **Compilar para producción:**
   ```bash
   npm run build
   npm start
   ```

## 📱 Características Principales

- **Registro en Vivo en el Gimnasio:** Pantalla activa sin bloqueo (Wake Lock), cronómetro de descanso sonoro con vibración, control de series, pesos y RPE.
- **Visualizador 3D / Técnica de Ejercicios:** Guía visual animada con músculos principales y secundarios de cada máquina.
- **IA Personal Trainer (Gemini Vision & Text):**
  - Escáner de pantallas de máquinas de cardio mediante foto.
  - Registro nutricional y conteo de macros por foto o descripción de comidas.
  - Generador inteligente de sesiones adaptadas a tu objetivo diario.
- **Modo Cooperativo (Gym Arena):** Entrena por turnos en vivo con tu pareja y envíale ánimos en tiempo real.
- **PWA Instalable:** Diseñada para añadirse a la pantalla de inicio del móvil como una aplicación nativa.
