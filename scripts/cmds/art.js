const axios = require('axios');
const tinyurl = require('tinyurl');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "art",
    version: "1.0",
    author: "UPoL 🐔",
    countDown: 0,
    longDescription: {
      en: "Transform an image into stunning artwork using AI.",
    },
    category: "image",
    role: 0,
    guide: {
      en: "{pn} (Reply to an image with this command)",
    },
  },

  onStart: async function ({ api, event, args, message }) {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return message.reply("Please reply to an image to transform it into artwork.");
    }

    const imageUrl = event.messageReply.attachments[0].url;
    const prompt = args.join(" ").trim() || "artistic transformation"; // Default prompt if none provided
    const loraModel = ""; // Leave empty unless a specific model is required
    const model = ""; // Default model (or specify if needed)
    const steps = 30; // You can modify this as needed
    const cfgScale = 7.5; // Adjust as necessary

    // Send a waiting message
    const waitingMessage = await message.reply("✨ Processing your image, please wait...");

    try {
      // Convert image URL to TinyURL
      const tinyImageUrl = await tinyurl.shorten(imageUrl);

      // Construct API URL
      const apiUrl = `https://upol-magical-artist.onrender.com/i2a/art?imageUrl=${tinyImageUrl}&prompt=${encodeURIComponent(prompt)}&loraModel=${loraModel}&model=${model}&steps=${steps}&cfgScale=${cfgScale}`;

      // Call the API
      const response = await axios.get(apiUrl);
      const { imageUrl: generatedImageUrl } = response.data;

      if (!generatedImageUrl) {
        return message.reply("❌ Failed to generate the artwork. Please try again.");
      }

      // Send the generated artwork
      const responseMessage = await message.reply({
        body: "🎨 Here is your transformed artwork!",
        attachment: await getStreamFromURL(generatedImageUrl, "art.png"),
      });

      // Unsend the waiting message
      api.unsendMessage(waitingMessage.messageID);
    } catch (error) {
      console.error(error);
      api.unsendMessage(waitingMessage.messageID);
      message.reply("❌ An error occurred while generating the artwork. Please try again.");
    }
  },
};
