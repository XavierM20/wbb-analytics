require('dotenv').config();
//console.log(process.env);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// import routes
const playerRoutes = require('./routes/playerRoutes');
const seasonRoutes = require('./routes/seasonRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const drillRoutes = require('./routes/drillRoutes');
const tempoRoutes = require('./routes/tempoRoutes');
const shotRoutes = require('./routes/shotRoutes');
const gameRoutes = require('./routes/gameRoutes');
const userRoutes = require('./routes/usersRoutes');
const statsRoutes = require('./routes/statsRoutes');
const keyRoutes = require('./routes/keyRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

app.use(cors()); // Enable CORS

// Middleware to parse JSON
app.use(express.json());

const env = process.env.NODE_ENV || 'DEVELOPMENT'; // Default to 'DEVELOPMENT' if NODE_ENV is not set
//console.log(JSON.stringify(env))
let mongoURI;
// console.log(env);
// Check if the environment is an off-campus variant

if (env.includes('OFFCAMPUS')) {
  // Use the off-campus URI corresponding to the current NODE_ENV
  mongoURI = process.env[`MONGO_URI_${env}`];
  console.log('we are off campus');
} else {
  // Use the on-campus URI, with a fallback to the development URI if not explicitly set
  mongoURI = process.env[`MONGO_URI_${env}`] || process.env.MONGO_URI_DEVELOPMENT;
  console.log('we are on campus');
}

console.log(mongoURI); // For debugging: output the determined mongoURI
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`mongoURI: ${mongoURI}`);
console.log(`MONGO_URI_${env}: ${process.env[`MONGO_URI_${env}`]}`);


mongoose.connect(mongoURI)
  .then(() => console.log(`Connected to MongoDB at ${mongoURI}`))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Setup routes
app.use('/api/players', playerRoutes);
app.use('/api/seasons', seasonRoutes);
app.use('/api/practices', practiceRoutes);
app.use('/api/drills', drillRoutes);
app.use('/api/tempos', tempoRoutes);
app.use('/api/keys', keyRoutes);
app.use('/api/shots', shotRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/schools', schoolRoutes);

app.get('/api/alive',(req,res,next) =>{
res.status(200).json({status:"alive"})
})

app.use('/github-webhook/pushevent', webhookRoutes);

const port = process.env.PORT || 3001; // Use environment variable or default to 3001
// Start the server on a single port
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});