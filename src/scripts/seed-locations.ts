import { PrismaClient } from '@prisma/client'
import path from 'node:path'
import fs from 'node:fs/promises'

type QuarterNode = { name: string }
type DistrictNode = { name: string; quarters: QuarterNode[] }
type TownNode = { name: string; districts: DistrictNode[] }
type ProvinceNode = { name: string; alpha_2_code: string; towns: TownNode[] }

const prisma = new PrismaClient()

async function readJson(): Promise<ProvinceNode[]> {
  const root = path.resolve(__dirname, '../../..')
  const jsonPath = path.join(root, 'ililcemahalle.json')
  const raw = await fs.readFile(jsonPath, 'utf8')
  return JSON.parse(raw) as ProvinceNode[]
}

async function main() {
  const provinces = await readJson()

  for (const province of provinces) {
    const createdProvince = await prisma.province.upsert({
      where: { alpha2Code: province.alpha_2_code },
      update: { name: province.name },
      create: { name: province.name, alpha2Code: province.alpha_2_code },
    })

    for (const town of province.towns) {
      const createdTown = await prisma.town.upsert({
        where: { provinceId_name: { provinceId: createdProvince.id, name: town.name } },
        update: {},
        create: { name: town.name, provinceId: createdProvince.id },
      })

      for (const district of town.districts) {
        const createdDistrict = await prisma.district.upsert({
          where: { townId_name: { townId: createdTown.id, name: district.name } },
          update: {},
          create: { name: district.name, townId: createdTown.id },
        })

        if (district.quarters?.length) {
          const data = district.quarters.map((q) => ({ name: q.name, districtId: createdDistrict.id }))
          await prisma.quarter.createMany({ data, skipDuplicates: true })
        }
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
    // eslint-disable-next-line no-console
    console.log('Location seed completed')
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })


