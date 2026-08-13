import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  { src: "C:\\Users\\burag\\.gemini\\antigravity-ide\\brain\\35e00625-1b0b-4057-94f6-a7859624d897\\homecoming_1783196890019.png", dest: "public/posters/homecoming.png" },
  { src: "C:\\Users\\burag\\.gemini\\antigravity-ide\\brain\\35e00625-1b0b-4057-94f6-a7859624d897\\midnight_mix_1783196931047.png", dest: "public/posters/midnight_mix.png" },
  { src: "C:\\Users\\burag\\.gemini\\antigravity-ide\\brain\\35e00625-1b0b-4057-94f6-a7859624d897\\paper_kites_1783196955354.png", dest: "public/posters/paper_kites.png" }
];

files.forEach(f => {
  if (fs.existsSync(f.src)) {
    const destPath = path.join(__dirname, '..', f.dest);
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(f.src, destPath);
    console.log(`Successfully copied to ${f.dest}`);
  } else {
    console.error(`Source not found: ${f.src}`);
  }
});
