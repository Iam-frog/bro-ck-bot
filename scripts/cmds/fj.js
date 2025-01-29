const axios = require('axios');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "fj",
    aliases: ["dj"],
    version: "1.4",
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
      const response = await axios.get(apiUrl, { timeout: 120000 });
      const { combinedUrl, images } = response.data;

      if (!combinedUrl || !images) {
        return message.reply("❌ Creation failed. The muse seems silent today. Try again!");
      }

      const responseMessage = await message.reply({
        body: "🎨 Your vision is ready! Reply with:\n\n- `U1`, `U2`, `U3`, `U4` → To refine a specific version.\n- `U1 U2` (etc.) → To see multiple images at once.\n- `UALL` → To reveal all variations.",
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
    const userChoices = event.body.trim().toUpperCase().split(/\s+/); // Split input into an array
    const { author, images } = Reply;

    if (event.senderID !== author) {
      return message.reply("⚠️ Only the original creator can refine this generation.");
    }

    const validChoices = { U1: "image1", U2: "image2", U3: "image3", U4: "image4" };

    let selectedImages = [];

    if (userChoices.includes("UALL")) {
      // If "UALL" is chosen, send all images
      selectedImages = Object.values(validChoices).map(key => images[key]).filter(Boolean);
    } else {
      // Otherwise, check each choice and add the corresponding image
      userChoices.forEach(choice => {
        if (validChoices[choice] && images[validChoices[choice]]) {
          selectedImages.push(images[validChoices[choice]]);
        }
      });
    }

    if (selectedImages.length === 0) {
      return message.reply("⚠️ Invalid selection. Try U1, U2, U3, U4, or UALL.");
    }

    try {
      const attachments = await Promise.all(
        selectedImages.map(async (image, index) => await getStreamFromURL(image, `image${index + 1}.png`))
      );

      message.reply({
        body: `🖌️ Here is your selection ( ${userChoices.join(", ")} ) —a glimpse into the world you imagined!`,
        attachment: attachments,
      });

    } catch (error) {
      console.error(error);
      message.reply("❌ Something went wrong fetching the images. The AI muse is momentarily distracted. Try again!");
    }
  },
};
