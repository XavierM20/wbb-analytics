const express = require('express');
const router = express.Router();
const Tempo = require('../models/tempo'); // Adjust the path as necessary
const mongoose = require('mongoose');
const Joi = require('joi');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    // Placeholder for your authentication logic
    next();
};

// Define Joi schema for tempo validation
const tempoSchema = Joi.object({
    gameOrDrill_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).allow(null, ''),
    onModel: Joi.string().required().valid('Game', 'Drill'),
    player_ids: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
    tempo_type: Joi.string().required().valid('offensive', 'defensive'),
    transition_time: Joi.number().required(),
    timestamp: Joi.date().required()
});

// GET all tempo events without pagination
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const tempos = await Tempo.find();
        res.json(tempos);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET a tempo event by ID
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const tempo = await Tempo.findById(req.params.id).populate(['gameOrDrill_id', 'player_ids']);
        if (!tempo) {
            return res.status(404).json({ message: 'Tempo event not found' });
        }
        res.json(tempo);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET tempo events by gameOrDrill_id
router.get('/byGameOrDrill/:gameOrDrillId', isAuthenticated, async (req, res) => {
    try {
        const tempos = await Tempo.find({ gameOrDrill_id: req.params.gameOrDrillId })
        res.json(tempos);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET tempo events by player_id
router.get('/byPlayer/:playerId', isAuthenticated, async (req, res) => {
    try {
        const tempos = await Tempo.find({ player_ids: req.params.playerId });
        res.json(tempos);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET tempo events by tempo_type
router.get('/byTempoType/:tempoType', isAuthenticated, async (req, res) => {
    try {
        const tempos = await Tempo.find({ tempo_type: req.params.tempoType })
                                  .populate(['gameOrPractice_id', 'player_ids']);
        res.json(tempos);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET tempo events by timestamp
router.get('/byTimestamp/:timestamp', isAuthenticated, async (req, res) => {
    try {
        const tempos = await Tempo.find({ timestamp: req.params.timestamp })
                                  .populate(['gameOrPractice_id', 'player_ids']);
        res.json(tempos);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// POST a new tempo event with validation
router.post('/', isAuthenticated, async (req, res) => {
    const { error, value } = tempoSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const tempo = new Tempo(value);

    try {
        await tempo.save();
        res.status(201).json(tempo);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create tempo event', error: err.message });
    }
});

// PATCH to update a tempo event by ID with validation
router.patch('/:id', isAuthenticated, async (req, res) => {
    const { error, value } = tempoSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const updatedTempo = await Tempo.findByIdAndUpdate(req.params.id, value, { new: true })
                                        .populate(['gameOrPractice_id', 'player_ids']);
        if (!updatedTempo) {
            return res.status(404).json({ message: 'Tempo event not found' });
        }
        res.json(updatedTempo);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// DELETE a tempo event by ID
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const tempo = await Tempo.findByIdAndDelete(req.params.id);
        if (!tempo) {
            return res.status(404).json({ message: 'Tempo event not found' });
        }
        res.json({ message: 'Tempo event deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete tempo event', error: err.message });
    }
});

module.exports = router;
