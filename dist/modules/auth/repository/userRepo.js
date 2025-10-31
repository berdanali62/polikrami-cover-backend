"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.createUser = createUser;
const database_1 = require("../../../config/database");
async function findUserByEmail(email) {
    return database_1.prisma.user.findUnique({ where: { email } });
}
async function createUser(data) {
    const user = await database_1.prisma.user.create({ data: { email: data.email, password: data.password, name: data.name } });
    if (data.role && data.role !== 'user') {
        // basit: Role tablosunda 'designer' yoksa oluştur, sonra ilişkilendir (test amaçlı)
        const role = await database_1.prisma.role.upsert({ where: { name: data.role }, update: {}, create: { name: data.role } });
        await database_1.prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    }
    return user;
}
