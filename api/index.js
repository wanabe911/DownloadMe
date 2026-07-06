import express from "express";
import cors from "cors";
import axios from "axios";
import ytdl from "@distube/ytdl-core";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

function detectPlatform(url) {
  const u = url.toLowerCase();
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("instagram.com") || u.includes("instagr.am")) return "instagram";
  if (u.includes("facebook.com") || u.includes("fb.com") || u.includes("fb.watch")) return "facebook";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  if (u.includes("reddit.com") || u.includes("redd.it")) return "reddit";
  if (u.includes("t.me")) return "telegram";
  if (u.includes("pinterest.com") || u.includes("pin.it")) return "pinterest";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("capcut.com")) return "capcut";
  if (u.includes("dailymotion.com")) return "dailymotion";
  if (u.includes("vimeo.com")) return "vimeo";
  if (u.includes("onlyfans.com")) return "onlyfans";
  if (u.includes("likee.com")) return "likee";
  if (u.includes("snackvideo.com")) return "snackvideo";
  return "unknown";
}

async function downloadTikTok(url) {
  try {
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (data.code === 0 && data.data) {
      return { platform: "tiktok", title: data.data.title, author: data.data.author?.nickname, video_url: data.data.play || data.data.wmplay, no_watermark: data.data.hdplay || data.data.play, thumbnail: data.data.cover, music: data.data.music_info?.title };
    }
    return null;
  } catch { return null; }
}

async function downloadInstagram(url) {
  try {
    const apiUrl = `https://www.ddinstagram.com${new URL(url).pathname}`;
    return { platform: "instagram", title: "Instagram Video", video_url: apiUrl, thumbnail: null };
  } catch { return null; }
}

async function downloadFacebook(url) {
  try {
    const apiUrl = `https://api.fdown.net/api.php?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (data.success && data.data) {
      return { platform: "facebook", title: data.data.title || "Facebook Video", video_url: data.data.hd || data.data.sd, thumbnail: data.data.thumbnail };
    }
    return null;
  } catch { return null; }
}

async function downloadTwitter(url) {
  try {
    const apiUrl = `https://twitsave.com/info?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const match = data.match(/<a[^>]+href="([^"]+)"[^>]+download/);
    if (match) return { platform: "twitter", title: "Twitter Video", video_url: match[1], thumbnail: null };
    return null;
  } catch { return null; }
}

async function downloadTelegram(url) {
  try {
    const match = url.match(/t\.me\/([^/]+)\/(\d+)/);
    if (!match) return null;
    const channel = match[1], messageId = match[2];
    const { data } = await axios.get(`https://t.me/${channel}/${messageId}?embed=1`, { headers: { "User-Agent": "Mozilla/5.0" } });
    const videoMatch = data.match(/<video[^>]+src="([^"]+)"/);
    if (videoMatch) return { platform: "telegram", title: `Video from ${channel}`, video_url: videoMatch[1], thumbnail: null };
    return null;
  } catch { return null; }
}

async function downloadReddit(url) {
  try {
    const jsonUrl = url.replace(/\/$/, "") + ".json";
    const { data } = await axios.get(jsonUrl, { headers: { "User-Agent": "WasabiDownloader/2.0" } });
    const post = data[0]?.data?.children[0]?.data;
    if (!post) return null;
    const media = post.media?.reddit_video || post.preview?.reddit_video_preview;
    const videoUrl = post.url_overridden_by_dest || post.url;
    if (media || videoUrl?.includes("v.redd.it")) {
      return { platform: "reddit", title: post.title, video_url: media?.fallback_url || videoUrl, thumbnail: post.thumbnail };
    }
    return null;
  } catch { return null; }
}

async function downloadPinterest(url) {
  try {
    const apiUrl = `https://pinterestdownloader.io/api/fetch-video?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (data.video_url) return { platform: "pinterest", title: "Pinterest Video", video_url: data.video_url, thumbnail: data.thumbnail };
    return null;
  } catch { return null; }
}

async function downloadOF(url) {
  try {
    const username = url.match(/onlyfans\.com\/([^/?]+)/)?.[1];
    if (!username) return null;
    const apiUrl = `https://onlyfans.com/api2/v2/users/${username}`;
    const { data } = await axios.get(apiUrl, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
    return { platform: "onlyfans", title: data.name || username, author: `@${data.username}`, avatar: data.avatar, posts_count: data.postsCount || 0, photos_count: data.photosCount || 0, videos_count: data.videosCount || 0, note: "Konten OF memerlukan autentikasi untuk download" };
  } catch { return null; }
}

async function downloadYouTube(url) {
  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: "18" }) || ytdl.chooseFormat(info.formats, { quality: "highest" });
    return {
      platform: "youtube",
      title: info.videoDetails.title,
      author: info.videoDetails.author?.name,
      duration: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails?.[info.videoDetails.thumbnails.length - 1]?.url,
      video_url: format?.url,
      note: "Link download bersifat sementara. Klik download segera."
    };
  } catch { return null; }
}

app.post("/api/download", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL diperlukan" });
  const platform = detectPlatform(url);
  if (platform === "unknown") return res.status(400).json({ error: "Platform tidak dikenali" });
  try {
    let result;
    switch (platform) {
      case "tiktok": result = await downloadTikTok(url); break;
      case "instagram": result = await downloadInstagram(url); break;
      case "facebook": result = await downloadFacebook(url); break;
      case "twitter": result = await downloadTwitter(url); break;
      case "telegram": result = await downloadTelegram(url); break;
      case "reddit": result = await downloadReddit(url); break;
      case "pinterest": result = await downloadPinterest(url); break;
      case "youtube": result = await downloadYouTube(url); break;
      case "onlyfans": result = await downloadOF(url); break;
      default: result = { platform, video_url: url, note: "Platform didukung." };
    }
    if (!result) return res.status(404).json({ error: "Video tidak ditemukan" });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: "Gagal memproses: " + err.message });
  }
});

app.get("/", (req, res) => res.sendFile("public/index.html", { root: "." }));
export default app;
