const axios = require('axios');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "fluxpro",
    version: "1.0",
    author: "UPoL 🐔",
    countDown: 0,
    longDescription: {
      en: "Generate AI images based on your prompt."
    },
    category: "image",
    role: 0,
    guide: {
      en: "{pn} <prompt>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return message.reply("Please provide a prompt to generate an image.");
    }

    message.reply("Creating......!", async (err, info) => {
      if (err) return console.error(err);

      try {
        const apiUrl = `https://upol-flux11pro.onrender.com/fluxPro11?prompt=${encodeURIComponent(prompt)}`;
        const response = await axios.get(apiUrl);
        const { combineUrl, Images } = response.data;

        if (!combineUrl || !Images) {
          return message.reply("Failed to generate images. Please try again.");
        }

        message.reply(
          {
            body: "✨ Image generated successfully!\nReply with a number (1, 2, 3, or 4) to view individual images.",
            attachment: await getStreamFromURL(combineUrl, "combined.png"),
          },
          (err, info) => {
            if (err) return console.error(err);

            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              messageID: info.messageID,
              author: event.senderID,
              Images, 
            });
          }
        );
      } catch (error) {
        console.error(error);
        message.reply("An error occurred while generating images. Please try again.");
      }
    });
  },

  onReply: async function ({ api, event, Reply, args, message }) {
    const userChoice = parseInt(event.body.trim());
    const { author, Images } = Reply;

    if (event.senderID !== author) {
      return message.reply("🚫 Only the user who initiated the command can reply.");
    }

    if (isNaN(userChoice) || userChoice < 1 || userChoice > 4) {
      return message.reply("❌ Invalid choice! Please reply with a number between 1 and 4.");
    }

    try {
      const selectedImage = Images[`image${userChoice}`];
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
      message.reply("An error occurred while fetching the image. Please try again.");
    }
  },
};
