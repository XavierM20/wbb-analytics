const express = require("express");
const crypto = require("crypto");

const router = express.Router();

router.get("/alive", (req, res) => {
  res.status(200).json({ message: "alive" });
});

router.post("/pushevent", (req, res) => {
  console.log("Received webhook event:", req.body);
  res.sendStatus(200);
});
module.exports = router;

