const TelegramBot = require("node-telegram-bot-api");
const WeatherEmoji = require("weather-emoji");

require("dotenv").config();
const token = process.env.TELEGRAM_TOKEN;
const weatherKey = process.env.WEATHER_API_KEY;
let selectedState = 'New Delhi';
const DeveloperDetail_Question = "Who is my coder? click on /developer";
const bot = new TelegramBot(token, { polling: true });
const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh" , "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const msgText = msg.text;
  
  if (msgText === "/start") {
    bot.sendMessage(
      chatId,
      `Welcome to the Xoxo weather bot! You can subscribe for daily weather updates by typing /subscribe. and ${DeveloperDetail_Question}`
    );
  } else if (msgText === "/subscribe") {
    // GiveWeatherDetails(chatId, selectedState);
    showStateKeyboard(chatId);
  } else if (msgText.includes("/developer")) {
    bot.sendMessage(chatId, "I was developed by Sahil Arora");
  } else if (msgText === "/fact") {
    getWeatherFact().then((weatherFact) => {
      if (weatherFact) {
        bot.sendMessage(chatId, `Here is your fact:\n${weatherFact}`);
      } else {
        console.log("Failed to fetch a weather fact.");
      }
    });
  }else if (states.includes(msgText)) {
    const state = msgText;
    console.log("Received state command:", state);
    selectedState = state

    GiveWeatherDetails(chatId, selectedState);
  } else {
    bot.sendMessage(chatId, "Nope");
  }
});

function showStateKeyboard(chatId) {
  

  const keyboard = {
    keyboard: states.map((state) => [{ text: state }]),
    one_time_keyboard: true,
    resize_keyboard: true
  };

  bot.sendMessage(chatId, "Choose your state:", {
    reply_markup: JSON.stringify(keyboard)
  });
}

async function GiveWeatherDetails(chatId, state) {
  try {
    const apiUrl = `http://api.weatherapi.com/v1/current.json?key=${weatherKey}&q=India&aqi=no`;

    const response = await fetch(apiUrl);
    const weatherData = await response.json();

    const temperatureCelsius = weatherData.current.temp_c;
    const weatherUpdate = `Today's temperature in ${state} : ${temperatureCelsius}°C,
    
  emoji for u: ${await GetEmoji(
      state
    )}`;
    bot.sendMessage(chatId, weatherUpdate);
  } catch (error) {
    console.log(error);
  }
}

async function getWeatherFact() {
  try {
    const apiUrl =
      "https://opentdb.com/api.php?amount=1&category=9&type=boolean";

    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const generalFact = data.results[0].question;

      if (generalFact.toLowerCase().includes("weather")) {
        return generalFact;
      }
    }

    return getWeatherFact();
  } catch (error) {
    console.error("Error fetching weather fact:", error.message);
    return null;
  }
}

async function GetEmoji(place) {
  const weatherEmoji = new WeatherEmoji(process.env.SECRET_KEY);
  const emojiNewYork = await weatherEmoji.getWeather(place, true);
  return emojiNewYork.emoji;
}
