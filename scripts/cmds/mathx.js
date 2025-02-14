const axios = require("axios");
const math = require("mathjs");

const userSettings = {}; 

module.exports = {
  config: {
    name: "mathx",
    version: 1.3,
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
          " Invalid settings! Use: `math set <mode> <type>`\n\n Modes: easy, normal, hard, difficult\n Types: text, number"
        );
      }

      userSettings[chatID] = { mode, type };
      return message.reply(`✅ Game settings updated! \n Mode: ${mode} \n Type: ${type}`);
    }

    if (!userSettings[chatID]) {
      userSettings[chatID] = { mode: "normal", type: "text" };
    }

    const { mode, type } = userSettings[chatID];

    let questionData;
    if (type === "text") {
      questionData = generateTextQuestion(mode);
    } else {
      questionData = generateMathQuestion(mode);
    }

    const { question, correctAnswer } = questionData;
    const wrongAnswers = generateWrongAnswers(correctAnswer);
    const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

    let optionsText = allAnswers.map((ans, i) => `${i + 1}️⃣ ${ans}`).join("\n");

    message.reply(
      ` Math Challenge!\n\n❓ Question: ${question}\n\n${optionsText}\n\n Reply with [ 1, 2, 3 & 4 ] option number!\n\n You have 1 minute to answer!`,
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
        message.reply(`❌ Wrong answer!\n The correct answer was : ( ${correctAnswer} ).`);
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
  const operations = ["+", "-", "*", "/"];
  const trigonometric = ["sin", "cos", "tan"];
  const higherMath = ["log", "exp"];

  let question, correctAnswer;

  if (mode === "easy") {
    const num1 = randomInt(1, 20);
    const num2 = randomInt(1, 20);
    const operation = randomChoice(["+", "-"]);
    question = `${num1} ${operation} ${num2}`;
    correctAnswer = math.evaluate(question);
  } else if (mode === "normal") {
    const num1 = randomInt(10, 50);
    const num2 = randomInt(10, 50);
    const operation = randomChoice(operations);
    question = `${num1} ${operation} ${num2}`;
    correctAnswer = math.evaluate(question);
  } else if (mode === "hard") {
    const num = randomInt(1, 90);
    const operation = randomChoice(trigonometric);
    question = `${operation}(${num}°)`;
    correctAnswer = math.evaluate(`${operation}(${math.unit(num, "deg")})`).toFixed(2);
  } else if (mode === "difficult") {
    const operation = randomChoice(higherMath);
    const num = randomInt(1, 10);
    question = `${operation}(${num})`;
    correctAnswer = solveHigherMath(operation, num);
  }

  return { question, correctAnswer };
}

function generateTextQuestion(mode) {
  const textQuestions = {
    easy: [
      { q: "What is the sum of 10 and 5?", a: "15" },
      { q: "If you have 3 apples and get 2 more, how many do you have?", a: "5" },
    ],
    normal: [
      { q: "What is the square root of 64?", a: "8" },
      { q: "A triangle has angles of 60° and 60°. What is the third angle?", a: "60" },
    ],
    hard: [
      { q: "What is the derivative of x²?", a: "2x" },
      { q: "Solve for x: 2x + 3 = 7", a: "2" },
    ],
    difficult: [
      { q: "What is the integral of x dx?", a: "x²/2 + C" },
      { q: "What is the sum of the first 100 natural numbers?", a: "5050" },
    ],
  };

  const selectedQuestion = randomChoice(textQuestions[mode]);
  return { question: selectedQuestion.q, correctAnswer: selectedQuestion.a };
}

function generateWrongAnswers(correctAnswer) {
  let wrongAnswers = [];
  let numericAnswer = parseFloat(correctAnswer);
  
  if (!isNaN(numericAnswer)) {
    let offsets = [numericAnswer * 1.1, numericAnswer * 0.9, numericAnswer + 1, numericAnswer - 1];

    for (let i = 0; i < 3; i++) {
      wrongAnswers.push(offsets[i].toFixed(2));
    }
  } else {
    wrongAnswers = ["Unknown", "42", "None of the above"];
  }

  return wrongAnswers;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}
