'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const ROUND_MS = 20_000;
const REVEAL_MS = 5_000;
const MAX_PLAYERS = 8;

app.use(express.static(path.join(__dirname, 'public')));
app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));

const PROMPTS = [
  { event: 'The first powered flight by the Wright brothers', year: 1903, category: 'INVENTION' },
  { event: 'The Titanic makes its maiden voyage', year: 1912, category: 'HISTORY' },
  { event: 'The first commercial radio broadcast in the United States', year: 1920, category: 'CULTURE' },
  { event: 'The first Mickey Mouse cartoon with synchronized sound premieres', year: 1928, category: 'CULTURE' },
  { event: 'Amelia Earhart becomes the first woman to fly solo across the Atlantic', year: 1932, category: 'HISTORY' },
  { event: 'The first regular television service begins in Germany', year: 1935, category: 'INVENTION' },
  { event: 'The first modern computer, the Zuse Z3, is completed', year: 1941, category: 'INVENTION' },
  { event: 'The United Nations is founded', year: 1945, category: 'HISTORY' },
  { event: 'India becomes an independent nation', year: 1947, category: 'HISTORY' },
  { event: 'The first issue of LIFE magazine is published', year: 1936, category: 'CULTURE' },
  { event: 'The first passenger jet airliner enters commercial service', year: 1952, category: 'INVENTION' },
  { event: 'Elvis Presley releases his first single, “That’s All Right”', year: 1954, category: 'CULTURE' },
  { event: 'The first artificial satellite, Sputnik 1, is launched', year: 1957, category: 'SPACE' },
  { event: 'NASA is established', year: 1958, category: 'SPACE' },
  { event: 'The first episode of The Flintstones airs', year: 1960, category: 'CULTURE' },
  { event: 'The first human travels into space: Yuri Gagarin', year: 1961, category: 'SPACE' },
  { event: 'The Beatles release their first single, “Love Me Do”', year: 1962, category: 'CULTURE' },
  { event: 'Martin Luther King Jr. delivers the “I Have a Dream” speech', year: 1963, category: 'HISTORY' },
  { event: 'The first episode of Doctor Who airs', year: 1963, category: 'CULTURE' },
  { event: 'The first handheld calculator is introduced', year: 1967, category: 'INVENTION' },
  { event: 'Apollo 11 lands the first humans on the Moon', year: 1969, category: 'SPACE' },
  { event: 'The first Earth Day is celebrated', year: 1970, category: 'HISTORY' },
  { event: 'The first email is sent over ARPANET', year: 1971, category: 'INVENTION' },
  { event: 'The first handheld mobile phone call is made', year: 1973, category: 'INVENTION' },
  { event: 'The first Star Wars film opens in theaters', year: 1977, category: 'CULTURE' },
  { event: 'The first Pac-Man arcade game is released', year: 1980, category: 'CULTURE' },
  { event: 'The first Space Shuttle launches', year: 1981, category: 'SPACE' },
  { event: 'Michael Jackson releases Thriller', year: 1982, category: 'CULTURE' },
  { event: 'The first Apple Macintosh goes on sale', year: 1984, category: 'INVENTION' },
  { event: 'The first version of Microsoft Windows is released', year: 1985, category: 'INVENTION' },
  { event: 'The Berlin Wall opens', year: 1989, category: 'HISTORY' },
  { event: 'The World Wide Web is made available to the public', year: 1991, category: 'INVENTION' },
  { event: 'The first text message is sent', year: 1992, category: 'INVENTION' },
  { event: 'The first PlayStation launches in Japan', year: 1994, category: 'CULTURE' },
  { event: 'The first Harry Potter book is published', year: 1997, category: 'CULTURE' },
  { event: 'Google is founded', year: 1998, category: 'INVENTION' },
  { event: 'The first Wikipedia article is created', year: 2001, category: 'INVENTION' },
  { event: 'The first iPhone is released', year: 2007, category: 'INVENTION' },
  { event: 'The first feature-length film made with motion capture, Avatar, opens', year: 2009, category: 'CULTURE' },
  { event: 'The Higgs boson discovery is announced at CERN', year: 2012, category: 'SCIENCE' },
  { event: 'The first image of a black hole is revealed', year: 2019, category: 'SCIENCE' },
  { event: 'NASA’s Perseverance rover lands on Mars', year: 2021, category: 'SPACE' },
  { event: 'The James Webb Space Telescope releases its first full-color images', year: 2022, category: 'SPACE' },
  { event: 'The first iPad is released', year: 2010, category: 'INVENTION' },
  { event: 'The first episode of The Simpsons airs as a standalone series', year: 1989, category: 'CULTURE' },
  { event: 'The first World Wide Web browser is released', year: 1993, category: 'INVENTION' },
  { event: 'The first modern Olympic Games open in Athens', year: 1896, category: 'SPORT' },
  { event: 'The first FIFA World Cup final is played', year: 1930, category: 'SPORT' },
  { event: 'The first Super Bowl is played', year: 1967, category: 'SPORT' },
  { event: 'The first video uploaded to YouTube is posted', year: 2005, category: 'CULTURE' },
  { event: 'The first successful cloning of a mammal, Dolly the sheep, is announced', year: 1997, category: 'SCIENCE' },
  { event: 'The first modern credit card is introduced by Diners Club', year: 1950, category: 'INVENTION' },
  { event: 'The first episode of Sesame Street airs', year: 1969, category: 'CULTURE' },
  { event: 'The first commercial CD player goes on sale', year: 1982, category: 'INVENTION' }
];

