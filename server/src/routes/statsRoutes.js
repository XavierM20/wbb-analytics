const express = require('express');
const router = express.Router();
const Player = require('../models/player'); // Adjust the path as necessary
const mongoose = require('mongoose');
const Joi = require('joi');
const Stats = require('../models/stats'); // Adjust the path as necessary
const Drill = require('../models/drill'); // Make sure to import the Drill model
const Practice = require('../models/practice'); // Make sure to import the Practice model
const Shots = require('../models/shot');
const Tempos = require('../models/tempo');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    // Placeholder for your authentication logic
    next();
};

// Define Joi schema for stats validation
const statsSchema = Joi.object({
    gameOrDrill_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    onModel: Joi.string().required().valid('Game', 'Drill'),
    player_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    offensive_rebounds: Joi.number().required(),
    defensive_rebounds: Joi.number().required(),
    assists: Joi.number().required(),
    steals: Joi.number().required(),
    blocks: Joi.number().required(),
    turnovers: Joi.number().required(),
});

// GET all stats without pagination
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const stats = await Stats.find();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET stats by player_id
router.get('/byPlayer/:playerId', isAuthenticated, async (req, res) => {
    try {
        const stats = await Stats.find({ player_id: req.params.playerId });
        if (!stats.length) {
            return res.status(404).json({ message: 'No stats found for the given player_id' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Endpoint to get aggregated data for a practice
router.get('/exportPractice/:practiceId', async (req, res) => {
    try {
        const practiceId = req.params.practiceId;

        const practice = await Practice.findById(practiceId);
        if (!practice) {
            return res.status(404).send('Practice not found');
        }
        const drillIds = practice.drills;
        const playerIds = [...practice.team_gray, ...practice.team_purple];

        const statsPipeline = [
            { $match: { gameOrDrill_id: { $in: drillIds }, player_id: { $in: playerIds } } }, // Drill IDs fetched earlier
            {
                $group: {
                    _id: { drill_id: '$gameOrDrill_id', player_id: '$player_id' },
                    offensiveRebounds: { $sum: '$offensive_rebounds' },
                    defensiveRebounds: { $sum: '$defensive_rebounds' },
                    assists: { $sum: '$assists' },
                    steals: { $sum: '$steals' },
                    blocks: { $sum: '$blocks' },
                    turnovers: { $sum: '$turnovers' },
                }
            }
        ];

        const shotsPipeline = [
            { $match: { gameOrDrill_id: { $in: drillIds }, player_ids: { $in: playerIds } } },
            {
                $group: {
                    _id: { drill_id: '$gameOrDrill_id', player_id: '$player_ids' },
                    fieldGoalsMade: { $sum: { $cond: [{ $and: [{ $eq: ['$made', true] }, { $lte: ['$zone', 5] }] }, 1, 0] } },
                    fieldGoalsAttempted: { $sum: { $cond: [{ $lte: ['$zone', 5] }, 1, 0] } },
                    threePointMade: { $sum: { $cond: [{ $and: [{ $eq: ['$made', true] }, { $gt: ['$zone', 5] }] }, 1, 0] } },
                    threePointAttempted: { $sum: { $cond: [{ $gt: ['$zone', 5] }, 1, 0] } },
                    // Stats by zone (1-8)
                    ...Array.from({ length: 8 }, (_, i) => ({
                        [`zone${i + 1}Made`]: { $sum: { $cond: [{ $and: [{ $eq: ['$zone', i + 1] }, { $eq: ['$made', true] }] }, 1, 0] } },
                        [`zone${i + 1}Attempted`]: { $sum: { $cond: [{ $eq: ['$zone', i + 1] }, 1, 0] } }
                    })).reduce((acc, val) => Object.assign(acc, val), {}),
                    // Stats by shot clock thirds
                    // Stats by shot clock thirds
                    shotClockFirstThirdMade: {
                        $sum: {
                            $cond: [{ $eq: ['$shot_clock_time', 'first_third'] }, { $cond: [{ $eq: ['$made', true] }, 1, 0] }, 0]
                        }
                    },
                    shotClockFirstThirdAttempted: {
                        $sum: {
                            $cond: [{ $eq: ['$shot_clock_time', 'first_third'] }, 1, 0]
                        }
                    },
                    shotClockSecondThirdMade: {
                        $sum: {
                            $cond: [{ $eq: ['$shot_clock_time', 'second_third'] }, { $cond: [{ $eq: ['$made', true] }, 1, 0] }, 0]
                        }
                    },
                    shotClockSecondThirdAttempted: {
                        $sum: {
                            $cond: [{ $eq: ['$shot_clock_time', 'second_third'] }, 1, 0]
                        }
                    },
                    shotClockFinalThirdMade: {
                        $sum: {
                            $cond: [{ $eq: ['$shot_clock_time', 'final_third'] }, { $cond: [{ $eq: ['$made', true] }, 1, 0] }, 0]
                        }
                    },
                    shotClockFinalThirdAttempted: {
                        $sum: {
                            $cond: [{ $eq: ['$shot_clock_time', 'final_third'] }, 1, 0]
                        }
                    },

                }
            }
        ];

        const tempoPipeline = [
            {
                $match: {
                    gameOrDrill_id: { $in: drillIds }  // Only look at tempos related to these drills
                }
            },
            {
                $unwind: "$player_ids"  // Flatten the array to access each player ID
            },
            {
                $match: {
                    "player_ids": { $in: playerIds }  // Ensure you are only considering player IDs that are part of the practice
                }
            },
            {
                $group: {
                    _id: {
                        drill_id: "$gameOrDrill_id",
                        player_id: "$player_ids"  // Group by drill and individual player
                    },
                    averageOffensiveTempo: {
                        $avg: {
                            $cond: [{ $eq: ["$tempo_type", "offensive"] }, "$transition_time", 0]  // Average only offensive tempos
                        }
                    },
                    averageDefensiveTempo: {
                        $avg: {
                            $cond: [{ $eq: ["$tempo_type", "defensive"] }, "$transition_time", 0]  // Average only defensive tempos
                        }
                    }
                }
            }
        ];

        // Run aggregation pipelines
        const statsResults = await Stats.aggregate(statsPipeline);
        const shotsResults = await Shots.aggregate(shotsPipeline);
        const temposResults = await Tempos.aggregate(tempoPipeline);

        // Combine results
        let combinedResults = combineResults(statsResults, shotsResults, temposResults);

        // Additional lookups for drill and player information
        combinedResults = await Drill.populate(combinedResults, { path: "_id.drill_id", select: 'name' });
        combinedResults = await Player.populate(combinedResults, { path: "_id.player_id", select: 'jersey_number' });

        // Map combined results to format without the _id object
        combinedResults = combinedResults.map(item => ({
            // format PracticeDate as YYYY-MM-DD
            PracticeDate: practice.date.toISOString().split('T')[0],
            DrillName: item._id.drill_id.name,
            PlayerNumber: item._id.player_id.jersey_number,
            offensiveRebounds: item.offensiveRebounds,
            defensiveRebounds: item.defensiveRebounds,
            assists: item.assists,
            steals: item.steals,
            blocks: item.blocks,
            turnovers: item.turnovers,
            fieldGoalsMade: item.fieldGoalsMade,
            fieldGoalsAttempted: item.fieldGoalsAttempted,
            threePointMade: item.threePointMade,
            threePointAttempted: item.threePointAttempted,
            zone1Made: item.zone1Made,
            zone1Attempted: item.zone1Attempted,
            zone2Made: item.zone2Made,
            zone2Attempted: item.zone2Attempted,
            zone3Made: item.zone3Made,
            zone3Attempted: item.zone3Attempted,
            zone4Made: item.zone4Made,
            zone4Attempted: item.zone4Attempted,
            zone5Made: item.zone5Made,
            zone5Attempted: item.zone5Attempted,
            zone6Made: item.zone6Made,
            zone6Attempted: item.zone6Attempted,
            zone7Made: item.zone7Made,
            zone7Attempted: item.zone7Attempted,
            zone8Made: item.zone8Made,
            zone8Attempted: item.zone8Attempted,
            shotClockFirstThirdMade: item.shotClockFirstThirdMade,
            shotClockFirstThirdAttempted: item.shotClockFirstThirdAttempted,
            shotClockSecondThirdMade: item.shotClockSecondThirdMade,
            shotClockSecondThirdAttempted: item.shotClockSecondThirdAttempted,
            shotClockFinalThirdMade: item.shotClockFinalThirdMade,
            shotClockFinalThirdAttempted: item.shotClockFinalThirdAttempted,
            averageOffensiveTempo: item.averageOffensiveTempo,
            averageDefensiveTempo: item.averageDefensiveTempo
        }));

        res.json(combinedResults);
    } catch (error) {
        res.status(500).send({ message: 'Error processing your request', error: error.toString() });
    }
});

// Combine results from different aggregations
function combineResults(stats, shots, tempos) {
    const combined = {};

    // Combine stats results
    stats.forEach(item => {
        const key = `${item._id.drill_id}-${item._id.player_id}`;
        combined[key] = { ...combined[key], ...item, player_id: item._id.player_id };
    });

    // Combine shots results
    shots.forEach(item => {
        const key = `${item._id.drill_id}-${item._id.player_id}`;
        combined[key] = { ...combined[key], ...item, player_id: item._id.player_id };
    });

    // Combine tempos results
    tempos.forEach(item => {
        const key = `${item._id.drill_id}-${item._id.player_id}`;
        combined[key] = { ...combined[key], ...item, player_id: item._id.player_id };
    });

    return Object.values(combined);
}


// API Endpoint to get aggregated data for a practice
router.get('/byPractice/:practiceId', isAuthenticated, async (req, res) => {
    try {
        const practice = await Practice.findOne({ _id: req.params.practiceId });
        if (!practice) {
            return res.status(404).send('Practice not found');
        }

        const combinedData = await Promise.all(practice.drills.map(drillId => aggregateData(drillId)));

        res.json({ data: combinedData });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// GET stats by drill_id
router.get('/byGameOrDrill/:gameOrDrillid', isAuthenticated, async (req, res) => {
    try {
        const stats = await Stats.find({ gameOrDrill_id: req.params.gameOrDrillid });
        if (!stats.length) {
            return res.status(404).json({ message: 'No stats found for the given drill_id' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// Get stats by player_id and drill_id
router.get('/byPlayerAndGameOrDrill/:playerId/:gameOrDrillId', isAuthenticated, async (req, res) => {
    try {
        const stats = await Stats.findOne({ player_id: req.params.playerId, gameOrDrill_id: req.params.gameOrDrillId });
        if (!stats) {
            return res.status(404).json({ message: 'No stats found for the given player_id and drill_id' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// POST new stats with validation
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const stats = req.body;
        const { error } = statsSchema.validate(stats);
        if (error) {
            return res.status(400).json({ message: 'Invalid request', error: error.details });
        }
        const newStats = await Stats.create(stats);
        res.status(201).json(newStats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// PATCH to update stats by ID with validation
router.patch('/:id', isAuthenticated, async (req, res) => {
    try {
        const stats = req.body;
        const { error } = statsSchema.validate(stats);
        if (error) {
            return res.status(400).json({ message: 'Invalid request', error: error.details });
        }
        const updatedStats = await Stats.findByIdAndUpdate(req.params.id, stats, { new: true });
        if (!updatedStats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(updatedStats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// PATCH to update offensive rebounds by one
router.patch('/offensiveRebound/:id', isAuthenticated, async (req, res) => {
    try {
        const stats = await Stats.findByIdAndUpdate(req.params.id, { $inc: { offensive_rebounds: 1 } }, { new: true });
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// PATCH to update defensive rebounds by one
router.patch('/defensiveRebound/:id', isAuthenticated, async (req, res) => {
    try {
        const stats = await Stats.findByIdAndUpdate(req.params.id, { $inc: { defensive_rebounds: 1 } }, { new: true });
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});
 
// PATCH to update assists by one
router.patch('/assist/:id', isAuthenticated, async (req, res) => {
    try {
        const stats = await Stats.findByIdAndUpdate(req.params.id, { $inc: { assists: 1 } }, { new: true });
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});
 
// PATCH to update steals by one
router.patch('/steal/:id', isAuthenticated, async (req, res) => {
    try {
        const stats = await Stats.findByIdAndUpdate(req.params.id, { $inc: { steals: 1 } }, { new: true });
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});
 
// PATCH to update blocks by one
router.patch('/block/:id', isAuthenticated, async (req, res) => {
    try {
        const stats = await Stats.findByIdAndUpdate(req.params.id, { $inc: { blocks: 1 } }, { new: true });
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// PATCH to update blocks by one
router.patch('/turnover/:id', isAuthenticated, async (req, res) => {
    try {
        const stats = await Stats.findByIdAndUpdate(req.params.id, { $inc: { turnovers: 1 } }, { new: true });
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

/* Patch Endpoints to update stats by player_id and gameOrDrill_id */
// PATCH to update offensive rebounds by player_id and drill_id
router.patch('/offensiveRebound/:gameOrDrillId/:playerId', isAuthenticated, async (req, res) => {
    try {
        const { gameOrDrillId, playerId } = req.params;
        const stats = await Stats.findOneAndUpdate(
            { gameOrDrill_id: gameOrDrillId, player_id: playerId },
            { $inc: { offensive_rebounds: 1 } },
            { new: true }
        );
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// PATCH to update defensive rebounds by player_id and drill_id
router.patch('/defensiveRebound/:gameOrDrillId/:playerId', isAuthenticated, async (req, res) => {
    try {
        const { gameOrDrillId, playerId } = req.params;
        const stats = await Stats.findOneAndUpdate(
            { gameOrDrill_id: gameOrDrillId, player_id: playerId },
            { $inc: { defensive_rebounds: 1 } },
            { new: true }
        );
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// PATCH to update assists by player_id and drill_id
router.patch('/assist/:gameOrDrillId/:playerId', isAuthenticated, async (req, res) => {
    try {
        const { gameOrDrillId, playerId } = req.params;
        const stats = await Stats.findOneAndUpdate(
            { gameOrDrill_id: gameOrDrillId, player_id: playerId },
            { $inc: { assists: 1 } },
            { new: true }
        );
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// PATCH to update steals by player_id and drill_id
router.patch('/steal/:gameOrDrillId/:playerId', isAuthenticated, async (req, res) => {
    try {
        const { gameOrDrillId, playerId } = req.params;
        const stats = await Stats.findOneAndUpdate(
            { gameOrDrill_id: gameOrDrillId, player_id: playerId },
            { $inc: { steals: 1 } },
            { new: true }
        );
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// PATCH to update blocks by player_id and drill_id
router.patch('/block/:gameOrDrillId/:playerId', isAuthenticated, async (req, res) => {
    try {
        const { gameOrDrillId, playerId } = req.params;
        const stats = await Stats.findOneAndUpdate(
            { gameOrDrill_id: gameOrDrillId, player_id: playerId },
            { $inc: { blocks: 1 } },
            { new: true }
        );
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// PATCH to update turnovers by player_id and drill_id
router.patch('/turnover/:gameOrDrillId/:playerId', isAuthenticated, async (req, res) => {
    try {
        const { gameOrDrillId, playerId } = req.params;
        const stats = await Stats.findOneAndUpdate(
            { gameOrDrill_id: gameOrDrillId, player_id: playerId },
            { $inc: { turnovers: 1 } },
            { new: true }
        );
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// PATCH to update stats by player_id and drill_id
router.patch('/byPlayerAndGameOrDrill/:playerId/:gameOrDrillId', isAuthenticated, async (req, res) => {
    try {
        const stats = req.body;
        const { error } = statsSchema.validate(stats);
        if (error) {
            return res.status(400).json({ message: 'Invalid request', error: error.details });
        }
        const updatedStats = await Stats.findOneAndUpdate({ player_id: req.params.playerId, gameOrDrill_id: req.params.gameOrDrillId }, stats, { new: true });
        if (!updatedStats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(updatedStats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

// DELETE stats by ID
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const stats = await Stats.findByIdAndDelete(req.params.id);
        if (!stats) {
            return res.status(404).json({ message: 'Stats not found' });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});

module.exports = router;