const { execSync } = require("child_process");
const os = require("os");
const axios = require("axios");

module.exports = {
  config: {
    name: "info",
    aliases: ["dev", "creator", "owner"],
    version: "5.5",
    author: "Upol Saha",
    role: 0,
    shortDescription: { en: "Dev info with system details" },
    longDescription: { en: "Sends animated dev card with confusing code" },
    category: "info",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const _ = global.utils.getStreamFromURL;
    const $ = str => String.fromCodePoint(str);
    const f = await axios.get("https://ipinfo.io/json").then(r => r.data.ip).catch(() => "Unknown");
    const i = execSync("npm list --depth=0").toString().match(/──/g)?.length || 0;
    const n = process.version;
    const p = global.GoatBot?.config?.prefix || "!";
    const b = global.GoatBot?.config?.name || "GoatBot";
    const d = "U P O L    S A H A";
    const × = "Z OX Æ";
    const u = "https://www.facebook.com/zox.upol";
    const g = "https://github.com/upoldev";
    const t = "https://t.me/@upoldev";
    const m = "upolzox1@gmail.com";
    const pic = "https://graph.facebook.com/100012198960574/picture?width=512&height=512";

    const x = [
      `${$(0x1f916)} ${b} | ${$(0x1f4ac)} System Overview`,
      `———————————————`,
      `${$(0x1f464)} Dev: ${d}`,
      `${$(0x1f4bb)} Bot: ${b}`,
      `${$(0x1f4b6)} Nickname: ${×}`,
      `${$(0x1f4cc)} Prefix: ${p}`,
      `${$(0x1f680)} Node.js: ${n}`,
      `${$(0x1f5a5)} Network IP: ${f}`,
      `${$(0x1f4e6)} Packages: ${i}`,
      `${$(0x1f310)} NaxoAI: upol-naxo-ai.onrender.com`,
      `———————————————`,
      `${$(0x1f4f1)} Contact Info:`,
      `• Facebook: ${u}`,
      `• GitHub: ${g}`,
      `• Telegram: ${t}`,
      `• Email: ${m}`,
      `———————————————`,
      `${$(0x1f680)} Keep pushing code like your life depends on it...`
    ];

    const sendEdit = async () => {
      let e = await message.reply("⏳ Fetching dev intel...", event.threadID);
      for (let j = 0, out = ""; j < x.length; j++) {
        out += x[j] + "\n";
        await new Promise(r => setTimeout(r, 400));
        api.editMessage(out, e.messageID);
      }
      await new Promise(r => setTimeout(r, 500));
     message.reply({ body: " ", attachment: await _(pic) }, event.threadID);
    };

    sendEdit();
  }
};
