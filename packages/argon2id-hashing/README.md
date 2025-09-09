# @polikrami/argon2id-hashing (internal)

Argon2id tabanlı parola ve token hashleme yardımcıları. PHC (v=19) çıktı formatı üretir ve doğrular.

## Özellikler

- Argon2id: t=3, m=65536, p=2 (parola) — token için t=2
- 16 byte rastgele salt (varsayılan)
- PHC string ile dil bağımsız doğrulama

## Kurulum

İç dağıtım için `npm pack` ile `.tgz` üretilir ve diğer projeye eklenir.

## Kullanım

```ts
import { Argon2idHasher, createDefaultHasher } from '@polikrami/argon2id-hashing';

const hasher = createDefaultHasher();

const phc = await hasher.hashPassword('P@ssw0rd!');
const ok = await hasher.verifyPassword(phc, 'P@ssw0rd!');

const tokenPhc = await hasher.hashToken('code-1234');
const tokOk = await hasher.verifyTokenHash(tokenPhc, 'code-1234');
```

## Konfigürasyon

```ts
new Argon2idHasher({ timeCost: 3, memoryCost: 65536, parallelism: 2, saltLength: 16 });
```

## Notlar

- PHC string parametreleri içerir; doğrulama hash içinden parametreleri okur.
- Üretimde sabit salt kullanmayın; her hash için rastgele salt üretin.


