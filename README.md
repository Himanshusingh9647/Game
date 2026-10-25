# ChronoClimb

ChronoClimb is a real-time, room-based year trivia game for 2–8 players. Create a room, share its four-letter code or link, then race up the ten-level tower by guessing the year of each event.

## Run locally

1. Install Node.js 18 or newer.
2. In this folder, run `npm install`.
3. Run `npm start`.
4. Open [http://localhost:3000](http://localhost:3000) in a browser. To try multiplayer, open the same address in another browser or on another device on your network. For another device, use the host computer's local network address in place of `localhost`.

## Deploy to Render

This repository includes `render.yaml` for a one-service Render deployment.

1. Put the project in a GitHub repository.
2. In Render, choose **New → Blueprint** and connect that repository.
3. Review the `chronoclimb` web service and choose **Apply**.
4. Wait for the deploy to finish, then open the `.onrender.com` URL shown on the service page and share a room code or invite link.

You can also create a **Web Service** manually with the repository root as the root directory, `npm install` as the build command, and `npm start` as the start command. No environment variables or external database are required. Render's free web services may sleep when idle, so the first visit after inactivity can take a little longer.

## How a game works

- The host creates a room; 2–8 players can join from separate devices.
- The host starts once at least two players are present.
- Each round gives everyone 20 seconds to lock in a year.
- Exact year: climb 2 levels. Within 3 years: climb 1. Off by 4–10: stay put. Off by 11–24: drop 1. Off by 25 or more: drop 2. A missed answer drops 1. Players never fall below level 1.
- A five-second reveal shows guesses, distance, and movement. First to level 10 wins; if more than one player reaches it in the same reveal, the closest guess wins.

The game state lives in the server process. Rooms are in memory and are cleared if the service restarts; no player account or personal data is stored.
# Game
