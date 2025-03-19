const express = require('express');
const router = express.Router();
const Player = require('../models/player'); 
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const User = require('../models/users');

// Define Joi schema for player validation
const playerSchema = Joi.object({
    name: Joi.string().required(),
    jersey_number: Joi.number().integer().min(0).required(),
    position: Joi.string().required(),
    seasons: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional() // Validates MongoDB ObjectIds
});

// Helper function to authenticate user from JWT
const authenticateUser = async (req) => {
    const token = req.header('Authorization');
    if (!token) {
        throw new Error('Access denied. No token provided.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
        throw new Error('Invalid user.');
    }

    return user;
};

// Middleware: Ensure only the assigned school’s coach can modify players
const authenticateCoachForSchool = async (req, res, next) => {
    try {
        const user = await authenticateUser(req);
        if (user.role !== 'Coach') {
            return res.status(403).json({ message: 'Only coaches can manage players' });
        }
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

// 📌 GET all players for the logged-in user's school
router.get('/', async (req, res) => {
    try {
        const user = await authenticateUser(req);
        if (!user.schoolId) {
            return res.status(403).json({ message: 'User is not associated with any school' });
        }

        const players = await Player.find({ schoolId: user.schoolId });
        res.json(players);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 📌 GET a player by ID (must belong to the user's school)
router.get('/:id', async (req, res) => {
    try {
        const user = await authenticateUser(req);

        const player = await Player.findOne({ _id: req.params.id, schoolId: user.schoolId }).populate('seasons');
        if (!player) {
            return res.status(404).json({ message: 'Player not found or not in your school' });
        }

        res.json(player);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// 📌 GET players by name (must belong to the user's school)
router.get('/name/:name', async (req, res) => {
    try {
        const user = await authenticateUser(req);
        const players = await Player.find({ 
            name: { $regex: new RegExp(req.params.name, 'i') },
            schoolId: user.schoolId 
        });

        if (!players.length) {
            return res.status(404).json({ message: 'No players found with that name in your school' });
        }
        res.json(players);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// 📌 GET players by jersey number (must belong to the user's school)
router.get('/jersey/:jerseyNumber', async (req, res) => {
    try {
        const user = await authenticateUser(req);
        const players = await Player.find({ 
            jersey_number: req.params.jerseyNumber,
            schoolId: user.schoolId 
        });

        if (!players.length) {
            return res.status(404).json({ message: 'No players found with that jersey number in your school' });
        }
        res.json(players);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// 📌 POST a new player (Only Coaches can add players to their school)
router.post('/', authenticateCoachForSchool, async (req, res) => {
    try {
        const user = await authenticateUser(req);

        const { error, value } = playerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Ensure the player is tied to the coach's school
        const player = new Player({
            ...value,
            schoolId: user.schoolId 
        });

        await player.save();
        res.status(201).json(player);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create player', error: err.message });
    }
});

// 📌 PATCH to update a player (Only Coaches can update players from their school)
router.patch('/:id', authenticateCoachForSchool, async (req, res) => {
    try {
        const user = await authenticateUser(req);

        const { error, value } = playerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const updatedPlayer = await Player.findOneAndUpdate(
            { _id: req.params.id, schoolId: user.schoolId },
            value,
            { new: true }
        );

        if (!updatedPlayer) {
            return res.status(404).json({ message: 'Player not found or not in your school' });
        }

        res.json(updatedPlayer);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// 📌 DELETE a player (Only Coaches can delete players from their school)
router.delete('/:id', authenticateCoachForSchool, async (req, res) => {
    try {
        const user = await authenticateUser(req);

        const player = await Player.findOneAndDelete({ _id: req.params.id, schoolId: user.schoolId });
        if (!player) {
            return res.status(404).json({ message: 'Player not found or not in your school' });
        }

        res.json({ message: 'Player deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

module.exports = router;
