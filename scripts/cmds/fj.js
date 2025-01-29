const axios = require('axios');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "fj",
    aliases: ["dj"],
    version: "1.3",
    author: "UPoL 🐔",
    countDown: 0,
    longDescription: {
      en: "Generate AI images based on your vision.",
    },
    category: "image",
    role: 0,
    guide: {
      en: "{pn} <prompt>",
    },
  },

  onStart: async function ({ api, event, args, message }) {
    const prompt = args.join(' ').trim();
    
    if (!prompt) {
      return message.reply("⚠️ Describe your vision, and I shall bring it to life!");
    }

    const waitingMessage = await message.reply("✨ Crafting your masterpiece... hold tight!");

    try {
      const apiUrl = `https://upol-dont.onrender.com/crazy-dj?prompt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);
      const { combinedUrl, images } = response.data;

      if (!combinedUrl || !images) {
        return message.reply("❌ Creation failed. The muse seems silent today. Try again!");
      }

      const responseMessage = await message.reply({
        body: "🎨 Your vision is ready! Reply with: \n- U1, U2, U3, U4 → To refine a specific version.\n- Uall → To reveal all variations.",
        attachment: await getStreamFromURL(combinedUrl, "combined.png"),
      });

      api.unsendMessage(waitingMessage.messageID);

      global.GoatBot.onReply.set(responseMessage.messageID, {
        commandName: this.config.name,
        messageID: responseMessage.messageID,
        author: event.senderID,
        images,
      });

    } catch (error) {
      console.error(error);
      api.unsendMessage(waitingMessage.messageID);
      message.reply("❌ An error occurred while generating. The AI gods were not pleased. Try again!");
    }
  },

  onReply: async function ({ api, event, Reply, args, message }) {
    const userChoice = event.body.trim().toUpperCase();
    const { author, images } = Reply;

    if (event.senderID !== author) {
      return message.reply("⚠️ Only the original creator can refine this generation.");
    }

    const validChoices = { U1: "image1", U2: "image2", U3: "image3", U4: "image4" };

    if (userChoice === "Uall") {
      try {
        const attachments = await Promise.all(
          Object.values(validChoices).map(async (key) => {
            if (!images[key]) return null;
            return await getStreamFromURL(images[key], `${key}.png`);
          })
        );

        message.reply({
          body: "🎭 Here’s your full artistic suite—choose your inspiration wisely!",
          attachment: attachments.filter(Boolean),
        });
      } catch (error) {
        console.error(error);
        message.reply("❌ Something went wrong while fetching all images. The AI spirits are restless. Try again!");
      }
      return;
    }

    const selectedImageKey = validChoices[userChoice];
    if (!selectedImageKey) {
      return message.reply("⚠️ Invalid selection. Try U1, U2, U3, U4, or UALL.");
    }

    try {
      const selectedImage = images[selectedImageKey];
      if (!selectedImage) {
        return message.reply("❌ Oops! That image doesn’t exist. Try another one.");
      }

      const imageStream = await getStreamFromURL(selectedImage, `${selectedImageKey}.png`);
      message.reply({
        body: `🖌️ Here is ${userChoice}—a glimpse into the world you imagined!`,
        attachment: imageStream,
      });
    } catch (error) {
      console.error(error);
      message.reply("❌ Something went wrong fetching the image. The AI muse is momentarily distracted. Try again!");
    }
  },
};
