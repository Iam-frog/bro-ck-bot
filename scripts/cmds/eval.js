const { removeHomeDir, log } = global.utils;
const crypto = require("crypto");

module.exports = {
  config: {
    name: "eval",
    version: "2.0",
    author: "NTKhang | Modified by UPoL",
    countDown: 5,
    role: 2,
    description: {
      en: "Test code, encryption/decryption, and other utilities"
    },
    category: "owner",
    guide: {
      en: "{pn} <command or code to test>"
    }
  },

  langs: {
    en: {
      error: "❌ An error occurred:",
      encryptSuccess: "🔒 Encryption successful:",
      decryptSuccess: "🔓 Decryption successful:",
      invalidInput: "❌ Invalid input."
    }
  },

  onStart: async function ({
    api,
    args,
    message,
    event,
    threadsData,
    usersData,
    dashBoardData,
    globalData,
    threadModel,
    userModel,
    dashBoardModel,
    globalModel,
    role,
    commandName,
    getLang
  }) {
    function output(msg) {
      if (typeof msg == "number" || typeof msg == "boolean" || typeof msg == "function") msg = msg.toString();
      else if (msg instanceof Map) {
        let text = `Map(${msg.size}) `;
        text += JSON.stringify(mapToObj(msg), null, 2);
        msg = text;
      } else if (typeof msg == "object") msg = JSON.stringify(msg, null, 2);
      else if (typeof msg == "undefined") msg = "undefined";

      message.reply(msg);
    }

    function mapToObj(map) {
      const obj = {};
      map.forEach(function (v, k) {
        obj[k] = v;
      });
      return obj;
    }

    function encrypt(text, key) {
      const cipher = crypto.createCipher("aes-256-cbc", key);
      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");
      return encrypted;
    }

    function decrypt(encryptedText, key) {
      try {
        const decipher = crypto.createDecipher("aes-256-cbc", key);
        let decrypted = decipher.update(encryptedText, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
      } catch {
        return null; 
      }
    }

    const command = args.shift();

    switch (command) {
      case "encrypt": {
        const [key, ...textParts] = args;
        if (!key || textParts.length === 0) return message.reply(getLang("invalidInput"));
        const text = textParts.join(" ");
        const encrypted = encrypt(text, key);
        message.reply(`${getLang("encryptSuccess")}\n${encrypted}`);
        break;
      }

      case "decrypt": {
        const [key, ...encryptedParts] = args;
        if (!key || encryptedParts.length === 0) return message.reply(getLang("invalidInput"));
        const encryptedText = encryptedParts.join(" ");
        const decrypted = decrypt(encryptedText, key);
        if (decrypted === null) return message.reply(getLang("invalidInput"));
        message.reply(`${getLang("decryptSuccess")}\n${decrypted}`);
        break;
      }

      case "base64encode": {
        const text = args.join(" ");
        if (!text) return message.reply(getLang("invalidInput"));
        const encoded = Buffer.from(text).toString("base64");
        message.reply(`Base64 Encoded: ${encoded}`);
        break;
      }

      case "base64decode": {
        const text = args.join(" ");
        if (!text) return message.reply(getLang("invalidInput"));
        try {
          const decoded = Buffer.from(text, "base64").toString("utf8");
          message.reply(`Base64 Decoded: ${decoded}`);
        } catch {
          message.reply(getLang("invalidInput"));
        }
        break;
      }

      case "test": {
        const script = args.join(" ");
        const cmd = `
        (async () => {
          try {
            ${script}
          } catch (err) {
            log.err("eval command", err);
            message.send(
              "${getLang("error")}\\n" +
              (err.stack ? removeHomeDir(err.stack) : removeHomeDir(JSON.stringify(err, null, 2) || ""))
            );
          }
        })()`;
        eval(cmd);
        break;
      }

      default:
        message.reply(`${getLang("invalidInput")}`);
    }
  }
};
