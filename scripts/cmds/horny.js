const axios = require('axios');
const Data = {};

module.exports = {
  config: {
    name: "horny",
    version: 2.0,
    author: "UPoL 🐔",
    longDescription: "Google ai ",
    category: "ai",
    guide: {
      en: "{p}{n} questions",
    },
  },
  onStart: async function ({ args, message, event, Reply, api }) {
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

      const response = await axios.get(`https://upol-gpts-apis.onrender.com/horny-ai?prompt=${encodedPrompt}`);
      const answer = response.data.answer;

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

      const response = await axios.get(`https://upol-gpts-apis.onrender.com/horny-ai?prompt=${encodedPrompt}`);
      const answer = response.data.answer;

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
