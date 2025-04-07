const axios = require('axios');

module.exports = {
  config: {
    name: "quiz",
    aliases: ["trivia"],
    version: "1.1",
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
      en: "{pn} [category | list]\nUse without category to get a random quiz\nUse 'list' to view available categories"
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

      return api.sendMessage(
        `✅ ${nameUser}, you answered correctly!\nAnswer: ${correctAnswer}\n\nYou've earned:\n- 💰 ${rewardCoins} coins\n- ✨ ${rewardExp} EXP`,
        event.threadID, event.messageID
      );
    } else {
      api.unsendMessage(Reply.messageID).catch(console.error);
      return api.sendMessage(`${nameUser}, that’s incorrect!\nCorrect answer: ${correctAnswer}`, event.threadID);
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID } = event;

    try {
      const response = await axios.get('https://upol-quiz-game.onrender.com/categories');
      const categories = response.data.categories;

      if (args[0]?.toLowerCase() === "list") {
        const listMsg = `Quiz Categories:\n\n` +
          categories.map((cat, i) => `• ${i + 1}. ${cat.charAt(0).toUpperCase() + cat.slice(1)}`).join("\n") +
          `\n\nUse: quiz <category>`;
        return api.sendMessage(listMsg, threadID, messageID);
      }

      let category;
      if (args.length === 0) {
        category = categories[Math.floor(Math.random() * categories.length)];
      } else {
        category = args.join(" ").toLowerCase();
        if (!categories.includes(category)) {
          return api.sendMessage(`❌ Invalid category!\nUse “quiz list” to see available categories.`, threadID, messageID);
        }
      }

      const quizRes = await axios.get(`https://upol-quiz-game.onrender.com/categories/${category}`);
      const quizData = quizRes.data.questions[Math.floor(Math.random() * quizRes.data.questions.length)];
      const { question, options, answer } = quizData;
      const namePlayerReact = await usersData.getName(event.senderID);

      let optionsText = "";
      for (const [key, value] of Object.entries(options)) {
        optionsText += `${key}: ${value}\n`;
      }

      const msg = {
        body: `${category.toUpperCase()}\n___________________\n❓ ${question}\n\n${optionsText}\nReply with the correct option (A, B, C, D):`
      };

      api.sendMessage(msg, threadID, async (error, info) => {
        if (!error) {
          global.GoatBot.onReply.set(info.messageID, {
            type: "reply",
            commandName: "quiz",
            author: event.senderID,
            messageID: info.messageID,
            questionData: quizData,
            correctAnswer: answer,
            nameUser: namePlayerReact
          });
        }
      });

    } catch (err) {
      console.error("Error:", err);
      return api.sendMessage("❌ Failed to fetch quiz or categories. Please try again later.", threadID, messageID);
    }
  }
};
