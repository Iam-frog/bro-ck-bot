const axios = require("axios");
const math = require("mathjs");

const userSettings = {}; 

const textQuestions = {
  easy: [
    "If you have {num1} apples and get {num2} more, how many do you have?",
    "What is {num1} plus {num2}?",
    "A train moves at {num1} km/h for {num2} hours. How far does it travel?",
    "If you have {num1} dollars and spend {num2}, how much is left?"
  ],
  normal: [
    "What is the square root of {num1}?",
    "A triangle has angles of {num2}° and {num3}°. What is the third angle?",
    "If a car moves at {num1} m/s, how far does it go in {num2} seconds?",
    "If you earn ${num1} per hour and work {num2} hours, how much do you earn?"
  ],
  hard: [
    "What is the derivative of {num1}x²?",
    "Solve for x: {num1}x + {num2} = {num3}",
    "A cylinder has a radius of {num1} cm and height {num2} cm. What is its volume?"
  ],
  difficult: [
    "What is the integral of {num1}x dx?",
    "What is the sum of the first {num1} natural numbers?",
    "Solve for x: {num1}x² + {num2}x + {num3} = 0."
  ]
};

module.exports = {
  config: {
    name: "mathx",
    version: 1.2,
    author: "UPoL 🐔",
    longDescription: "Solve random math questions with different difficulty levels!",
    category: "Games",
    guide: {
      en: "{p}{n} set <mode> <type> - Set difficulty & type\n{p}{n} - Start a math game",
    },
  },

  onStart: async function ({ args, message, event, api }) {
    const chatID = event.senderID;

    if (args[0] === "set") {
      const mode = args[1]?.toLowerCase();
      const type = args[2]?.toLowerCase();

      const validModes = ["easy", "normal", "hard", "difficult"];
      const validTypes = ["text", "number"];

      if (!validModes.includes(mode) || !validTypes.includes(type)) {
        return message.reply(
          " Invalid settings! Use: `math set <mode> <type>`\n\nModes: easy, normal, hard, difficult\nTypes: text, number"
        );
      }

      userSettings[chatID] = { mode, type };
      return message.reply(`✅ Game settings updated! \nMode: ${mode} \nType: ${type}`);
    }

    if (!userSettings[chatID]) {
      userSettings[chatID] = { mode: "normal", type: "text" };
    }

    const { mode, type } = userSettings[chatID];

    let questionData;
    if (type === "number") {
      questionData = generateMathQuestion(mode);
    } else {
      questionData = generateTextQuestion(mode);
    }

    const { question, correctAnswer } = questionData;

    const wrongAnswers = generateWrongAnswers(correctAnswer);

    const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    let optionsText = allAnswers.map((ans, i) => `${i + 1}️⃣ ${ans}`).join("\n");

    message.reply(
      ` Math Challenge!\n\n❓ Question: ${question}\n\n${optionsText}\n\n Reply with [ 1, 2, 3 & 4 ] option number!\n You have 1 minute to answer!`,
      (err, info) => {
        if (!err) {
          const messageID = info.messageID;

          global.GoatBot.onReply.set(messageID, {
            commandName: this.config.name,
            messageID: messageID,
            author: event.senderID,
            correctAnswer: correctAnswer,
            options: allAnswers,
          });
          setTimeout(() => {
            api.unsendMessage(messageID);
            global.GoatBot.onReply.delete(messageID);
          }, 60000); 
        }
      }
    );
  },

  onReply: async function ({ message, event, api }) {
    try {
      const userAnswer = event.body.trim();
      const replyData = global.GoatBot.onReply.get(event.messageReply.messageID);

      if (!replyData || replyData.author !== event.senderID) {
        return;
      }

      const { correctAnswer, options, messageID } = replyData;
      const userSelectedAnswer = options[parseInt(userAnswer) - 1];

      if (!userSelectedAnswer) {
        return message.reply("⚠️ Invalid choice! Please select a valid option (1-4).");
      }

      if (parseFloat(userSelectedAnswer) === parseFloat(correctAnswer)) {
        message.reply("🎉 Correct! You win!");
      } else {
        message.reply(`❌ Wrong answer! The correct answer was ${correctAnswer}.`);
      }

      api.unsendMessage(messageID);
      global.GoatBot.onReply.delete(event.messageReply.messageID);
    } catch (error) {
      console.error("Error checking answer:", error.message);
      message.reply("⚠️ An error occurred. Try again.");
    }
  },
};

function generateMathQuestion(mode) {
  let num1 = randomInt(1, 100);
  let num2 = randomInt(1, 100);
  let question;
  let correctAnswer;

  if (mode === "easy") {
    question = `${num1} + ${num2}`;
    correctAnswer = num1 + num2;
  } else if (mode === "normal") {
    question = `${num1} * ${num2}`;
    correctAnswer = num1 * num2;
  } else if (mode === "hard") {
    question = `√${num1 * num1}`;
    correctAnswer = num1;
  } else if (mode === "difficult") {
    question = `log(${num1 * 10})`;
    correctAnswer = Math.log10(num1 * 10).toFixed(2);
  }

  return { question, correctAnswer };
}

function generateTextQuestion(mode) {
  const questionTemplate = randomChoice(textQuestions[mode]);
  const num1 = randomInt(1, 100);
  const num2 = randomInt(1, 100);
  const num3 = 180 - num1 - num2;
  const question = questionTemplate.replace("{num1}", num1).replace("{num2}", num2).replace("{num3}", num3);
  return { question, correctAnswer: eval(num1 + num2) };
}

function generateWrongAnswers(correctAnswer) {
  let wrongAnswers = [];
  for (let i = 0; i < 3; i++) {
    wrongAnswers.push((parseFloat(correctAnswer) + randomInt(1, 10)).toFixed(2));
  }
  return wrongAnswers;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}
