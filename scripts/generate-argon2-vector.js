const argon2 = require('argon2');
const crypto = require('crypto');
const fs = require('fs');

async function main() {
  const deterministicSalt = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');

  const commonOptions = {
    type: argon2.argon2id,
    timeCost: 3,
    memoryCost: 65536,
    parallelism: 2,
    salt: deterministicSalt,
  };

  const passwordPlain = 'P@ssw0rd!';
  const passwordPhc = await argon2.hash(passwordPlain, commonOptions);
  const passwordVerifyOk = await argon2.verify(passwordPhc, passwordPlain);

  const tokenPlain = '12345678-1234-1234-1234-1234567890ab';
  const tokenOptions = { ...commonOptions, timeCost: 2 };
  const tokenPhc = await argon2.hash(tokenPlain, tokenOptions);
  const tokenVerifyOk = await argon2.verify(tokenPhc, tokenPlain);

  const lines = [];
  lines.push('password_plain=' + passwordPlain);
  lines.push('password_salt_hex=' + deterministicSalt.toString('hex'));
  lines.push('password_phc=' + passwordPhc);
  lines.push('password_verify=' + String(passwordVerifyOk));
  lines.push('');
  lines.push('token_plain=' + tokenPlain);
  lines.push('token_salt_hex=' + deterministicSalt.toString('hex'));
  lines.push('token_phc=' + tokenPhc);
  lines.push('token_verify=' + String(tokenVerifyOk));

  const outPath = 'src/docs/argon2-test-vectors.txt';
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log('Wrote test vectors to ' + outPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


