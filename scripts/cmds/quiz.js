const axios = require('axios');

module.exports = {
  config: {
    name: "quiz",
    aliases: ["trivia"],
    version: "1.0",
    author: "UPoL 🐔",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Play a random quiz"
    },
    longDescription: {
      en: "Play a random quiz game and earn rewards for correct answers."
    },
    category: "game",
    guide: {
      en: "{pn} [category]\nIf no category is specified, available categories will be shown."
    },
  },

  onReply: async function ({ args, event, api, Reply, usersData }) {
    const { questionData, correctAnswer, nameUser } = Reply;
    if (event.senderID !== Reply.author) return;

    const userReply = event.body.trim().toUpperCase();
    if (userReply === correctAnswer.toUpperCase()) {
      api.unsendMessage(Reply.messageID).catch(console.error);

      const rewardCoins = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
      const rewardExp = Math.floor(Math.random() * (10 - 5 + 1)) + 5; 

      const senderID = event.senderID;
      const userData = await usersData.get(senderID);
      await usersData.set(senderID, {
        money: userData.money + rewardCoins,
        exp: userData.exp + rewardExp,
        data: userData.data
      });

      const msg = {
        body: `✅ ${nameUser}, You've answered correctly!\nAnswer: ${correctAnswer}\nYou've received ${rewardCoins} coins and ${rewardExp} exp as a reward!`
      };
      return api.sendMessage(msg, event.threadID, event.messageID);
    } else {
      api.unsendMessage(Reply.messageID).catch(console.error);
      const msg = `${nameUser}, The answer is wrong! The correct answer is: ${correctAnswer}`;
      return api.sendMessage(msg, event.threadID);
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID } = event;

    if (args.length === 0) {
      try {
        const response = await axios.get('https://upol-quiz-game.onrender.com/categories');
        const categories = response.data.categories.join(", ");
        return api.sendMessage(`Available categories: ${categories}`, threadID, messageID);
      } catch (error) {
        console.error("Error fetching categories:", error);
        return api.sendMessage("An error occurred while fetching the available categories. Please try again later.", threadID, messageID);
      }
    }

    const category = args.join(" ").toLowerCase();
    try {
      const response = await axios.get(`https://upol-quiz-game.onrender.com/categories/${category}`);
      const quizData = response.data.questions[Math.floor(Math.random() * response.data.questions.length)];
      const { question, options, answer } = quizData;
      const namePlayerReact = await usersData.getName(event.senderID);

      let optionsText = "";
      for (const [key, value] of Object.entries(options)) {
        optionsText += `${key}: ${value}\n`;
      }

      const msg = {
        body: `❓ ${question}\n${optionsText}\n\nType the correct option (e.g., A, B, C, D):`
      };

      api.sendMessage(msg, threadID, async (error, info) => {
        if (error) {
          console.error("Error sending quiz message:", error);
          return;
        }

        global.GoatBot.onReply.set(info.messageID, {
          type: "reply",
          commandName: "quiz",
          author: event.senderID,
          messageID: info.messageID,
          questionData: quizData,
          correctAnswer: answer,
          nameUser: namePlayerReact
        });
      });
    } catch (error) {
      console.error("Error fetching quiz question:", error);
      return api.sendMessage("An error occurred while fetching the quiz question. Please try again later.", threadID, messageID);
    }
  }
};
