const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

// Your solution should be written here
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

const MYSECRETJWTKEY = "secret"
const users = [];
const highScores = [];

// Passport JWT Strategy configuration
const optionsForJwtValidation = {
  jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: MYSECRETJWTKEY
};

// Authenticates protected routes
passport.use(new JwtStrategy(optionsForJwtValidation, function(payload, done) {
  const user = users.find((u) => u.userHandle === payload.userHandle);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
}));

app.use(passport.initialize());


// Signup route
app.post("/signup", (req, res) => {
  const { userHandle, password } = req.body;

  if (!userHandle || !password || userHandle.length < 6 || password.length < 6) {
    return res.status(400).json({ error: "Invalid request body" });
  }


  users.push({ userHandle, password });
  return res.status(201).json({ message: "User created" });
});



// Login route
app.post('/login', (req, res) => {
  const { userHandle, password } = req.body;

  if (!userHandle || !password || userHandle.length < 6 || password.length < 6) {
    return res.status(400).json({ message: "Bad request" });
  }
  
  if (typeof userHandle !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Bad request" });
  }
  
  const requestBody = req.body;
  if (Object.keys(requestBody).length > 2) {
    return res.status(400).json({ message: "Bad request" });
  } 


  const user = users.find((u) => u.userHandle === userHandle && u.password === password);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized, incorrect username or password" });
  }

  const token = jwt.sign({ userHandle }, MYSECRETJWTKEY, { expiresIn: "1h" });

  res.status(200).json({ jsonWebToken: token });
})





// Post high scores
app.post("/high-scores", passport.authenticate("jwt", { session: false }), (req, res) => {
  const { level, score, userHandle, timestamp } = req.body;

  
  if (!userHandle || !level || !score || !timestamp) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  
  highScores.push({ level, score, userHandle, timestamp });
  return res.status(201).json({ message: "High score posted successfully" });
});




// Get high scores route 
app.get("/high-scores", (req, res) => {
  const { level, page } = req.query;

  if (!level) {
    return res.status(400).json({ error: "Level is required" });
  }

  // Filter by the requested level
  const filteredScores = highScores.filter(score => score.level === level);

  const sortedScores = filteredScores.sort((a, b) => b.score - a.score);

  if (filteredScores.length === 0) {
    return res.status(200).json([]);
  }

  
  const pageNumber = parseInt(page) || 1;  
  const startIndex = (pageNumber - 1) * 20;
  const endIndex = startIndex + 20;
  const paginatedScores = sortedScores.slice(startIndex, endIndex);

  res.status(200).json(paginatedScores);
});




//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
