const express = require('express');
const multer = require('multer');       // To handle file uploads
const router = express.Router();
const Game = require('../models/game'); // Adjust the path as necessary
const Image = require('../models/image'); // Mongoose model for image storage
const mongoose = require('mongoose');
const Joi = require('joi');

// Configure Multer for file uploads (memory storage keeps files in RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    // Placeholder for your authentication logic
    next();
};

// Define Joi schema for game validation
const gameSchema = Joi.object({
    season_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    date: Joi.date().required(),
    opponent: Joi.string().required(),
    location: Joi.string().required(),
    tempo_events: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    shot_events: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    team_logo: Joi.string().allow(null).optional(),
    score: Joi.object({
        team: Joi.number().required(),
        opponent: Joi.number().required()
    }).required()
});

// GET all games for a specific school
router.get('/:seasonID', isAuthenticated, async (req, res) => {
    try {
        const { seasonID } = req.params;
        console.log(seasonID);

        if (!mongoose.isValidObjectId(seasonID)) {
            console.log('1');
            return res.status(400).json({ error: 'Invalid seasonID format' });
        }
        console.log(2);

        const games = await Game.find({ season_id: new mongoose.Types.ObjectId(seasonID) });
        console.log(games);

        res.json(games);
    } catch (error) {
        console.error("Error retrieving games:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add specific GET functions for season_id, date, opponent, location, tempo_events, and shot_events
// Example: GET games by season_id
router.get('/bySeason/:seasonId', isAuthenticated, async (req, res) => {
    try {
        const games = await Game.find({ season_id: mongoose.Types.ObjectId(req.params.seasonId) });
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Repeat the pattern above for other specific GET functions by adapting the query as needed
router.get('/byDate/:date', isAuthenticated, async (req, res) => {
    try {
        const games = await Game.find({ date: req.params.date });
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

router.get('/byOpponent/:opponent', isAuthenticated, async (req, res) => {
    try {
        const games = await Game.find({ opponent: req.params.opponent });
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

router.get('/byLocation/:location', isAuthenticated, async (req, res) => {
    try {
        const games = await Game.find({ location: req.params.location });
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

router.get('/byTempoEvent/:tempoEventId', isAuthenticated, async (req, res) => {
    try {
        const games = await Game.find({ tempo_events: mongoose.Types.ObjectId(req.params.tempoEventId) });
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

router.get('/byShotEvent/:shotEventId', isAuthenticated, async (req, res) => {
    try {
        const games = await Game.find({ shot_events: mongoose.Types.ObjectId(req.params.shotEventId) });
        res.json(games);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET a game by ID
router.get('/id/:id', isAuthenticated, async (req, res) => {
    try {
        console.log("Received game ID:", req.params.id);
        console.log("Type of ID:", typeof req.params.id);

        const { id } = req.params;

        console.log("Received game ID:", id);

        // Validate ID format
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid game ID format' });
        }

        // Query for the game by ObjectId
        const game = await Game.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        res.json(game);
    } catch (err) {
        console.error("Error fetching game:", err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// POST a new game with validation
router.post('/', isAuthenticated, async (req, res) => {
    const { error, value } = gameSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const game = new Game(value);

    try {
        await game.save();
        res.status(201).json(game);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create game', error: err.message });
    }
});

// PATCH to update a game by ID with validation
router.patch('/:id', isAuthenticated, async (req, res) => {
    const { error, value } = gameSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const updatedGame = await Game.findByIdAndUpdate(req.params.id, value, { new: true })
                                       .populate('season_id tempo_events shot_events team_logo');
        if (!updatedGame) {
            return res.status(404).json({ message: 'Game not found' });
        }
        res.json(updatedGame);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// DELETE a game by ID
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const game = await Game.findByIdAndDelete(req.params.id);
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        res.json({ message: 'Game deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Route to Upload an Image
router.post('/uploadLogo', upload.single('file'), async (req, res) => {
    try {
      const newImage = new Image({
        name: req.file.originalname,
        image: {
          data: req.file.buffer, // Store the binary image data
          contentType: req.file.mimetype
        }
      });
  
      const savedImage = await newImage.save();
      res.json({ message: 'Image uploaded successfully', id: savedImage._id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Route to Retrieve an Image
router.get('/image/:id', async (req, res) => {
    try {
      const image = await Image.findById(req.params.id);
      if (!image) return res.status(404).send('Image not found');
  
      res.contentType(image.image.contentType); // Set the correct MIME type
      res.send(image.image.data); // Send binary data
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

module.exports = router;
