const axios = require("axios");
const fs = require("fs");
const path = require("path");

const Data = {};
const voiceModels = ["onyx", "nova", "alloy", "fable", "shimmer"];

module.exports = {
  config: {
    name: "vai",
    aliases: ["voiceai", "nagi", "n", "v"],
    version: "2.0",
    author: "UPoL 🐔",
    role: 0,
    shortDescription: {
      en: "Ask a question to GPT and get a voice response using different TTS models.",
    },
    longDescription: {
      en: "Ask a question to GPT and receive the response in audio format using the available TTS voice models.",
    },
    category: "Voice AI",
    guide: {
      en: "{pn} <question> [--model <number>]\n\nAvailable voice models:\n1 - onyx\n2 - nova\n3 - alloy\n4 - fable\n5 - shimmer\n(Default is nova)",
    },
  },

  onStart: async function ({ api, event, message, args }) {
    await processChat({ api, event, message, args, isReply: false });
  },

  onReply: async function ({ api, event, message, args }) {
    await processChat({ api, event, message, args, isReply: true });
  },
};

async function processChat({ api, event, message, args, isReply }) {
  try {
    let chat = event.senderID;
    let input = args.join(" ");
    let selectedModel = "nova";

    const modelMatch = input.match(/--model (\d+)/);
    if (modelMatch) {
      const modelIndex = parseInt(modelMatch[1], 10) - 1;
      if (voiceModels[modelIndex]) {
        selectedModel = voiceModels[modelIndex];
      }
      input = input.replace(/--model \d+/, "").trim();
    }

    if (!input) return message.reply("Please enter a question.");

    if (input.toLowerCase() === "reset") {
      delete Data[chat];
      return message.reply("Successfully reset your information.");
    }

    if (!Data[chat]) {
      Data[chat] = input;
    } else {
      Data[chat] += "\n" + input;
    }

    const encodedPrompt = encodeURIComponent(Data[chat]);

    const waitingMessage = await message.reply("✨ Responding with voice AI, please wait...");

    const gptResponse = await axios.get(`https://upol-piu.onrender.com/gemini?prompt=${encodedPrompt}`);
    const answer = gptResponse.data.answer;

    const ttsResponse = await axios.get(`https://upol-tts2.onrender.com/api/${selectedModel}?text=${encodeURIComponent(answer)}`);
    const audioUrl = ttsResponse.data.audioUrl;

    const audioResponse = await axios.get(audioUrl, { responseType: "arraybuffer" });
    const audioFilePath = path.join(__dirname, `response_${chat}.mp3`);
    fs.writeFileSync(audioFilePath, audioResponse.data);

    api.unsendMessage(waitingMessage.messageID);

    message.reply(
      {
        body: `✨ Answer: ${answer}`,
        attachment: fs.createReadStream(audioFilePath),
      },
      (err, info) => {
        if (!err) {
          fs.unlinkSync(audioFilePath); 
        }

        global.GoatBot.onReply.set(info.messageID, {
          commandName: "vai",
          messageID: info.messageID,
          author: chat,
        });
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    message.reply(`Error: ${error.message}`);
  }
}