const rooms = new Map();

function cleanName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 18);
}

function makeCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function publicRoom(room) {
  const players = [...room.players.values()].map((player) => ({
    id: player.id,
    name: player.name,
    level: player.level,
    connected: player.connected,
    submitted: Boolean(room.guesses[player.id])
  }));
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    players,
    round: room.round,
    totalPrompts: room.prompts.length,
    prompt: room.prompt ? { event: room.prompt.event, category: room.prompt.category } : null,
    answerYear: room.phase === 'reveal' || room.phase === 'finished' ? room.prompt?.year : null,
    endsAt: room.endsAt,
    revealEndsAt: room.revealEndsAt,
    results: room.phase === 'reveal' || room.phase === 'finished' ? room.results : null,
    winner: room.winner
  };
}

function broadcast(room) {
  io.to(room.code).emit('room:update', publicRoom(room));
}

function clearRoomTimers(room) {
  if (room.timer) clearTimeout(room.timer);
  if (room.revealTimer) clearTimeout(room.revealTimer);
  room.timer = null;
  room.revealTimer = null;
}

function leaveCurrentRoom(socket) {
  const code = socket.data.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  socket.leave(code);
  socket.data.roomCode = null;
  if (!room) return;
  room.players.delete(socket.id);
  delete room.guesses[socket.id];
  if (room.players.size === 0) {
    clearRoomTimers(room);
    rooms.delete(code);
    return;
  }
  if (room.hostId === socket.id) room.hostId = room.players.keys().next().value;
  if (room.phase === 'playing' && [...room.players.values()].every((player) => !player.connected || room.guesses[player.id])) {
    resolveRound(room);
  } else {
    broadcast(room);
  }
}

function scoreGuess(player, guess, prompt) {
  if (guess === null) {
    const before = player.level;
    player.level = Math.max(1, player.level - 1);
    return { playerId: player.id, name: player.name, guess: null, distance: null, movement: player.level - before, level: player.level, label: 'No answer' };
  }
  const distance = Math.abs(guess - prompt.year);
  let movement;
  let label;
  if (distance === 0) [movement, label] = [2, 'Bullseye'];
  else if (distance <= 3) [movement, label] = [1, 'Close call'];
  else if (distance <= 10) [movement, label] = [0, 'On the edge'];
  else if (distance >= 25) [movement, label] = [-2, 'Way off'];
  else [movement, label] = [-1, 'Off the mark'];
  const before = player.level;
  player.level = Math.max(1, Math.min(10, player.level + movement));
  return { playerId: player.id, name: player.name, guess, distance, movement: player.level - before, level: player.level, label };
}

