const express = require('express');
const router = express.Router();
const Season = require('../models/season'); // Adjust the path as necessary
const Games = require('../models/game');
const Practice = require('../models/practice');
const Joi = require('joi');

// Define Joi schema for season validation
const seasonSchema = Joi.object({
    year: Joi.string().required(),
    players: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    games: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    practices: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
});

// Authentication middleware (to be implemented based on your auth system)
const isAuthenticated = (req, res, next) => {
    // Your authentication check goes here
    next();
};

// GET all seasons without pagination
router.get('/', async (req, res) => {
    try {
        const seasons = await Season.find();
        res.json(seasons);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET a season by ID
router.get('/:id', async (req, res) => {
    try {
        const season = await Season.findById(req.params.id);
        if (!season) {
            return res.status(404).json({ message: 'Season not found' });
        }
        res.json(season);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET a season by year
router.get('/year/:year', async (req, res) => {
    try {
        const season = await Season.findOne({ year: req.params.year });
        if (!season) {
            return res.status(404).json({ message: 'Season not found for the given year' });
        }
        res.json(season);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET players from a season by season ID
router.get('/:id/players', async (req, res) => {
    try {
        const season = await Season.findById(req.params.id);
        if (!season) {
            return res.status(404).json({ message: 'Season not found' });
        }
        res.json(season.players);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET games from a season by season ID
router.get('/:id/games', async (req, res) => {
    try {
        const season = await Season.findById(req.params.id);
        if (!season) {
            return res.status(404).json({ message: 'Season not found' });
        }
        res.json(season.games);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET games from a season by season ID with id, date, opponent, and location
router.get('/:id/gamesDate', async (req, res) => {
    try {
        const games = await Games.find({ season_id: req.params.id }, '_id date opponent location');
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET practices from a season by season ID with only id and date
router.get('/:id/practicesDate', async (req, res) => {
    try {
        const practices = await Practice.find({ season_id: req.params.id }, '_id date');
        res.json(practices);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Get practices by season
router.get('/:seasonId/practices', async (req, res) => {
    try {
        const { seasonId } = req.params;
        const season = await Season.findById(seasonId).populate('practices');
        if (!season) {
            return res.status(404).send('Season not found');
        }
        res.json(season.practices);
    } catch (error) {
        res.status(500).send({ message: 'Error retrieving practices', error: error.toString() });
    }
});

// GET season by end year assuming season is in format "startYear-endYear"
router.get('/endYear/:endYear', async (req, res) => {
    console.log(req.params.endYear);
    try {
        // Assuming year is stored as "startYear-endYear"
        const endYearPattern = `-${req.params.endYear}`;
        console.log('endYearPattern: ' + endYearPattern);
        const season = await Season.findOne({ year: { $regex: endYearPattern } });
        if (!season) {
            return res.status(404).json({ message: 'Season not found for the given year' });
        }
        res.json(season);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET practices from a season by season ID
router.get('/:id/practices', async (req, res) => {
    try {
        const season = await Season.findById(req.params.id);
        if (!season) {
            return res.status(404).json({ message: 'Season not found' });
        }
        res.json(season.practices);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// POST a new season with validation
router.post('/', async (req, res) => {
    const { year, players } = req.body;

    if (!year || !Array.isArray(players)) {
        return res.status(400).json({ message: 'Year and players are required.' });
    }

    try {
        const season = new Season({ year, players });
        await season.save();

        // Optionally update players with this season
        const Player = require('../models/player'); // Ensure correct path to Player model
        await Player.updateMany(
            { _id: { $in: players } },
            { $push: { seasons: season._id } }
        );

        res.status(201).json(season);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create season', error: err.message });
    }
});

// PATCH to update a season with validation
router.patch('/:id', isAuthenticated, async (req, res) => {
    const { error, value } = seasonSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const updatedSeason = await Season.findByIdAndUpdate(req.params.id, value, { new: true }).populate(['players', 'games', 'practices']);
        if (!updatedSeason) {
            return res.status(404).json({ message: 'Season not found' });
        }
        res.json(updatedSeason);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// DELETE a season
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const season = await Season.findByIdAndDelete(req.params.id);
        if (!season) {
            return res.status(404).json({ message: 'Season not found' });
        }
        res.json({ message: 'Season deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// PATCH to update the players in a season
router.patch('/:id/players', isAuthenticated, async (req, res) => {
    const { players } = req.body;
    if (!Array.isArray(players)) {
        return res.status(400).json({ message: 'Players must be an array of player IDs' });
    }

    try {
        console.log(req.params.id);
        const season = await Season.findById(req.params.id);
        if (!season) {
            return res.status(404).json({ message: 'Season not found' });
        }

        // Update players in the season
        season.players = players;
        await season.save();

        // Update players with this season
        const Player = require('../models/player'); // Ensure correct path to Player model
        await Player.updateMany(
            { _id: { $nin: players } },
            { $pull: { seasons: season._id } }
        );
        await Player.updateMany(
            { _id: { $in: players } },
            { $addToSet: { seasons: season._id } }
        );

        res.json(season);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

module.exports = router;
