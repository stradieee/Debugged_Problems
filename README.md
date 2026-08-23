# Debugged_Problems

Prototype: daily AoPS-style problem site (Express + React) with answer verification and solution reveal after submission.

This repository contains a simple Express backend and a React frontend. The backend serves a daily problem from server/problems.json and verifies submitted answers. The solution is only returned after you submit an answer (recorded in your session).

## Quick start

Requirements: Node 16+ and npm.

Server
1. cd server
2. npm install
3. npm start

This starts the server on http://localhost:4000

Client (create-react-app)
1. cd client
2. npm install
3. npm start

This starts the client on http://localhost:3000 and the client expects the server at http://localhost:4000

## Notes
- Sessions are stored in memory. For production, use a persistent session store (Redis, database).
- The problems are in `server/problems.json`. You can add AoPS-style problems manually. Be mindful of AoPS terms before scraping or automatically fetching content from their site.
- Verification modes supported: exact, regex, numeric (with tolerance), symbolic (uses mathjs simplify).

## Files
- server/index.js - Express server
- server/problems.json - sample problems
- client/src - React frontend

