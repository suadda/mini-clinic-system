const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Standard API Response Formatting Middleware
app.use((req, res, next) => {
    res.sendSuccess = (data = {}, message = "Success", statusCode = 200) => {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    };

    res.sendError = (errors = {}, message = "Validation Error", statusCode = 400) => {
        return res.status(statusCode).json({
            success: false,
            message,
            errors
        });
    };
    next();
});

// Basic Health Check Endpoint
app.get('/', (req, res) => {
    res.sendSuccess({}, "Mini Clinic Information System API is running");
});

// Server Initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});