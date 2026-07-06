import express from "express";
import cors from "cors";
import { execSync } from "child_process";

const app = express();
app.use(cors());
app.use(express.json());

function detectPlatform(url) {
  const u = url.toLowerCase();
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "facebook";
  if (u.includes("twitter.com") || u.includes("x.com")) return "twitter";
  if (u.includes("t.me")) return "telegram";
  if (u.includes("pinterest.com") || u.includes("pin.it")) return "pinterest";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("reddit.com")) return "reddit";
  if (u.includes("onlyfans.com")) return "onlyfans";
  return "unknown";
}

async function downloadWithYtDlp(url) {
  try {
    const videoUrl = execSync(`yt-dlp -f "bestvideo[height<=720]+bestaudio/best[height<=720]" --merge-output-format mp4 -g "${url}"`, { timeout: 30000, encoding: "utf8" }).trim().split("\n").pop();
    const audioUrl = execSync(`yt-dlp -f "bestaudio[ext=m4a]/bestaudio" -g "${url}"`, { timeout: 30000, encoding: "utf8" }).trim().split("\n").pop();
    return { video_url: videoUrl, music_url: audioUrl };
  } catch { return null; }
}

async function downloadTikTok(url) {
  try {
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const data = await res.json();
    if (data.code === 0 && data.data) {
      return {
        platform: "tiktok", title: data.data.title, author: data.data.author?.nickname,
        video_url: data.data.play || data.data.wmplay, no_watermark: data.data.hdplay || data.data.play,
        thumbnail: data.data.cover, music: data.data.music_info?.title,
        music_url: data.data.music || data.data.music_info?.play
      };
    }
    return null;
  } catch { return null; }
}

async function downloadTwitter(url) {
  try {
    const apiUrl = `https://twitsave.com/info?url=${encodeURIComponent(url)}`;
    const res = await fetch(apiUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const data = await res.text();
    const match = data.match(/<a[^>]+href="([^"]+)"[^>]+download/);
    if (match) return { platform: "twitter", title: "Twitter/X Video", video_url: match[1], thumbnail: null };
    return null;
  } catch { return null; }
}

app.post("/api/download", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL diperlukan" });
  const platform = detectPlatform(url);
  if (platform === "unknown") return res.status(400).json({ error: "Platform tidak dikenali" });

  try {
    let result;

    if (platform === "tiktok") {
      result = await downloadTikTok(url);
    } else if (platform === "twitter") {
      result = await downloadTwitter(url);
    } else {
      const ytResult = await downloadWithYtDlp(url);
      if (ytResult) {
        result = {
          platform,
          title: "Video dari " + platform,
          video_url: ytResult.video_url,
          music_url: ytResult.music_url,
          note: "Link download bersifat sementara. Klik segera."
        };
      }
    }

    if (!result) return res.status(404).json({ error: "Video tidak ditemukan" });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: "Gagal memproses: " + err.message });
  }
});

app.get("/", (req, res) => res.json({ status: "DownloadMe API", version: "3.0" }));
export default app;
