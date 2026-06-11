# ✨ Digital Surprise Gift & Magic Link Experience

A premium, cinematic, web-based greeting card generator designed to create and share personalized, interactive "Magic Links" for birthdays, anniversaries, holidays, or special messages. 

This repository houses a modern React application built on **Vite**, **Framer Motion**, and **Firebase**, offering a fully responsive design, responsive particle bursts, custom audio controls, and an automated data lifecycle.

---

## 📖 Table of Contents
- [🌟 Key User Experience & Flows](#-key-user-experience--flows)
  - [1. Creator Workspace (Home Screen `/`)](#1-creator-workspace-home-screen-)
  - [2. Recipient Journey (Surprise Page `/surprise/:id`)](#2-recipient-journey-surprise-page-surpriseid)
- [🛠️ Tech Stack & Styling System](#️-tech-stack--styling-system)
- [📂 Codebase Structure](#-codebase-structure)
- [💾 Data Architecture & Schema](#-data-architecture--schema)
  - [Firestore Document Schema (`surprises` collection)](#firestore-document-schema-surprises-collection)
  - [Storage Assets Directory](#storage-assets-directory)
- [⚙️ Technical Workflows & Performance Details](#️-technical-workflows--performance-details)
  - [1. Performance-Optimized Image Handling](#1-performance-optimized-image-handling)
  - [2. File Expiration & Self-Cleaning Lifecycle (48-Hour TTL)](#2-file-expiration--self-cleaning-lifecycle-48-hour-ttl)
  - [3. Browser Audio Autoplay Workaround](#3-browser-audio-autoplay-workaround)
  - [4. Pointer-based Canvas Confetti Injection](#4-pointer-based-canvas-confetti-injection)
- [📦 Installation & Environment Setup](#-installation--environment-setup)
- [🚀 Deployment](#-deployment)

---

## 🌟 Key User Experience & Flows

### 1. Creator Workspace (Home Screen `/`)
* **Interactive Spotlight Backdrop:** A cursor-tracking mouse-trail highlight (`MouseTrail`) follows the mouse on desktop viewports. The primary form card itself (`SpotlightCard`) uses mouse coordinates to dynamically reposition a radial spotlight gradient.
* **Personalized Customization:**
  * **Recipient Name:** The primary field (required) that drives the center-stage reveal in the experience.
  * **Personal Message:** An optional multi-line text area allowing creators to write custom notes.
  * **Finale Greeting:** A single-line text input defining the climax heading (defaults to `"HAPPY BIRTHDAY! 🎂"`).
  * **Photo Attachment:** Creators can upload a picture of the recipient. The application automatically resizes and compresses it locally before transit.
  * **Audio Customization:** A drop-down menu containing preloaded soundtracks (`Happy Birthday Song.mp3`, `happy birthday slowed.mp3`, `anniversary.mp3`, `happy christmas.mp3`, `romantic.mp3`, `pianocafe.mp3`, `funky groovin.mp3`, `playhouse.mp3`) or an option to upload a custom MP3 (max 20MB).
  * **Audio Preview Controller:** Creators can toggle a play/pause preview button to listen to the chosen track directly on the home page.
* **"Brewing Magic" Loading Sequence:** When clicking *Generate*, the UI replaces standard form controls with a progress screen displaying randomized, whimsical loading status lines (e.g., `"Compressing pixels to pure love..."`, `"Baking the digital cake..."`, `"Dividing 0 by eternity..."`) to enhance user engagement.
* **Success Dashboard:** Once saved, the UI reveals a dedicated success card showing the generated link, a one-click copy button, a preview option, and a reset button to create another card.

---

### 2. Recipient Journey (Surprise Page `/surprise/:id`)
The surprise page is a cinematic narrative split into **6 chronological scenes** that orchestrate a storytelling arc:
* **Scene 0 (The Gatekeeper):** Displays an elegant `"Open Your Gift"` button. This serves as the necessary user-interaction hook required to bypass browser autoplay blocks for audio.
* **Scene 1 (The Preface):** Fades in a soft, blurred intro: *"Someone created something truly special for you..."*
* **Scene 2 (The Name Reveal):** A high-impact name reveal displaying `Dear [Name]` using an HSL gold metallic gradient (`text-gradient-gold`) against a purple-pink radial glow.
* **Scene 3 (The Personal Letter):** Renders the custom message word-by-word with a typewriter fade-in effect (`staggerChildren` in Framer Motion). Once the text rendering completes, a glowing `"Continue Magic"` button transitions the user.
* **Scene 4 (The Interactive Heart):** Features a beating neon heart graphic centered within concentric rotating orbital borders (using customized CSS keyframe spins). The recipient is prompted to *"Tap or click for magic"*. Each interaction fires confetti bursts (`canvas-confetti`) at the exact pointer coordinates. This scene runs for 7 seconds before auto-advancing.
* **Scene 5 (The Finale Climax):** The experience culminates in:
  * A spring-bounced, rounded image entry showing the uploaded photo.
  * The custom finale message (e.g., `"HAPPY BIRTHDAY! 🎂"`) surrounded by rotating glowing halo rings.
  * Continuous, double-sided stream fountains of confetti shooting from the left and right corners of the screen.
  * Action controls to copy, share (using the Web Share API on mobile), replay the experience, or create a new magic link.

---

## 🛠️ Tech Stack & Styling System

* **Frontend Engine:** React 18, Vite (TypeScript configuration)
* **Routing:** React Router DOM v6
* **State Management:** React hooks (`useState`, `useEffect`, `useRef`)
* **Motion & Physics:**
  * **Animations:** Framer Motion (`AnimatePresence` for scene transitions, spring physics for photo reveals).
  * **Particle Effects:** `canvas-confetti` for pointer triggers and finale cascades.
* **Storage & Database:** Firebase v10+ (Cloud Firestore for database records, Cloud Storage for media assets).
* **Styling Foundation:** Tailwind CSS, PostCSS.
  * **Glassmorphism:** Styled via custom `.glass` & `.premium-glass-card` classes incorporating `backdrop-filter: blur(12px)` and subtle white inner borders (`rgba(255,255,255,0.08)`).
  * **Gold Gradients:** A linear gradient text mask (`#bf953f`, `#fcf6ba`, `#b38728`, `#fbf5b7`, `#aa771c`) for the gold name reveal.
  * **Performance Orbitals:** Smooth rotation utility classes (`.animate-spin-clockwise`, `.animate-spin-counter-clockwise`) that leverage hardware acceleration (`will-change: transform`).

---

## 📂 Codebase Structure

```
Birthday-wisher/
├── public/                 # Static assets (preloaded MP3 tracks & background MP4)
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx        # Framer Motion animated glass button
│   │   │   └── GlassCard.tsx     # Reusable glassmorphic layout container
│   │   ├── effects/
│   │   │   ├── MouseTrail.tsx    # Desktop-exclusive cursor radial glow
│   │   │   └── PinkSparkles.tsx  # Unreferenced HTML Canvas fallback particle engine
│   │   ├── SpotlightCard.tsx     # Form wrapper tracking mouse coordinates
│   │   └── SpotlightCard.css     # CSS custom properties for form lighting
│   ├── lib/
│   │   ├── db.ts                 # Firestore & Firebase Storage write/read/TTL controller
│   │   ├── firebase.ts           # Firebase SDK instantiation and config exports
│   │   └── utils.ts              # Tailwind merger helper class (`cn`)
│   ├── pages/
│   │   ├── Home.tsx              # Form workspace and link generator
│   │   └── Surprise.tsx          # Recipient's multi-scene animated player
│   ├── App.tsx                   # Background video, overlays, and Route registration
│   ├── main.tsx                  # Root renderer
│   └── index.css                 # Custom tailwind configurations, keyframes & animations
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration with compiler aliases
└── vercel.json             # Vercel routing fallback configuration
```

---

## 💾 Data Architecture & Schema

The application stores data in Firebase. Custom uploads (such as audio files) are written to Firebase Storage, while core parameters are logged in a Firestore document under the `surprises` collection.

### Firestore Document Schema (`surprises` collection)
The document path is key-mapped to a unique 8-character generated alphanumeric ID (`short_id`), e.g., `/surprises/k8s9p2w1`.

```typescript
type SurpriseData = {
  short_id: string;      // The unique 8-character ID matching the Firestore Doc ID
  name: string;          // Recipient name text string
  message: string;       // JSON-serialized string containing string configurations:
                         // {
                         //   "body": "Your optional personal letter content",
                         //   "finaleText": "HAPPY BIRTHDAY! 🎂 (or custom finale text)",
                         //   "selectedMusic": "/Happy Birthday Song.mp3 (preloaded path if selected)"
                         // }
  image_path?: string;   // Firebase Storage download URL for the compressed JPEG photo
  music_path?: string;   // Firebase Storage download URL for custom MP3 uploads
  created_at: string;    // ISO string timestamp representing exact generation time
}
```

### Storage Assets Directory
Stored files reside under:
* `surprises/{short_id}_music.mp3` - User-uploaded custom soundtrack files.

---

## ⚙️ Technical Workflows & Performance Details

### 1. Performance-Optimized Image Handling
Storing high-resolution photos in Firestore or Storage can hurt load times and exceed free-tier quotas. In [Home.tsx](file:///d:/WORK/Birthday-wisher--main/src/pages/Home.tsx), uploaded images undergo client-side compression:
1. The file is read via a `FileReader` as a Base64 string.
2. It's loaded into a virtual HTML `Image` object.
3. Canvas resizing constraints keep the image aspect ratio while capping the maximum width and height at `600px`.
4. The canvas is drawn to a JPEG image with `0.6` quality (`toDataURL('image/jpeg', 0.6)`).
5. If the resulting file is below `700KB`, it's stored and uploaded, ensuring extremely fast recipient load times.

### 2. File Expiration & Self-Cleaning Lifecycle (48-Hour TTL)
To keep Firebase database usage within free limits, [db.ts](file:///d:/WORK/Birthday-wisher--main/src/lib/db.ts) enforces a strict **48-hour expiration** rule at the database level.
* When a recipient navigates to `/surprise/:id`, the application pulls the document from Firestore.
* It compares the `created_at` timestamp with the current time.
* If the difference exceeds `48 hours` (172,800,000 ms), the document is marked as expired, a background `deleteDoc` request is sent to Firestore, and the application returns `null` (rendering a 404 page).
* This provides self-cleaning data lifecycle maintenance without requiring external cron jobs or Cloud Functions.

### 3. Browser Audio Autoplay Workaround
Modern web browsers (Chrome, Safari, iOS WebKit) prevent audio from playing automatically without an explicit user gesture (`pointerdown`, `click`).
* [Surprise.tsx](file:///d:/WORK/Birthday-wisher--main/src/pages/Surprise.tsx) resolves this by placing the entire experience behind **Scene 0**.
* Recipients must click the `"Open Your Gift"` button, which acts as the user gesture.
* The button's event handler instantiates the `HTMLAudioElement` object, triggers the `.play()` method, and updates the state to transition to **Scene 1**, ensuring seamless music playback.

### 4. Pointer-based Canvas Confetti Injection
For Scene 4 (Interactive Heart), the application reads pointer locations to inject interactive confetti:
```typescript
const handlePointerDown = (e: React.PointerEvent) => {
  confetti({
    particleCount: 20,
    spread: 70,
    origin: { 
      x: e.clientX / window.innerWidth, 
      y: e.clientY / window.innerHeight 
    },
    colors: ['#a855f7', '#ec4899', '#eab308', '#ffffff']
  });
};
```
This maps screen-space coordinate pixels directly to fractional `x` and `y` coordinates (`0.0` to `1.0`) required by the canvas-confetti library, making the sparkles erupt exactly under the user's finger or cursor.

---

## 📦 Installation & Environment Setup

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed.

### 2. Clone and Install
```bash
git clone https://github.com/Khangulamgousamjat/Birthday-wisher-.git
cd Birthday-wisher-
npm install
```

### 3. Firebase Set Up
You need a Firebase project with **Cloud Firestore** and **Firebase Storage** enabled.
* Set Firestore security rules to allow read/write access to the `surprises` collection.
* Set Storage security rules to allow read/write access to the `surprises` path.

### 4. Environment Variables
Create a `.env` file in the root directory and paste your Firebase configuration keys:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 5. Running Locally
Run the development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🚀 Deployment

The project is configured for deployment on [Vercel](https://vercel.com).
* The routing configuration in [vercel.json](file:///d:/WORK/Birthday-wisher--main/vercel.json) ensures that client-side routing is preserved, routing all incoming paths back to `index.html` to prevent 404 errors on `/surprise/:id` paths:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
* Connect your GitHub repository to Vercel, import the environment variables in the project settings, and click **Deploy**.

