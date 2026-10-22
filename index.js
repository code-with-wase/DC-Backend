import "dotenv/config";
import express from "express";
import cors from "cors";
import dns from "dns";

import connectDB from "./src/db/db.js";
import authRoutes from "./src/route/authRoutes.js";
import cartRoutes from "./src/route/cartRoutes.js";
import productRoutes from "./src/route/productRoutes.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb",
    })
);

let initializationPromise;

const initializeApp = async () => {
    if (!initializationPromise) {
        initializationPromise = connectDB().catch((error) => {
            initializationPromise = null;
            throw error;
        });
    }

    await initializationPromise;
};

app.use(async (req, res, next) => {
    try {
        await initializeApp();
        next();
    } catch (error) {
        next(error);
    }
});

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Deluxe Culture API is running.",
        environment: process.env.NODE_ENV || "development",
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is healthy.",
        timestamp: new Date().toISOString(),
    });
});

app.use("/auth", authRoutes);
app.use("/cart", cartRoutes);
app.use("/products", productRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    console.error("API Error:", error.message);

    res.status(error.status || 500).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Internal server error."
                : error.message,
    });
});

if (process.env.NODE_ENV !== "production") {
    initializeApp()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Deluxe Culture API running on port ${PORT}`);
                console.log(`http://localhost:${PORT}`);
            });
        })
        .catch((error) => {
            console.error(
                "Application initialization failed:",
                error.message
            );
            process.exit(1);
        });
}

export default app;