const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("API Gateway is running");
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});