"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = __importDefault(require("node:fs/promises"));
const prisma = new client_1.PrismaClient();
async function readJson() {
    const root = node_path_1.default.resolve(__dirname, '../../..');
    const jsonPath = node_path_1.default.join(root, 'ililcemahalle.json');
    const raw = await promises_1.default.readFile(jsonPath, 'utf8');
    return JSON.parse(raw);
}
async function main() {
    const provinces = await readJson();
    for (const province of provinces) {
        const createdProvince = await prisma.province.upsert({
            where: { alpha2Code: province.alpha_2_code },
            update: { name: province.name },
            create: { name: province.name, alpha2Code: province.alpha_2_code },
        });
        for (const town of province.towns) {
            const createdTown = await prisma.town.upsert({
                where: { provinceId_name: { provinceId: createdProvince.id, name: town.name } },
                update: {},
                create: { name: town.name, provinceId: createdProvince.id },
            });
            for (const district of town.districts) {
                const createdDistrict = await prisma.district.upsert({
                    where: { townId_name: { townId: createdTown.id, name: district.name } },
                    update: {},
                    create: { name: district.name, townId: createdTown.id },
                });
                if (district.quarters?.length) {
                    const data = district.quarters.map((q) => ({ name: q.name, districtId: createdDistrict.id }));
                    await prisma.quarter.createMany({ data, skipDuplicates: true });
                }
            }
        }
    }
}
main()
    .then(async () => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('Location seed completed');
})
    .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
