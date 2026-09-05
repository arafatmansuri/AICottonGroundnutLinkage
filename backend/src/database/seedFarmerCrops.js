"use strict";
/**
 * Farmer Crop Seed Script — KisanMitra AI
 *
 * Creates FarmerCrop entries by looking up existing farmers and crops by
 * their well-known seed credentials / names — no hardcoded IDs needed.
 *
 * Prerequisites (run main seed first):
 *   npm run db:seed         ← creates farmers, crops, mandis
 *
 * Run:
 *   npm run db:seed:farmer-crops
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
// ─── Seed data ────────────────────────────────────────────────────────────────
// farmerEmail must match an existing farmer account.
// cropName must match an existing crop record.
var FARMER_CROPS = [
    // ── Ramesh Patel (Ahmedabad) ────────────────────────────────────────────────
    {
        farmerEmail: 'ramesh@farmer.com',
        cropName: 'Cotton',
        quantity: 200,
        soldQuantity: 50,
        unit: 'quintal',
        quality: 'GRADE_A',
        harvestDate: new Date('2025-10-15'),
        storageStatus: 'PARTIALLY_STORED',
        expectedPrice: 7500,
        location: 'Sanand',
        district: 'Ahmedabad',
        notes: '[CROP-SEED] Bt cotton — good lint quality',
    },
    {
        farmerEmail: 'ramesh@farmer.com',
        cropName: 'Groundnut',
        quantity: 80,
        soldQuantity: 20,
        unit: 'quintal',
        quality: 'GRADE_A',
        harvestDate: new Date('2025-11-05'),
        storageStatus: 'NOT_STORED',
        expectedPrice: 6200,
        location: 'Sanand',
        district: 'Ahmedabad',
        notes: '[CROP-SEED] Bold groundnut — Kadi variety',
    },
    // ── Suresh Desai (Rajkot) ───────────────────────────────────────────────────
    {
        farmerEmail: 'suresh@farmer.com',
        cropName: 'Groundnut',
        quantity: 150,
        soldQuantity: 80,
        unit: 'quintal',
        quality: 'GRADE_A',
        harvestDate: new Date('2025-11-05'),
        storageStatus: 'NOT_STORED',
        expectedPrice: 6200,
        location: 'Gondal',
        district: 'Rajkot',
        notes: '[CROP-SEED] Bold groundnut — Kadi variety',
    },
    {
        farmerEmail: 'suresh@farmer.com',
        cropName: 'Cotton',
        quantity: 70,
        soldQuantity: 0,
        unit: 'quintal',
        quality: 'GRADE_B',
        harvestDate: new Date('2025-10-08'),
        storageStatus: 'NOT_STORED',
        expectedPrice: 7000,
        location: 'Gondal',
        district: 'Rajkot',
        notes: '[CROP-SEED] Medium staple cotton',
    },
    // ── Mukesh Ahir (Surendranagar) ─────────────────────────────────────────────
    {
        farmerEmail: 'mukesh@farmer.com',
        cropName: 'Cotton',
        quantity: 250,
        soldQuantity: 100,
        unit: 'quintal',
        quality: 'GRADE_B',
        harvestDate: new Date('2025-10-30'),
        storageStatus: 'PARTIALLY_STORED',
        expectedPrice: 7200,
        location: 'Wadhwan',
        district: 'Surendranagar',
        notes: '[CROP-SEED] Medium staple cotton',
    },
    {
        farmerEmail: 'mukesh@farmer.com',
        cropName: 'Groundnut',
        quantity: 65,
        soldQuantity: 25,
        unit: 'quintal',
        quality: 'GRADE_B',
        harvestDate: new Date('2025-11-20'),
        storageStatus: 'NOT_STORED',
        expectedPrice: 5900,
        location: 'Wadhwan',
        district: 'Surendranagar',
        notes: '[CROP-SEED] Groundnut kharif',
    },
];
// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var emailSet, farmerMap, _i, emailSet_1, email, user, cropNameSet, cropMap, _a, cropNameSet_1, name_1, crop, deleted, created, _b, FARMER_CROPS_1, row, farmerProfileId, cropId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('🌱 Seeding farmer crops...\n');
                    emailSet = __spreadArray([], new Set(FARMER_CROPS.map(function (r) { return r.farmerEmail; })), true);
                    farmerMap = new Map();
                    _i = 0, emailSet_1 = emailSet;
                    _c.label = 1;
                case 1:
                    if (!(_i < emailSet_1.length)) return [3 /*break*/, 4];
                    email = emailSet_1[_i];
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: email },
                            include: { farmerProfile: true },
                        })];
                case 2:
                    user = _c.sent();
                    if (!(user === null || user === void 0 ? void 0 : user.farmerProfile)) {
                        throw new Error("Farmer not found for email: ".concat(email, ". Run db:seed first."));
                    }
                    farmerMap.set(email, user.farmerProfile.id);
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    cropNameSet = __spreadArray([], new Set(FARMER_CROPS.map(function (r) { return r.cropName; })), true);
                    cropMap = new Map();
                    _a = 0, cropNameSet_1 = cropNameSet;
                    _c.label = 5;
                case 5:
                    if (!(_a < cropNameSet_1.length)) return [3 /*break*/, 8];
                    name_1 = cropNameSet_1[_a];
                    return [4 /*yield*/, prisma.crop.findUnique({ where: { name: name_1 } })];
                case 6:
                    crop = _c.sent();
                    if (!crop) {
                        throw new Error("Crop not found: \"".concat(name_1, "\". Run db:seed or db:seed:crops first."));
                    }
                    cropMap.set(name_1, crop.id);
                    _c.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8: return [4 /*yield*/, prisma.farmerCrop.deleteMany({
                        where: { notes: { contains: '[CROP-SEED]' } },
                    })];
                case 9:
                    deleted = _c.sent();
                    if (deleted.count > 0) {
                        console.log("\uD83D\uDDD1\uFE0F  Removed ".concat(deleted.count, " previously seeded farmer-crop records"));
                    }
                    created = 0;
                    _b = 0, FARMER_CROPS_1 = FARMER_CROPS;
                    _c.label = 10;
                case 10:
                    if (!(_b < FARMER_CROPS_1.length)) return [3 /*break*/, 13];
                    row = FARMER_CROPS_1[_b];
                    farmerProfileId = farmerMap.get(row.farmerEmail);
                    cropId = cropMap.get(row.cropName);
                    return [4 /*yield*/, prisma.farmerCrop.create({
                            data: {
                                farmerProfileId: farmerProfileId,
                                cropId: cropId,
                                quantity: row.quantity,
                                soldQuantity: row.soldQuantity,
                                unit: row.unit,
                                quality: row.quality,
                                harvestDate: row.harvestDate,
                                storageStatus: row.storageStatus,
                                expectedPrice: row.expectedPrice,
                                location: row.location,
                                district: row.district,
                                notes: row.notes,
                            },
                        })];
                case 11:
                    _c.sent();
                    created++;
                    console.log("  \u2714 ".concat(row.farmerEmail.split('@')[0].padEnd(8), " \u2192 ").concat(row.cropName.padEnd(12), " ").concat(row.quantity, " qtl"));
                    _c.label = 12;
                case 12:
                    _b++;
                    return [3 /*break*/, 10];
                case 13:
                    console.log("\n\u2705 ".concat(created, " farmer crop records created"));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seed error:', e.message);
    process.exit(1);
})
    .finally(function () { return prisma.$disconnect(); });
