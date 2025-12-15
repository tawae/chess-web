# Modern Chess Web Application

A fully featured, responsive Chess application built with React and Vite. This project offers multiple game modes including local PvP, matches against a Stockfish-powered AI, and real-time online multiplayer synchronization using Firebase.

## Project Status

**Status:** Development
**License:** MIT

## Key Features

* **Multiple Game Modes:**
    * **Local PvP (Hotseat):** Play against a friend on the same device.
    * **Play vs AI:** Challenge the computer using the **Stockfish.js** engine.
        * Features adjustable difficulty levels: Easy, Normal, and Hard.
    * **Online PvP:** Real-time multiplayer synchronized via Firebase Realtime Database.
        * Create and join private rooms using unique 6-character codes.

* **Game Utilities:**
    * **Chess Timer:** Supports both **Total Time** per player (in minutes) and **Time per Move** (in seconds).
    * **Move History:** Displays a sequential log of moves in algebraic notation.
    * **Pause Functionality:** Allows pausing and resuming local and AI games.

* **Authentication and User System:**
    * Secure user authentication managed by **Firebase Auth**.
    * Supports Email/Password login/registration.
    * Social sign-in options including Google, Facebook, and GitHub.

## Tech Stack

| Category | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React | Version 19.1.0 |
| **Build Tool** | Vite | Version 6.3.5 |
| **Chess Logic**| chess.js | Core logic library |
| **Board UI** | react-chessboard | Frontend board component |
| **AI Engine** | Stockfish.js | Simplified chess engine running in a Web Worker |
| **Backend/DB** | Firebase | Realtime Database for online game state and Auth |
| **Routing** | React Router DOM | Version 6.30.0 |

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js (v18 or higher recommended)
* npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/chess-web.git](https://github.com/your-username/chess-web.git)
    cd chess-web
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Firebase Configuration:**
    The application requires a Firebase project for authentication and online features.

    * Create a project in the Firebase Console.
    * Enable Firebase Auth and the Realtime Database.
    * Update the configuration in `src/firebase.jsx` with your project keys:
        ```javascript
        // src/firebase.jsx (Example keys, replace with your actual values)
        const firebaseConfig = {
          apiKey: "AIzaSyDZMt_JcnVYeoOyp6lhM210HtNEnYhYLNQ",
          authDomain: "chess-e60ba.firebaseapp.com",
          projectId: "chess-e60ba",
          databaseURL: "[https://chess-e60ba-default-rtdb.firebaseio.com/](https://chess-e60ba-default-rtdb.firebaseio.com/)"
          // ... rest of your config
        };
        ```

### Running the Application

To start the development server:

```bash
npm run dev
