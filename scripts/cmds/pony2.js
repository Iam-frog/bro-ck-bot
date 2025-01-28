const axios = require('axios');
const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "pony2",
    version: "1.2",
    author: "UPoL 🐔",
    countDown: 0,
    longDescription: {
      en: "Generate AI images based on your prompt.",
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
      return message.reply("Please enter a prompt.");
    }

    // Send a waiting message
    const waitingMessage = await message.reply("Generating your image. Please wait...");

    try {
      const apiUrl = `https://upol-pony2.onrender.com/pony2?prompt=${encodeURIComponent(prompt)}`;
      const response = await axios.get(apiUrl);
      const { combinedUrl, images } = response.data;

      // Validate the response structure
      if (!combinedUrl || !images) {
        return message.reply("Failed to generate images. Try again.");
      }

      // Send the combined image and instructions
      const responseMessage = await message.reply(
        {
          body: "Reply with U1, U2, U3, or U4 to see an individual image.",
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
      message.reply("Error generating the image. Please try again.");
    }
  },

  onReply: async function ({ api, event, Reply, args, message }) {
    const userChoice = event.body.trim().toUpperCase();
    const { author, images } = Reply;

    if (event.senderID !== author) {
      return message.reply("Only the person who started the command can reply.");
    }

    // Map choices to corresponding image keys
    const validChoices = { U1: "image1", U2: "image2", U3: "image3", U4: "image4" };
    const selectedImageKey = validChoices[userChoice];

    if (!selectedImageKey) {
      return message.reply("Invalid choice. Reply with U1, U2, U3, or U4.");
    }

    try {
      const selectedImage = images[selectedImageKey];
      if (!selectedImage) {
        return message.reply("Could not get the selected image. Try again.");
      }

      const imageStream = await getStreamFromURL(selectedImage, `${selectedImageKey}.png`);
      message.reply({
        body: `Here is ${userChoice}.`,
        attachment: imageStream,
      });
    } catch (error) {
      console.error(error);
      message.reply("Error fetching the image. Please try again.");
    }
  },
};
