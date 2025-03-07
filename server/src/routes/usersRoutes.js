const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/users');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const jwt = require('jsonwebtoken');

// Joi validation schema for user creation
const userSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.string().valid('Coach', 'Player', 'Admin').required(),
  schoolId: Joi.string().required(), // Ensure schoolId is required
});

// Middleware to authenticate user via JWT
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

/*
  Fetch all Users (restricted to the same school)
*/
router.get('/', async (req, res) => {
  try {
    const user = await authenticateUser(req);
    if (!user.schoolId) {
      return res.status(403).json({ message: 'User is not associated with any school' });
    }

    const users = await User.find({ schoolId: user.schoolId }).select('-password'); // Exclude password for security
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
  Create a new user (must send username, password, role, and schoolId)
*/
router.post('/', async (req, res) => {
  const saltRounds = 10;
  const { error, value } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { username, password, role, schoolId } = value;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ user: true, message: 'Username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      username,
      password: hashedPassword, // Fixed typo: was `assword`
      role,
      schoolId, // Ensure schoolId is saved
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
  User authentication (must be from the same school)
*/
router.post('/userCheck', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'Incorrect username' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(404).json({ message: 'Incorrect password' });
    }

    // Generate JWT token for authenticated user
    const token = jwt.sign({ userId: user._id, schoolId: user.schoolId }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
