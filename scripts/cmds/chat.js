
const axios = require('axios');

module.exports = {
  config: {
    name: "chat",
    version: 2.0,
    author: "UPoL",
    longDescription: "SIM chat",
    category: "fun",
    guide: {
      en: "{p}{n} questions",
    },
  },
  makeApiRequest: async function (lado) {
    try {
      const response = await axios.get(`https://upol-dev-simsimi-api.onrender.com/sim?chat=${lado}&lang=en`);
      return response.data.answer;
    } catch (error) {
      throw error;
    }
  },
  handleCommand: async function ({ message, event, args, api }) {
    try {
      const lado = encodeURIComponent(args.join(" "));

      if (!lado) {
        return message.reply("👀 | Say something baka..!");
      }

      const result = await this.makeApiRequest(lado);

      message.reply({
        body: `${result}`,
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
  onStart: function (params) {
    return this.handleCommand(params);
  },
  onReply: function (params) {
    return this.handleCommand(params);
  },
};
