const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./public/uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname.replace(/\s/g, "_"));
  }
});
const upload = multer({ storage });

const PROJECTS_FILE = "./projects.json";
function loadProjects() {
  if(!fs.existsSync(PROJECTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(PROJECTS_FILE));
}
function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

const ADMIN_PASSWORD = "ediz2025";

// Admin giriş
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if(password === ADMIN_PASSWORD) return res.json({ ok: true });
  return res.status(403).json({ error: "Geçersiz şifre" });
});

// Proje listesi
app.get("/api/projects", (req, res) => {
  res.json(loadProjects());
});

// Proje ekle (dış linkli görsel de destekler)
app.post("/api/projects", upload.single("image"), (req, res) => {
  const projects = loadProjects();
  const { title, desc, image } = req.body;
  let img = "";
  if (req.file) img = `/uploads/${req.file.filename}`;
  else if (image) img = image;
  const proj = { id: Date.now(), title, desc, image: img, details: { images: [], texts: [] } };
  projects.unshift(proj);
  saveProjects(projects);
  res.json(proj);
});

// Proje sil
app.delete("/api/projects/:id", (req,res) => {
  let projects = loadProjects();
  const id = parseInt(req.params.id,10);
  const proj = projects.find(p => p.id === id);
  if(proj && proj.image && proj.image.startsWith("/uploads/")) {
    const imgPath = path.join(__dirname, "public", proj.image);
    if(fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  projects = projects.filter(p => p.id !== id);
  saveProjects(projects);
  res.json({ ok: true });
});

// Proje detay(lar)ını getir
app.get("/api/projects/:id/details", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const projects = loadProjects();
  const proj = projects.find(p => p.id === id);
  if (!proj) return res.status(404).json({ error: "Proje bulunamadı" });
  res.json(proj.details || { images: [], texts: [] });
});

// Proje detayına ekstra fotoğraf ekle
app.post("/api/projects/:id/details/image", upload.single("image"), (req, res) => {
  const id = parseInt(req.params.id, 10);
  const projects = loadProjects();
  const proj = projects.find(p => p.id === id);
  if (!proj) return res.status(404).json({ error: "Proje bulunamadı" });
  if (!proj.details) proj.details = { images: [], texts: [] };
  if (req.file) {
    const imagePath = `/uploads/${req.file.filename}`;
    proj.details.images.push(imagePath);
    saveProjects(projects);
    res.json({ image: imagePath });
  } else {
    res.status(400).json({ error: "Görsel yüklenemedi" });
  }
});

// Proje detayına ekstra yazı ekle
app.post("/api/projects/:id/details/text", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { text } = req.body;
  const projects = loadProjects();
  const proj = projects.find(p => p.id === id);
  if (!proj) return res.status(404).json({ error: "Proje bulunamadı" });
  if (!proj.details) proj.details = { images: [], texts: [] };
  if (text && text.trim() !== "") {
    proj.details.texts.push(text.trim());
    saveProjects(projects);
    res.json({ text });
  } else {
    res.status(400).json({ error: "Yazı boş olamaz" });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log("Server started on http://localhost:" + PORT));