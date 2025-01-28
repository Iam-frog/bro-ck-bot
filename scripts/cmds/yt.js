const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "yt",
    version: "1.3",
    author: "UPoL 🐔",
    countDown: 5,
    role: 0,
    description: "Search and download videos or audio from YouTube.",
    category: "media",
    guide: "   {pn} -v [<video name>]: search and download video\n   {pn} -a [<video name>]: search and download audio"
  },

  onStart: async function ({ args, message }) {
    let format;
    switch (args[0]) {
      case "-v":
        format = "video";
        break;
      case "-a":
        format = "audio";
        break;
      default:
        return message.reply("Invalid option! Use `-v` for video or `-a` for audio.");
    }

    const query = args.slice(1).join(" ");
    if (!query) return message.reply("Please provide a search query!");

    const searchUrl = `https://upol-ytbv2-x.onrender.com/search?query=${encodeURIComponent(query)}&format=${format}`;

    try {
      await message.reply("🔍 Hold tight! Searching for your request...");
      const searchResponse = await axios.get(searchUrl);

      if (!searchResponse.data || searchResponse.data.length === 0) {
        return message.reply(`❌ Sorry, no results found for "${query}". Try searching for something else.`);
      }

      const results = searchResponse.data;
      let responseMessage = "🔎 Here are the search results:\n";
      const thumbnails = [];

      results.forEach((result, index) => {
        responseMessage += `${index + 1}. ${result.title} by ${result.channel}\n\n`;
        thumbnails.push(result.thumbnail);
      });

      const thumbnailPaths = await Promise.all(
        thumbnails.map((url, index) => downloadThumbnail(url, index))
      );

      const replyMessage = await message.reply({
        body: `${responseMessage}\nReply with the number of your choice, or send any other message to cancel.`,
        attachment: thumbnailPaths.map(path => fs.createReadStream(path))
      });

      // Cleanup downloaded thumbnails
      thumbnailPaths.forEach(path => fs.unlinkSync(path));

      global.GoatBot.onReply.set(replyMessage.messageID, {
        commandName: this.config.name,
        messageID: replyMessage.messageID,
        author: message.senderID,
        format,
        results
      });
    } catch (error) {
      console.error(error);
      return message.reply(`🚨 Oops! Something went wrong: ${error.message}`);
    }
  },

  onReply: async function ({ message, event, Reply }) {
    const { results, format, messageID } = Reply;
    const choice = parseInt(event.body);

    if (isNaN(choice) || choice < 1 || choice > results.length) {
      return message.reply("⚠️ Invalid choice! Please reply with a valid number.");
    }

    const selected = results[choice - 1];
    const videoID = selected.id;

    await message.unsend(messageID);
    await message.reply(`⬇️ Downloading your ${format} file: "${selected.title}". Please wait...`);

    try {
      // Determine the format for the download API
      const apiFormat = format === "video" ? "mp4" : "mp3";

      // Construct the download URL
      const downloadUrl = `https://upol-ytbv2-x.onrender.com/download?videoID=${videoID}&format=${apiFormat}`;

      // Send a GET request to the download API
      const response = await axios.get(downloadUrl, { responseType: "stream" });

      // Temporary file path
      const extension = format === "video" ? "mp4" : "mp3";
      const filePath = path.join(__dirname, `download.${extension}`);

      // Save the stream to a file
      const fileStream = fs.createWriteStream(filePath);
      response.data.pipe(fileStream);

      await new Promise((resolve, reject) => {
        fileStream.on("finish", resolve);
        fileStream.on("error", reject);
      });

      // Send the file as an attachment
      await message.reply({
        body: `🎉 Your ${format} file is ready! "${selected.title}" is here for you.`,
        attachment: fs.createReadStream(filePath)
      });

      // Cleanup the file after sending
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(error);
      return message.reply(`❌ Failed to download the ${format} file: ${error.message}`);
    }
  }
};

// Helper function to download thumbnails
async function downloadThumbnail(url, index) {
  try {
    const thumbnailPath = path.join(__dirname, `thumb_${index}.jpg`);
    const response = await axios.get(url, { responseType: "stream" });
    const writer = fs.createWriteStream(thumbnailPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    return thumbnailPath;
  } catch (error) {
    throw new Error(`Failed to download thumbnail: ${error.message}`);
  }
}
