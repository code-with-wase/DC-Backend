import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./src/db/db.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log("Super Admin email configured:", Boolean(process.env.SUPER_ADMIN_EMAIL));
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();