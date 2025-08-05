import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.resolve('./storage');

export async function saveChat(userId, chat) {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.writeFile(path.join(STORAGE_DIR, `chat_${userId}.json`), JSON.stringify(chat, null, 2), 'utf8');
}

export async function loadChat(userId) {
  try {
    const data = await fs.readFile(path.join(STORAGE_DIR, `chat_${userId}.json`), 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}
