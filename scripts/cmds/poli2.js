const axios = require('axios');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "poli2",
    version: "1.0",
    author: "UPoL 🐔",
    countDown: 0,
    longDescription: {
      en: "Generate AI images with specific aspect ratio based on your prompt."
    },
    category: "image",
    role: 0,
    guide: {
      en: "{pn} <prompt> --ar <aspect ratio>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    const input = args.join(' ').trim();

    // Parse prompt and aspect ratio from input
    const promptMatch = input.match(/^(.*?)\s*--ar\s*([\d:]+)/);
    if (!promptMatch) {
      return message.reply("Please provide a valid prompt and aspect ratio using the format: <prompt> --ar <aspect ratio>.");
    }

    const prompt = promptMatch[1].trim();
    const ar = promptMatch[2].trim();

    if (!prompt || !ar) {
      return message.reply("Prompt or aspect ratio is missing. Please check your input and try again.");
    }

    message.reply("Creating......!", async (err, info) => {
      if (err) return console.error(err);

      try {
        const apiUrl = `https://upol-poli3.onrender.com/poli?prompt=${encodeURIComponent(prompt)}&ar=${encodeURIComponent(ar)}`;
        const response = await axios.get(apiUrl);
        const { combineUrl, images } = response.data;

        if (!combineUrl || !images || !images.length) {
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
              images, // Store the images array
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
    const { author, images } = Reply;

    if (event.senderID !== author) {
      return message.reply("🚫 Only the user who initiated the command can reply.");
    }

    if (isNaN(userChoice) || userChoice < 1 || userChoice > 4) {
      return message.reply("❌ Invalid choice! Please reply with a number between 1 and 4.");
    }

    try {
      const selectedImage = images.find(img => img.imageNumber === userChoice)?.url;
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
