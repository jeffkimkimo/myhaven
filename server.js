const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists and initialize SQLite
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'ratings.db');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS film_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    film_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(express.json());

// Serve static files (the site) from the repo root
app.use(express.static(__dirname));

// GET average rating + count for a film
app.get('/api/ratings/:filmId', (req, res) => {
  const filmId = req.params.filmId;
  const row = db
    .prepare('SELECT COUNT(*) AS count, AVG(rating) AS avg FROM film_ratings WHERE film_id = ?')
    .get(filmId);

  const count = row?.count || 0;
  const average = row?.avg ? Number(row.avg.toFixed(2)) : null;
  res.json({ filmId, count, average });
});

// POST a new rating
app.post('/api/ratings', (req, res) => {
  const { filmId, rating } = req.body || {};
  const parsedRating = Number(rating);

  if (!filmId || typeof filmId !== 'string') {
    return res.status(400).json({ error: 'filmId is required' });
  }
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
  }

  db.prepare('INSERT INTO film_ratings (film_id, rating) VALUES (?, ?)').run(filmId, parsedRating);
  const row = db
    .prepare('SELECT COUNT(*) AS count, AVG(rating) AS avg FROM film_ratings WHERE film_id = ?')
    .get(filmId);

  const count = row?.count || 0;
  const average = row?.avg ? Number(row.avg.toFixed(2)) : parsedRating;

  res.status(201).json({ filmId, count, average });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
