/*

*/
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/users'); // Adjust the path to your model
const Key = require('../models/key');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
/*
// Authentication middleware
const isAuthenticated = (req, res, next) => {
  // Placeholder for your authentication logic
  next();
};

// Validation schema
const schema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});
*/
// Generate a random string function

/*
  Fetch all Users
*/
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/*
Post a user, must send a username, password, and key to the post

This post will add a request with username, password, and role.
This will also delete the key in the database
*/
router.post('/', async (req, res) => {
  const saltRounds = 10;
  const {username,password,key} = req.body;
  console.log(key + '!');
  try {
  
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    /*
    const keyFound = await Key.findOne({ key });
    if (!keyFound)
    {
      return res.status(400).json({ both: true, message: 'Could not find the userKey', message0: 'Username is already taken'  });
    }
    else
    {
      return res.status(400).json({ user: true, message: 'Username is already taken' });
    }
    */
    return res.status(400).json({ user: true, message: 'Username is already taken' });
  }
  
  /*const keyFound = await Key.findOneAndDelete({ key });
  if (!keyFound)
  {
    return res.status(400).json({ key: true, message: 'Could not find the userKey' });
  }
    */
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  const newUser = new User({
    _id: new mongoose.Types.ObjectId(),
    username,
    password: hashedPassword,
    //role: keyFound.role
    role: 'Admin'
  });
  
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// fetch user by username and password, give incorrect password error if searching fails
router.post('/userCheck', async (req, res) => {
  try { 
    const username = req.body.username;
    const password = req.body.password; 
    const user = await User.findOne({ username: username});
    if (!user) {
      return res.status(404).json({ message: 'Incorrect username' })
    }
    // check if password is correct with bycrypt
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(404).json({ message: 'Incorrect password' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Additional CRUD routes...

module.exports = router;