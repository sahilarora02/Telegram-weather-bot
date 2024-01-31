const TelegramBot = require("node-telegram-bot-api");
const WeatherEmoji = require("./WeatherEmoji");
const User = require("./user.model");
const mongoose = require("mongoose");
const cron = require("node-cron");
require("dotenv").config();
const token = process.env.TELEGRAM_TOKEN;
const weatherKey = process.env.WEATHER_API_KEY;
let selectedState = "New Delhi";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
    // Start your server or perform other operations after the database connection is established.
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

connectToDatabase();

const DeveloperDetail_Question = "Who is my coder? click on /developer";
let saveUser = true;
const bot = new TelegramBot(token, { polling: true });
const states = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const handleAsyncErrors = async (promise) => {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error, null];
  }
};
const weatherE = new WeatherEmoji(process.env.SECRET_KEY);

async function GetEmoji(place) {
  const emojiNewYork = await weatherE.getWeather(place, true);
  return emojiNewYork.emoji;
}

async function GiveWeatherDetails(chatId, state) {
  try {
    const apiUrl = `http://api.weatherapi.com/v1/current.json?key=${weatherKey}&q=${state}&aqi=no`;

    const response = await fetch(apiUrl);
    const weatherData = await response.json();

    const temperatureCelsius = weatherData.current.temp_c;
    const weatherUpdate = `Today's temperature in ${state} : ${temperatureCelsius}°C,
    
  emoji for u: ${await GetEmoji(state)}`;
    bot.sendMessage(chatId, weatherUpdate);
  } catch (error) {
    console.log(error);
  }
}

const getWeatherFact = async () => {
  const apiUrl = "https://opentdb.com/api.php?amount=1&category=9&type=boolean";
  const [error, response] = await handleAsyncErrors(fetch(apiUrl));

  if (!error) {
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const generalFact = data.results[0].question;

      if (generalFact.toLowerCase().includes("weather")) {
        return generalFact;
      }
    }
  } else {
    console.error("Error fetching weather fact:", error.message);
  }

  return getWeatherFact();
};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const msgText = msg.text;

  if (msgText === "/start") {
    bot.sendMessage(
      chatId,
      `Welcome to the Xoxo weather bot! You can subscribe for daily weather updates by typing /daily_updates. Want the current temperature? Type /current_temperature and ${DeveloperDetail_Question}`
    );
  } else if (msgText === "/daily_updates") {
    saveUser = true
    showStateKeyboard(chatId);
  } else if (msgText === "/current_temperature") {
    saveUser = false;
    showStateKeyboard(chatId);
  } else if (msgText.includes("/developer")) {
    bot.sendMessage(chatId, "I was developed by Sahil Arora");
  } else if(msgText === '/unsubscribe'){

  } else if (msgText === "/fact") {
    getWeatherFact().then((weatherFact) => {
      if (weatherFact) {
        bot.sendMessage(chatId, `Here is your fact:\n${weatherFact}`);
      } else {
        console.log("Failed to fetch a weather fact.");
      }
    });
  } else if (states.includes(msgText)) {
    const state = msgText;
    selectedState = state;
    if (saveUser) {
      const user = await User.create({
        userId: chatId,
        userState: state,
      });
    }

    GiveWeatherDetails(chatId, selectedState);
  }
});
bot.onText(/\/unsubscribe/i, async (msg) => {
  const chatId = msg.chat.id;

  try {
    await User.findOneAndDelete({ userId: chatId });
    bot.sendMessage(chatId, "You have unsubscribed from daily weather updates.");
  } catch (error) {
    console.error("Error unsubscribing:", error);
    bot.sendMessage(chatId, "An error occurred while unsubscribing. Please try again later.");
  }
});

const showStateKeyboard = (chatId) => {
  const keyboard = {
    keyboard: states.map((state) => [{ text: state }]),
    one_time_keyboard: true,
    resize_keyboard: true,
  };

  bot.sendMessage(chatId, "Choose your state:", {
    reply_markup: JSON.stringify(keyboard),
  });
};

cron.schedule(
  "0 9 * * *",  
  async () => {
    try {
      const users = await User.find();
      const weatherPromises = users.map((user) =>
      weatherE.getWeather(user.userState, true)
      );

      const weatherDataList = await Promise.all(weatherPromises);

      weatherDataList.forEach((weatherData, index) => {
        const user = users[index];
        const temperatureCelsius = weatherData.temperature.actual;
        const weatherUpdate = `Good Morning! Today's temperature in ${user.userState}: ${temperatureCelsius}°C, emoji for you: ${weatherData.emoji}`;
        bot.sendMessage(user.userId, weatherUpdate);
      });
    } catch (error) {
      console.error("Error fetching users or weather details:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);
