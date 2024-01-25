const TelegramBot = require("node-telegram-bot-api");
// const WeatherEmoji = require('weather-emoji').default;
require("dotenv").config();
const token = process.env.TELEGRAM_TOKEN;
const weatherKey = process.env.WEATHER_API_KEY;

const DeveloperDetail_Question = 'Who is my coder? click on /developer'

const bot = new TelegramBot(token, { polling: true });
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const msgText = msg.text;
  if (msgText === "/start") {
    bot.sendMessage(
      chatId,
      `Welcome to the Xoxo weather bot! You can subscribe for daily weather updates by typing /subscribe. and ${DeveloperDetail_Question}`
    );
  } else if (msgText === "/subscribe") {
    // const weatherEmoji = new WeatherEmoji(weatherKey);
    // const emojiT = weatherEmoji.getWeather("paris", true).then(data => data);
    // console.log(emojiT)
    GiveWeatherDetails(chatId);
  } else if(msgText.includes('/developer')) {
      bot.sendMessage(chatId, "I was developer by Sahil Arora")
  }else{

    bot.sendMessage(
      chatId,
      "https://tse2.mm.bing.net/th?id=OIP.Nxdd_pAJVU7a-j49_WjAPQHaKF&pid=Api&P=0&w=300&h=300"
    );
  }
  console.log(msg);
});

async function GiveWeatherDetails(chatId) {
  try {
    const apiUrl = `http://api.weatherapi.com/v1/current.json?key=${weatherKey}&q=India&aqi=no`;

    const response = await fetch(apiUrl);
    const weatherData = await response.json();

    const temperatureCelsius = weatherData.current.temp_c;
    console.log(temperatureCelsius);
    const weatherUpdate = `Today's temperature in New Delhi: ${temperatureCelsius}°C`;
    bot.sendMessage(chatId, weatherUpdate);
  } catch (error) {
    console.log(error);
  }
}
