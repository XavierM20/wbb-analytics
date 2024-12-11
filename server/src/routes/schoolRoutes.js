const express = require('express');
const router = express.Router();
const School = require('../models/School'); // Import the School model

// Fetch all schools
router.get('/', async (req, res) => {
    try {
        const schools = await School.find().sort({ name: 1 }); // Sort alphabetically
        res.json(schools);
    } catch (error) {
        console.error("Error fetching schools:", error);
        res.status(500).json({ message: "Error fetching schools" });
    }
});

// Add a new school
router.post('/', async (req, res) => {
    const { name, city, state } = req.body;

    if (!name || !city || !state) {
        return res.status(400).json({ message: "Name, city, and state are required" });
    }

    try {
        const existingSchool = await School.findOne({ name: name.trim(), city: city.trim(), state: state.trim() });
        if (existingSchool) {
            return res.status(400).json({ message: "School already exists" });
        }

        const newSchool = new School({ 
            name: name.trim(), 
            city: city.trim(), 
            state: state.trim() 
        });

        await newSchool.save();
        res.status(201).json(newSchool);
    } catch (error) {
        console.error("Error adding school:", error);
        res.status(500).json({ message: "Error adding school" });
    }
});


module.exports = router;
