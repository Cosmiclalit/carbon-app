const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const Carbon = require("./models/carbon");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Gemini Setup
const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY,
});

// Socket connection
io.on("connection", (socket) => {
  console.log("User Connected");
});

app.post("/calculate", async (req, res) => {
  try {
    const { electricity, acHours, transport, shopping } = req.body;
    console.log(req.body)

     const ELECTRICITY_FACTOR = 0.82; // kg CO2 per kWh (India avg)
    const AC_POWER_CONSUMPTION = 1.5; // kWh per hour (1.5 ton AC)
    const SHOPPING_FACTOR = 3; // kg CO2 per online order

    // ===== 3️⃣ Electricity CO2 =====
    const electricityCO2 = electricity * ELECTRICITY_FACTOR;

    // ===== 4️⃣ AC CO2 (monthly) =====
    const acUnitsMonthly = acHours * 30 * AC_POWER_CONSUMPTION;
    const acCO2 = acUnitsMonthly * ELECTRICITY_FACTOR;

    // ===== 5️⃣ Transport CO2 (monthly approx) =====
    let transportCO2 = 0;

    switch (transport) {
      case "Public":
        transportCO2 = 30;
        break;
      case "private":
        transportCO2 = 50;
        break;
      default:
        transportCO2 = 50;
    }

    // ===== 6️⃣ Shopping CO2 =====
    const shoppingCO2 = shopping * SHOPPING_FACTOR;

    // ===== 7️⃣ Total CO2 =====
    const totalCO2 =
      electricityCO2 +
      acCO2 +
      transportCO2 +
      shoppingCO2;
     
      console.log(totalCO2);
      let category = "";
       if (totalCO2 <= 150) {
      category = "Green";
    } else if (totalCO2 <= 350) {
      category = "Yellow";
    } else {
      category = "Red";
    }

    const prompt = `
User carbon footprint: ${totalCO2.toFixed(2)} kg.

Suggest improvements and for this amount of user carbon footprint it lies in the zone ${category}.
`;

    const responseAI = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let rating = "Green";
    let notificationMessage = "Great Job! Keep it up 🌿";

    if (totalCO2 > 200) {
      rating = "Red";
      notificationMessage = "⚠️ High Carbon Alert! Reduce usage immediately.";
    } else if (totalCO2 > 100) {
      rating = "Yellow";
      notificationMessage = "⚡ Moderate impact. Try improving habits.";
    }

    // Save in MongoDB
    const newEntry = new Carbon({
      electricity,
      acHours,
      transport,
      shopping,
      totalCO2,
      rating
    });

    await newEntry.save();

    // Send notification via WebSocket
    io.emit("notification", notificationMessage);

    res.json({
      totalCO2: totalCO2.toFixed(2),
      rating,
      aiAdvice: responseAI.text,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5000;
server.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);