function resolveRound(room) {
  if (room.phase !== 'playing') return;
  if (room.timer) clearTimeout(room.timer);
  room.timer = null;
  const results = [];
  for (const player of room.players.values()) {
    results.push(scoreGuess(player, room.guesses[player.id] ?? null, room.prompt));
  }
  room.results = results;
  const climbers = results.filter((result) => result.level >= 10);
  if (climbers.length) {
    climbers.sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY));
    room.winner = climbers[0].playerId;
    room.phase = 'finished';
  } else {
    room.phase = 'reveal';
    room.revealEndsAt = Date.now() + REVEAL_MS;
  }
  broadcast(room);
  if (room.phase === 'reveal') {
    room.revealTimer = setTimeout(() => nextRound(room), REVEAL_MS);
  }
}

function nextRound(room) {
  if (!rooms.has(room.code) || room.phase !== 'reveal') return;
  room.round += 1;
  room.prompt = room.prompts[(room.round - 1) % room.prompts.length];
  room.guesses = Object.create(null);
  room.results = null;
  room.revealEndsAt = null;
  room.phase = 'playing';
  room.endsAt = Date.now() + ROUND_MS;
  room.timer = setTimeout(() => resolveRound(room), ROUND_MS);
  broadcast(room);
}

function startGame(room) {
  room.prompts = [...PROMPTS].sort(() => Math.random() - 0.5);
  room.round = 1;
  room.prompt = room.prompts[0];
  room.guesses = Object.create(null);
  room.results = null;
  room.winner = null;
  room.phase = 'playing';
  room.endsAt = Date.now() + ROUND_MS;
  room.timer = setTimeout(() => resolveRound(room), ROUND_MS);
  broadcast(room);
}

io.on('connection', (socket) => {
  socket.on('room:create', ({ name } = {}) => {
    const playerName = cleanName(name);
    if (!playerName) return socket.emit('notice', 'Add your name first.');
    leaveCurrentRoom(socket);
    const code = makeCode();
    const room = {
      code,
      hostId: socket.id,
      phase: 'lobby',
      players: new Map(),
      prompts: [],
      round: 0,
      prompt: null,
      guesses: Object.create(null),
      results: null,
      winner: null,
      endsAt: null,
      revealEndsAt: null,
      timer: null,
      revealTimer: null
    };
    room.players.set(socket.id, { id: socket.id, name: playerName, level: 1, connected: true });
    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    broadcast(room);
  });

  socket.on('room:join', ({ name, code } = {}) => {
    const playerName = cleanName(name);
    const roomCode = String(code || '').trim().toUpperCase();
    if (!playerName) return socket.emit('notice', 'Add your name first.');
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('notice', 'That room code was not found. Check it and try again.');
    if (room.phase !== 'lobby') return socket.emit('notice', 'That game has already started.');
    if (room.players.size >= MAX_PLAYERS) return socket.emit('notice', 'That room is full (8 players max).');
    leaveCurrentRoom(socket);
    room.players.set(socket.id, { id: socket.id, name: playerName, level: 1, connected: true });
    socket.join(room.code);
    socket.data.roomCode = room.code;
    broadcast(room);
  });

  socket.on('game:start', () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return socket.emit('notice', 'Only the host can start the game.');
    if (room.phase !== 'lobby') return;
    if (room.players.size < 2) return socket.emit('notice', 'Invite at least one more player to start.');
    startGame(room);
  });

  socket.on('guess:submit', ({ year } = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.phase !== 'playing' || room.guesses[socket.id] !== undefined) return;
    const guess = Number(year);
    if (!Number.isInteger(guess) || guess < 1000 || guess > 2026) return socket.emit('notice', 'Choose a year between 1000 and 2026.');
    room.guesses[socket.id] = guess;
    broadcast(room);
    if ([...room.players.values()].every((player) => !player.connected || room.guesses[player.id] !== undefined)) resolveRound(room);
  });

  socket.on('room:leave', () => leaveCurrentRoom(socket));
  socket.on('disconnect', () => leaveCurrentRoom(socket));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ChronoClimb listening on port ${PORT}`);
});
