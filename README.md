# Futuristic Autopilot Game

A vibrant, open-world 3D driving simulator built on the web. Experience a visually stunning endless highway inspired by Tesla's FSD visualizations and the vivid aesthetics of modern open-world racing games.

Drive a sleek autonomous vehicle along an illuminated AI guidance path while passing through procedural terrain, neon cities, and dynamic weather conditions. 

## Features

- **Dynamic Environment Controls:** Use the interactive control panel to seamlessly transition the time of day, seasons, and weather. 
- **Time of Day System:** Drive under a bright midday sun, an orange evening sunset, or a glowing neon cyberpunk night sky complete with a moon.
- **Weather Particle Engine:** Instantly summon rain, snow, heavy fog, or thunderstorms.
- **Vibrant Traffic:** Navigate through procedural traffic vehicles that spawn in a variety of vibrant colors, each accented with glowing LED strips.
- **Smooth Interpolation:** All environmental changes—from sky colors and fog density to tree foliage colors—smoothly transition over a few seconds for maximum cinematic effect.

## Tech Stack

This project is built using modern web technologies:
- **HTML5 / CSS3:** For the user interface, glassmorphism menus, and responsive design.
- **JavaScript (ES6+):** For game logic, procedural generation, and state management.
- **Three.js:** The core 3D WebGL rendering engine powering the environment, lighting, meshes, and particle systems.
- **Vite:** A blazing fast frontend build tool and development server.

## Prerequisites / Software Required

To run this project locally, you will need to have the following installed on your machine:
- **Node.js** (v16.0 or higher recommended)
- **npm** (Node Package Manager)

## How to Run Locally

1. **Clone or Download the Repository:**
   Ensure you are in the project's root folder (`car game`).

2. **Install Dependencies:**
   Open your terminal/command prompt and run:
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   Launch the game by running:
   ```bash
   npm run dev
   ```

4. **Play:**
   Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173/`).

## Controls

- **Steer Left:** `Left Arrow Key` or `A`
- **Steer Right:** `Right Arrow Key` or `D`
- **Mobile:** Swipe Left or Swipe Right on the screen to change lanes.
- **Environment:** Use the mouse or touchscreen to interact with the Control Panel on the left side to change the weather, time, and seasons.
