// server.js
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const path = require("path");

const app = express();

// 🔹 Middleware
app.use(cors());
app.use(express.json());

// 🔹 Logger middleware: Logs every request
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 🔹 Static file middleware: Serve images from /images folder
app.use("/images", express.static(path.join(__dirname, "images")));

// 🔹 MongoDB Atlas connection (SRV string)
const uri = "mongodb+srv://gmuriithiwamwangi_db_user:Nyand2k27Grvn@cluster0.ql0owo1.mongodb.net/afterschool?retryWrites=true&w=majority";
const client = new MongoClient(uri);

let db;

// 🔹 Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        db = client.db("afterschool");
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ Connection Error:", err);
    }
}
connectDB();

// 🔹 TEST ROUTE
app.get("/test", async (req, res) => {
    res.send("Backend working!");
});

// 🔹 GET /lessons - Return all lessons
app.get("/lessons", async (req, res) => {
    try {
        const lessons = await db.collection("lessons").find().toArray();
        res.json(lessons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 POST /orders - Save an order
app.post("/orders", async (req, res) => {
    try {
        const { name, phone, lessonIDs, spaces } = req.body;

        // Validate required fields
        if (!name || !phone || !lessonIDs || !spaces) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const order = { name, phone, lessonIDs, spaces, createdAt: new Date() };
        await db.collection("orders").insertOne(order);
        res.json({ message: "Order saved!", order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 PUT /lessons/:id - Update any lesson field
app.put("/lessons/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const result = await db.collection("lessons").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        res.json({ message: "Lesson updated!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 SEARCH /search?q=keyword - Search across topic, location, price, space
app.get("/search", async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) return res.json([]);

        const lessons = await db.collection("lessons").find({
            $or: [
                { topic: { $regex: q, $options: "i" } },
                { location: { $regex: q, $options: "i" } },
                { price: { $regex: q, $options: "i" } },
                { space: { $regex: q, $options: "i" } }
            ]
        }).toArray();

        res.json(lessons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});