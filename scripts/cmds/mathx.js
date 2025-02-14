const axios = require("axios");
const math = require("mathjs");

const userSettings = {}; 

module.exports = {
  config: {
    name: "math",
    version: 1.5,
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
          "⚠️ Invalid settings! Use: `math set <mode> <type>`\n\nModes: easy, normal, hard, difficult\nTypes: text, number"
        );
      }

      userSettings[chatID] = { mode, type };
      return message.reply(`✅ Game settings updated! \n Mode: ${mode} \n Type: ${type}`);
    }

    if (!userSettings[chatID]) {
      userSettings[chatID] = { mode: "normal", type: "text" };
    }

    const { mode, type } = userSettings[chatID];

    const questionData = type === "text" ? generateTextQuestion(mode) : generateMathQuestion(mode);
    const { question, correctAnswer } = questionData;

    const wrongAnswers = generateWrongAnswers(correctAnswer);
    const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    let optionsText = allAnswers.map((ans, i) => `${i + 1}️⃣ ${ans}`).join("\n");

    message.reply(
      `Math Challenge!\n\n❓ Question: ${question}\n\n${optionsText}\n\n Reply with the correct option number!\n You have 1 minute to answer!`,
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

      if (userSelectedAnswer.toString() === correctAnswer.toString()) {
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
  const templates = {
  "easy": [
    "If you have {num1} apples and get {num2} more, how many do you have?",
    "What is {num1} plus {num2}?",
    "A train moves at {num1} km/h for {num2} hours. How far does it travel?",
    "You buy {num1} packs of pencils, each containing {num2} pencils. How many do you have?",
    "If you have {num1} dollars and spend {num2}, how much is left?",
    "A box holds {num1} candies. You buy {num2} more boxes. How many candies in total?",
    "If a week has 7 days, how many days are there in {num1} weeks?",
    "What is double of {num1}?",
    "A book has {num1} pages. You read {num2} today. How many are left?",
    "If you wake up at {num1}:00 AM and school starts in {num2} hours, what time does school start?"
  ],
  "normal": [
    "What is the square root of {num1}?",
    "A triangle has angles of {num2}° and {num3}°. What is the third angle?",
    "If a car moves at {num1} m/s, how far does it go in {num2} seconds?",
    "If a shop sells {num1} apples per day, how many do they sell in {num2} weeks?",
    "How many times does {num1} go into {num2}?",
    "If you buy {num1} shirts for ${num2} each, what is the total cost?",
    "A rectangle has an area of {num1} cm² and a width of {num2} cm. What is its length?",
    "You earn ${num1} per hour and work {num2} hours. How much do you earn?",
    "If a recipe needs {num1} cups of flour per cake, how much for {num2} cakes?",
    "You have {num1} marbles, and {num2}% of them are red. How many red marbles do you have?"
  ],
  "hard": [
    "What is the derivative of {num1}x²?",
    "Solve for x: {num1}x + {num2} = {num3}",
    "If the perimeter of a square is {num1} cm, what is the length of one side?",
    "A cylinder has a radius of {num1} cm and height {num2} cm. What is its volume?",
    "A train is traveling at {num1} km/h. How long does it take to cover {num2} km?",
    "You invest ${num1} at an interest rate of {num2}% per year. How much after {num3} years?",
    "If f(x) = {num1}x² + {num2}x + {num3}, what is f({num4})?",
    "A triangle has sides of {num1} cm, {num2} cm, and {num3} cm. Is it a right triangle?",
    "Find the sum of all even numbers between {num1} and {num2}.",
    "A farmer has {num1} cows and {num2} chickens. How many legs in total?"
  ],
  "difficult": [
    "What is the integral of {num1}x dx?",
    "What is the sum of the first {num1} natural numbers?",
    "A function f(x) = {num1}x² + {num2}x + {num3} has a local minimum at x = {num4}. What is f({num4})?",
    "If an investment grows at a rate of {num1}% per year, what will its value be after {num2} years starting from ${num3}?",
    "The Fibonacci sequence starts with 0, 1. What is the {num1}th Fibonacci number?",
    "Solve for x: {num1}x² + {num2}x + {num3} = 0.",
    "A cone has a radius of {num1} cm and height {num2} cm. Find its volume.",
    "If log({num1}) = {num2}, what is the value of {num1}?",
    "A sequence follows the rule an = {num1}n² + {num2}n + {num3}. Find the 10th term.",
    "A company’s profit follows the function P(x) = {num1}x³ - {num2}x² + {num3}x. Find the critical points."
  ]
};


  const template = randomChoice(templates[mode]);
  const num1 = randomInt(1, 50);
  const num2 = randomInt(1, 50);
  const num3 = 180 - num2; 

  const question = template
    .replace("{num1}", num1)
    .replace("{num2}", num2)
    .replace("{num3}", num3);

  const correctAnswer = math.evaluate(num1 + num2); 

  return { question, correctAnswer };
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
