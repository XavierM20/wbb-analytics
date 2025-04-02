const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors")
const crypto = require("crypto");
 
const app = express();
app.use(express.json())
const PORT = 9000;
 
app.use(bodyParser.json());
 
app.get("/github-webhook/alive", (req,res,next) => {
   res.status(200).json({message:"alive"})
})
app.post("/github-webhook/pushevent", (req, res) => {
    console.log("Received webhook event:", req.body);
    res.sendStatus(200);
    processWebhook(req.body);
});
 
app.listen(PORT, () => console.log(`Webhook listener running on port ${PORT}`));