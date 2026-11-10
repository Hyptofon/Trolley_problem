#!/usr/bin/env node

/**
 * CLI script to generate a secure salted scrypt password hash for ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   node scripts/generate-admin-hash.mjs "MySecureAdminPassword123"
 *   OR
 *   node scripts/generate-admin-hash.mjs (prompts securely for password)
 */

import crypto from 'node:crypto';
import readline from 'node:readline';

const SCRYPT_PARAMS = {
  N: 16384, // CPU/memory cost
  r: 8,     // Block size
  p: 1,     // Parallelization
  keyLen: 64, // Output key length
};

export function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Пароль має містити щонайменше 8 символів.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password.normalize('NFKC'), salt, SCRYPT_PARAMS.keyLen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
  }).toString('hex');

  // Use ":" delimiters so Next.js dotenv-expand never interprets "$" as env interpolation in .env files
  return `${SCRYPT_PARAMS.N}:${SCRYPT_PARAMS.r}:${SCRYPT_PARAMS.p}:${salt}:${derivedKey}`;
}

export function verifyPasswordScrypt(providedPassword, storedHash) {
  if (typeof providedPassword !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  let N, r, p, salt, expectedKeyHex;
  const dollarParts = storedHash.split('$');
  const colonParts = storedHash.split(':');

  if (dollarParts.length === 3) {
    const [paramsStr, s, key] = dollarParts;
    [N, r, p] = paramsStr.split(':').map(Number);
    salt = s;
    expectedKeyHex = key;
  } else if (colonParts.length === 5) {
    [N, r, p] = colonParts.slice(0, 3).map(Number);
    salt = colonParts[3];
    expectedKeyHex = colonParts[4];
  } else {
    return false;
  }

  if (!N || !r || !p || !salt || !expectedKeyHex) {
    return false;
  }

  try {
    const derivedKey = crypto.scryptSync(
      providedPassword.normalize('NFKC'),
      salt,
      Buffer.from(expectedKeyHex, 'hex').length,
      { N, r, p }
    );

    const expectedBuffer = Buffer.from(expectedKeyHex, 'hex');
    if (derivedKey.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedKey, expectedBuffer);
  } catch {
    return false;
  }
}

// Run as CLI script
if (process.argv[1] && process.argv[1].endsWith('generate-admin-hash.mjs')) {
  const cliPassword = process.argv[2];

  if (cliPassword) {
    try {
      const hash = hashPassword(cliPassword);
      console.log('\nЗгенеровано ADMIN_PASSWORD_HASH:');
      console.log(hash);
      console.log('\nДодайте цей рядок у файл .env.local або змінні Vercel:');
      console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
    } catch (err) {
      console.error('Помилка:', err.message);
      process.exit(1);
    }
  } else {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Введіть пароль для адміністратора: ', (enteredPassword) => {
      rl.close();
      try {
        const hash = hashPassword(enteredPassword.trim());
        console.log('\nЗгенеровано ADMIN_PASSWORD_HASH:');
        console.log(hash);
        console.log('\nДодайте цей рядок у файл .env.local або змінні Vercel:');
        console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
      } catch (err) {
        console.error('Помилка:', err.message);
        process.exit(1);
      }
    });
  }
}

