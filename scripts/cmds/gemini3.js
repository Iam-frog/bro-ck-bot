const axios = require('axios');
const Data = {};

module.exports = {
  config: {
    name: "g",
    version: 2.0,
    author: "UPoL 🐔",
    longDescription: "Google ai ",
    category: "ai",
    guide: {
      en: "{p}{n} questions",
    },
  },
  onStart: async function ({ args, message, event, Reply, api }) {
    try {
      if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments[0].type === "photo") {
        const photoUrl = encodeURIComponent(event.messageReply.attachments[0].url);
        const providingPrompt = args.join(" ");
        const url = `https://upol-piu.onrender.com/gemini2?prompt=${encodeURIComponent(providingPrompt)}&url=${photoUrl}`;
        const response = await axios.get(url);

        message.reply(response.data.answer);
        return;
      }

      const prompt = args.join(' ');
      const chat = event.senderID;

      if (prompt.toLowerCase() === "reset") {
        delete Data[chat];
        message.reply('Successfully reset your information.');
        return;
      }

      if (!Data[chat]) {
        Data[chat] = prompt;
      } else {
        Data[chat] += '\n' + prompt;
      }

      const encodedPrompt = encodeURIComponent(Data[chat]);

      if (!encodedPrompt) {
        return message.reply("Please provide questions");
      }

      const response = await axios.get(`https://upol-gemini-main.onrender.com/geminiv2?prompt=${encodedPrompt}`);
      const answer = response.data.response;

      message.reply({
        body: `${answer}`,
      }, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID
        });
      });
    } catch (error) {
      console.error("Error:", error.message);
    }
  },
  onReply: async function ({ args, message, event, Reply, api }) {
    try {
      const prompt = args.join(' ');
      const chat = event.senderID;

      if (prompt.toLowerCase() === "reset") {
        delete Data[chat];
        message.reply('Successfully reset your information.');
        return;
      }

      if (!Data[chat]) {
        Data[chat] = prompt;
      } else {
        Data[chat] += '\n' + prompt;
      }

      
      const encodedPrompt = encodeURIComponent(Data[chat]);

      const response = await axios.get(`https://upol-gemini-main.onrender.com/geminiv2?prompt=${encodedPrompt}`);
      const answer = response.data.response;

      message.reply({
        body: `${answer}`,
      }, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: event.senderID
        });
      });
    } catch (error) {
      console.error("Error:", error.message);
    }
  }
};
