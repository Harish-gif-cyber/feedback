const express = require("express");
const path = require("path");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const VERSION = process.env.VERSION || "v1";

const versionNumber = Number(VERSION.replace("v", ""));

if (![1, 2, 3].includes(versionNumber)) {
    throw new Error("VERSION must be v1, v2, or v3");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Sample feedback entries for demonstrating v2 and v3.
const feedbackEntries = [
    {
        id: 1,
        name: "Rahul",
        rating: 5,
        message: "Excellent service",
        createdAt: "2026-10-20T10:00:00.000Z"
    },
    {
        id: 2,
        name: "Priya",
        rating: 4,
        message: "Good experience",
        createdAt: "2026-10-21T10:00:00.000Z"
    },
    {
        id: 3,
        name: "Arun",
        rating: 3,
        message: "Service can improve",
        createdAt: "2026-10-22T10:00:00.000Z"
    },
    {
        id: 4,
        name: "Sneha",
        rating: 5,
        message: "Very helpful",
        createdAt: "2026-10-23T10:00:00.000Z"
    }
];

let nextFeedbackId = 5;

function requireVersion(requiredVersion, res) {
    if (versionNumber !== requiredVersion) {
        res.status(403).json({
            error: `This feature is available only in v${requiredVersion}`
        });

        return false;
    }

    return true;
}

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        version: VERSION,
        application: "Feedback System",
        registrationNumber: "24MIS0031"
    });
});

// V1: Submit feedback
app.post("/feedback", (req, res) => {
    if (!requireVersion(1, res)) {
        return;
    }

    const { name, rating, message } = req.body;

    if (
        typeof name !== "string" ||
        !name.trim() ||
        !Number.isInteger(Number(rating)) ||
        Number(rating) < 1 ||
        Number(rating) > 5 ||
        typeof message !== "string" ||
        !message.trim()
    ) {
        return res.status(400).json({
            error: "Provide a name, a rating from 1 to 5, and feedback"
        });
    }

    const feedback = {
        id: nextFeedbackId++,
        name: name.trim(),
        rating: Number(rating),
        message: message.trim(),
        createdAt: new Date().toISOString()
    };

    feedbackEntries.push(feedback);

    res.status(201).json({
        message: "Feedback submitted successfully",
        feedback
    });
});

// V2: View all feedback
app.get("/feedback", (req, res) => {
    if (!requireVersion(2, res)) {
        return;
    }

    res.json({
        count: feedbackEntries.length,
        feedback: feedbackEntries
    });
});

// V3: Filter and sort feedback
app.get("/feedback/filter", (req, res) => {
    if (!requireVersion(3, res)) {
        return;
    }

    let results = [...feedbackEntries];

    const rating = req.query.rating;
    const sort = req.query.sort || "latest";

    // Filter by rating when supplied.
    if (rating !== undefined) {
        const ratingNumber = Number(rating);

        if (
            !Number.isInteger(ratingNumber) ||
            ratingNumber < 1 ||
            ratingNumber > 5
        ) {
            return res.status(400).json({
                error: "Rating must be an integer between 1 and 5"
            });
        }

        results = results.filter(
            item => item.rating === ratingNumber
        );
    }

    // Sort the results.
    if (sort === "latest") {
        results.sort(
            (a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
        );
    } else if (sort === "oldest") {
        results.sort(
            (a, b) =>
                new Date(a.createdAt) - new Date(b.createdAt)
        );
    } else if (sort === "rating-high") {
        results.sort(
            (a, b) => b.rating - a.rating
        );
    } else if (sort === "rating-low") {
        results.sort(
            (a, b) => a.rating - b.rating
        );
    } else if (sort === "name") {
        results.sort(
            (a, b) => a.name.localeCompare(b.name)
        );
    } else {
        return res.status(400).json({
            error: "Invalid sort option"
        });
    }

    res.json({
        count: results.length,
        filters: {
            rating: rating || "all",
            sort
        },
        feedback: results
    });
});

// Unsupported routes
app.use((req, res) => {
    res.status(404).json({
        error: "Endpoint not found"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Feedback System ${VERSION} running on port ${PORT}`
    );
});