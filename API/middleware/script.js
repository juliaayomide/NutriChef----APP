import multer from "multer";
import path from "path";
import fs from "fs";

const pastaUploads = path.join(process.cwd(), "public/uploads");
const pastaReceitas = path.join(process.cwd(), "public/receitas");
const pastaUsuarios = path.join(process.cwd(), "public/usuarios");

[pastaUploads, pastaReceitas, pastaUsuarios].forEach(pasta => {
  if (!fs.existsSync(pasta)) fs.mkdirSync(pasta, { recursive: true });
});

const storageGen = multer.diskStorage({
  destination: (req, file, cb) => cb(null, pastaUploads),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const fileFilterGen = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Apenas imagens são permitidas!"), false);
};

export const upload = multer({ storage: storageGen, fileFilter: fileFilterGen, limits: { fileSize: 5 * 1024 * 1024 } });

export const uploadReceita = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, pastaReceitas),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    const tiposAceitos = ["image/jpeg", "image/jpg", "image/png"];
    if (tiposAceitos.includes(file.mimetype.toLowerCase())) cb(null, true);
    else cb(new Error("Somente arquivos JPEG ou PNG são permitidos"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadPerfil = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, pastaUsuarios),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    const tiposAceitos = ["image/jpeg", "image/jpg", "image/png"];
    if (tiposAceitos.includes(file.mimetype.toLowerCase())) cb(null, true);
    else cb(new Error("Somente arquivos JPEG ou PNG são permitidos"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});
