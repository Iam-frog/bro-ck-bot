const axios = require('axios');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "pony",
    version: "1.1",
    author: "UPoL 🐔",
    countDown: 0,
    longDescription: {
      en: "Generate stunning AI images based on your input prompt.",
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
      return message.reply("Please provide a prompt.");
    }

    // Send a waiting message
    const waitingMessage = await message.reply("✨ Creating your masterpiece... Please wait a moment!");

    try {
      const apiUrl = `https://upol-pony.onrender.com/pony?prompt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);
      const { combinedUrl, images } = response.data;

      // Validate the response structure
      if (!combinedUrl || !images) {
        return message.reply("❌ Failed to generate images. Please try again.");
      }

      // Send the combined image and instructions
      const responseMessage = await message.reply(
        {
          body: "✨ Your image is ready! Reply with a number (1, 2, 3, or 4) to view individual images.",
          attachment: await getStreamFromURL(combinedUrl, "combined.png"),
        }
      );

      // Unsend the waiting message
      api.unsendMessage(waitingMessage.messageID);

      // Store reply data for further interactions
      global.GoatBot.onReply.set(responseMessage.messageID, {
        commandName: this.config.name,
        messageID: responseMessage.messageID,
        author: event.senderID,
        images,
      });
    } catch (error) {
      console.error(error);
      api.unsendMessage(waitingMessage.messageID);
      message.reply("❌ An error occurred while generating the images. Please try again.");
    }
  },

  onReply: async function ({ api, event, Reply, args, message }) {
    const userChoice = parseInt(event.body.trim());
    const { author, images } = Reply;

    if (event.senderID !== author) {
      return message.reply("🚫 Only the user who initiated the command can reply.");
    }

    if (isNaN(userChoice) || userChoice < 1 || userChoice > 4) {
      return message.reply("❌ Invalid choice! Please reply with a number between 1 and 4.");
    }

    try {
      const selectedImage = images[`image${userChoice}`];
      if (!selectedImage) {
        return message.reply("❌ Unable to fetch the selected image. Please try again.");
      }

      const imageStream = await getStreamFromURL(selectedImage, `image${userChoice}.png`);
      message.reply({
        body: `✅ Here is your selected image (${userChoice}).`,
        attachment: imageStream,
      });
    } catch (error) {
      console.error(error);
      message.reply("❌ An error occurred while fetching the image. Please try again.");
    }
  },
};
