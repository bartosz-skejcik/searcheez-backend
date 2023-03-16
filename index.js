const express = require("express");
const puppeteer = require("puppeteer");

// setup bodyparser
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());

// setup cors
const cors = require("cors");
app.use(cors());

// set access control headers
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") {
        res.header(
            "Access-Control-Allow-Methods",
            "PUT, POST, PATCH, DELETE, GET"
        );
        return res.status(200).json({});
    }
    next();
});

app.post("/search", (req, res) => {
    const { query, lang, categories, pageno } = req.body;
    const q = query.replace(" ", "%20");
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto(
            `http://localhost:8080/search?q=${q}&language=${
                lang ?? "en_US"
            }&safesearch=0&categories=${categories ?? "general"}&pageno=${
                pageno ?? 1
            }&format=json`
        );

        // Set screen size
        await page.setViewport({ width: 1080, height: 1024 });

        // get the pre tag content
        const content = await page.waitForSelector("pre");

        // get the text content
        const text = await page.evaluate(
            (content) => content.textContent,
            content
        );

        // parse the json
        const json = JSON.parse(text);

        await browser.close();

        // create timestamp like 2020-01-01 00:00:00
        const timestamp = new Date()
            .toISOString()
            .replace(/T/, " ")
            .replace(/\..+/, "")
            .replace(/(\d{2}:\d{2}:\d{2})/, (match, p1) => {
                const [hours, minutes, seconds] = p1.split(":");
                const newHours = parseInt(hours) + 1;
                return `${newHours}:${minutes}:${seconds}`;
            });

        console.log("[" + timestamp + "] POST /search -> OK");

        res.json(json);
    })();
});

// start server
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
