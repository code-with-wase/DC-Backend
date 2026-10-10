
import "dotenv/config";
import express from "express";
import cors from "cors";

import connectDB from "./src/db/db.js";
import authRoutes from "./src/route/authRoutes.js";
import productRoutes from "./src/route/productRoutes.js";
import dns from 'dns';
dns.setServers(["1.1.1.1","8.8.8.8"]);


// =====================================================
// EXPRESS APP
// =====================================================

const app = express();

// =====================================================
// CORS CONFIGURATION
// =====================================================

const allowedOrigins = (
    process.env.FRONTEND_URL || "http://localhost:3000"
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            // Allow requests without an Origin header, such as Postman.
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Origin not allowed by CORS"));
        },
        credentials: true,
    })
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(
    express.json({
        limit: "1mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb",
    })
);

// =====================================================
// DATABASE INITIALIZATION CACHE
// =====================================================

let initializationPromise = null;

const initializeApp = async () => {
    if (!initializationPromise) {
        initializationPromise = connectDB().catch((error) => {
            initializationPromise = null;
            throw error;
        });
    }

    await initializationPromise;
};

// =====================================================
// DATABASE INITIALIZATION MIDDLEWARE
// =====================================================

app.use(async (req, res, next) => {
    try {
        await initializeApp();
        next();
    } catch (error) {
        next(error);
    }
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Deluxe Culture API is running.",
        environment: process.env.NODE_ENV || "development",
    });
});

app.get("/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "API is healthy.",
        timestamp: new Date().toISOString(),
    });
});

// =====================================================
// API ROUTES
// =====================================================

app.use("/auth", authRoutes);
app.use("/products", productRoutes);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error.message === "Origin not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "Origin not allowed.",
        });
    }

    console.error("API Error:", error.message);

    return res.status(error.status || 500).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Internal server error."
                : error.message,
    });
});

// =====================================================
// LOCAL SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
    initializeApp()
        .then(() => {
            app.listen(PORT, () => {
                console.log(
                    `Deluxe Culture API running on port ${PORT}`
                );
                console.log(`http://localhost:${PORT}`);
            });
        })
        .catch((error) => {
            console.error("Application initialization failed:", error.message);
            process.exit(1);
        });
}

// =====================================================
// VERCEL EXPORT
// =====================================================

export default app;
