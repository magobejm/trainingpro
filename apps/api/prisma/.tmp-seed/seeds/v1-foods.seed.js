"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FOODS_V1 = void 0;
const FOODS_100G = [
    { name: 'Aceite de oliva virgen extra', caloriesKcal: 884, proteinG: 0, carbsG: 0, fatG: 100 },
    { name: 'Aceitunas verdes', caloriesKcal: 145, proteinG: 1, carbsG: 4, fatG: 15 },
    { name: 'Aceitunas negras', caloriesKcal: 116, proteinG: 1, carbsG: 6, fatG: 11 },
    { name: 'Tomate', caloriesKcal: 18, proteinG: 1, carbsG: 4, fatG: 0 },
    { name: 'Pepino', caloriesKcal: 15, proteinG: 1, carbsG: 4, fatG: 0 },
    { name: 'Pimiento rojo', caloriesKcal: 31, proteinG: 1, carbsG: 6, fatG: 0 },
    { name: 'Pimiento verde', caloriesKcal: 20, proteinG: 1, carbsG: 5, fatG: 0 },
    { name: 'Cebolla', caloriesKcal: 40, proteinG: 1, carbsG: 9, fatG: 0 },
    { name: 'Ajo', caloriesKcal: 149, proteinG: 6, carbsG: 33, fatG: 1 },
    { name: 'Berenjena', caloriesKcal: 25, proteinG: 1, carbsG: 6, fatG: 0 },
    { name: 'Calabacin', caloriesKcal: 17, proteinG: 1, carbsG: 3, fatG: 0 },
    { name: 'Zanahoria', caloriesKcal: 41, proteinG: 1, carbsG: 10, fatG: 0 },
    { name: 'Espinaca', caloriesKcal: 23, proteinG: 3, carbsG: 4, fatG: 0 },
    { name: 'Acelga', caloriesKcal: 19, proteinG: 2, carbsG: 4, fatG: 0 },
    { name: 'Lechuga romana', caloriesKcal: 17, proteinG: 1, carbsG: 3, fatG: 0 },
    { name: 'Rucula', caloriesKcal: 25, proteinG: 3, carbsG: 4, fatG: 1 },
    { name: 'Alcachofa', caloriesKcal: 47, proteinG: 3, carbsG: 11, fatG: 0 },
    { name: 'Brocoli', caloriesKcal: 34, proteinG: 3, carbsG: 7, fatG: 0 },
    { name: 'Coliflor', caloriesKcal: 25, proteinG: 2, carbsG: 5, fatG: 0 },
    { name: 'Judias verdes', caloriesKcal: 31, proteinG: 2, carbsG: 7, fatG: 0 },
    { name: 'Guisantes cocidos', caloriesKcal: 84, proteinG: 5, carbsG: 15, fatG: 0 },
    { name: 'Garbanzos cocidos', caloriesKcal: 164, proteinG: 9, carbsG: 27, fatG: 3 },
    { name: 'Lentejas cocidas', caloriesKcal: 116, proteinG: 9, carbsG: 20, fatG: 0 },
    { name: 'Alubias blancas cocidas', caloriesKcal: 127, proteinG: 9, carbsG: 23, fatG: 1 },
    { name: 'Habas cocidas', caloriesKcal: 88, proteinG: 8, carbsG: 16, fatG: 1 },
    { name: 'Arroz integral cocido', caloriesKcal: 111, proteinG: 3, carbsG: 23, fatG: 1 },
    { name: 'Pasta integral cocida', caloriesKcal: 124, proteinG: 5, carbsG: 26, fatG: 1 },
    { name: 'Pan integral', caloriesKcal: 247, proteinG: 13, carbsG: 41, fatG: 4 },
    { name: 'Quinoa cocida', caloriesKcal: 120, proteinG: 4, carbsG: 21, fatG: 2 },
    { name: 'Avena en copos', caloriesKcal: 389, proteinG: 17, carbsG: 66, fatG: 7 },
    { name: 'Patata cocida', caloriesKcal: 87, proteinG: 2, carbsG: 20, fatG: 0 },
    { name: 'Boniato asado', caloriesKcal: 90, proteinG: 2, carbsG: 21, fatG: 0 },
    { name: 'Naranja', caloriesKcal: 47, proteinG: 1, carbsG: 12, fatG: 0 },
    { name: 'Manzana', caloriesKcal: 52, proteinG: 0, carbsG: 14, fatG: 0 },
    { name: 'Pera', caloriesKcal: 57, proteinG: 0, carbsG: 15, fatG: 0 },
    { name: 'Platano', caloriesKcal: 89, proteinG: 1, carbsG: 23, fatG: 0 },
    { name: 'Uvas', caloriesKcal: 69, proteinG: 1, carbsG: 18, fatG: 0 },
    { name: 'Fresas', caloriesKcal: 32, proteinG: 1, carbsG: 8, fatG: 0 },
    { name: 'Kiwi', caloriesKcal: 61, proteinG: 1, carbsG: 15, fatG: 1 },
    { name: 'Melon', caloriesKcal: 34, proteinG: 1, carbsG: 8, fatG: 0 },
    { name: 'Sandia', caloriesKcal: 30, proteinG: 1, carbsG: 8, fatG: 0 },
    { name: 'Higos frescos', caloriesKcal: 74, proteinG: 1, carbsG: 19, fatG: 0 },
    { name: 'Datiles secos', caloriesKcal: 282, proteinG: 2, carbsG: 75, fatG: 0 },
    { name: 'Almendras', caloriesKcal: 579, proteinG: 21, carbsG: 22, fatG: 50 },
    { name: 'Nueces', caloriesKcal: 654, proteinG: 15, carbsG: 14, fatG: 65 },
    { name: 'Pistachos', caloriesKcal: 562, proteinG: 20, carbsG: 28, fatG: 45 },
    { name: 'Avellanas', caloriesKcal: 628, proteinG: 15, carbsG: 17, fatG: 61 },
    { name: 'Pipas de girasol', caloriesKcal: 584, proteinG: 21, carbsG: 20, fatG: 51 },
    { name: 'Semillas de sesamo', caloriesKcal: 573, proteinG: 18, carbsG: 23, fatG: 50 },
    { name: 'Semillas de chia', caloriesKcal: 486, proteinG: 17, carbsG: 42, fatG: 31 },
    { name: 'Yogur natural entero', caloriesKcal: 61, proteinG: 4, carbsG: 5, fatG: 3 },
    { name: 'Yogur griego natural', caloriesKcal: 97, proteinG: 9, carbsG: 4, fatG: 5 },
    { name: 'Leche semidesnatada', caloriesKcal: 47, proteinG: 3, carbsG: 5, fatG: 2 },
    { name: 'Queso fresco', caloriesKcal: 98, proteinG: 11, carbsG: 3, fatG: 5 },
    { name: 'Requeson', caloriesKcal: 98, proteinG: 11, carbsG: 3, fatG: 4 },
    { name: 'Queso feta', caloriesKcal: 265, proteinG: 14, carbsG: 4, fatG: 21 },
    { name: 'Queso parmesano', caloriesKcal: 431, proteinG: 38, carbsG: 4, fatG: 29 },
    { name: 'Mozzarella', caloriesKcal: 280, proteinG: 28, carbsG: 3, fatG: 17 },
    { name: 'Huevo entero', caloriesKcal: 143, proteinG: 13, carbsG: 1, fatG: 10 },
    { name: 'Clara de huevo', caloriesKcal: 52, proteinG: 11, carbsG: 1, fatG: 0 },
    { name: 'Pechuga de pollo', caloriesKcal: 165, proteinG: 31, carbsG: 0, fatG: 4 },
    { name: 'Pechuga de pavo', caloriesKcal: 135, proteinG: 30, carbsG: 0, fatG: 1 },
    { name: 'Ternera magra', caloriesKcal: 170, proteinG: 26, carbsG: 0, fatG: 7 },
    { name: 'Lomo de cerdo', caloriesKcal: 143, proteinG: 27, carbsG: 0, fatG: 4 },
    { name: 'Jamon serrano', caloriesKcal: 241, proteinG: 31, carbsG: 0, fatG: 13 },
    { name: 'Salmon', caloriesKcal: 208, proteinG: 20, carbsG: 0, fatG: 13 },
    { name: 'Atun fresco', caloriesKcal: 144, proteinG: 24, carbsG: 0, fatG: 5 },
    { name: 'Sardina', caloriesKcal: 208, proteinG: 25, carbsG: 0, fatG: 11 },
    { name: 'Caballa', caloriesKcal: 205, proteinG: 19, carbsG: 0, fatG: 14 },
    { name: 'Merluza', caloriesKcal: 90, proteinG: 18, carbsG: 0, fatG: 2 },
    { name: 'Bacalao fresco', caloriesKcal: 82, proteinG: 18, carbsG: 0, fatG: 1 },
    { name: 'Dorada', caloriesKcal: 96, proteinG: 20, carbsG: 0, fatG: 2 },
    { name: 'Lubina', caloriesKcal: 97, proteinG: 19, carbsG: 0, fatG: 2 },
    { name: 'Pulpo cocido', caloriesKcal: 82, proteinG: 15, carbsG: 2, fatG: 1 },
    { name: 'Mejillones cocidos', caloriesKcal: 172, proteinG: 24, carbsG: 7, fatG: 4 },
    { name: 'Gambas cocidas', caloriesKcal: 99, proteinG: 24, carbsG: 0, fatG: 0 },
    { name: 'Arroz blanco cocido', caloriesKcal: 130, proteinG: 3, carbsG: 28, fatG: 0 },
    { name: 'Cuscus cocido', caloriesKcal: 112, proteinG: 4, carbsG: 23, fatG: 0 },
    { name: 'Bulgur cocido', caloriesKcal: 83, proteinG: 3, carbsG: 19, fatG: 0 },
    { name: 'Pan de centeno', caloriesKcal: 259, proteinG: 9, carbsG: 48, fatG: 3 },
    { name: 'Pan de masa madre', caloriesKcal: 230, proteinG: 8, carbsG: 45, fatG: 2 },
    { name: 'Tomate triturado natural', caloriesKcal: 29, proteinG: 1, carbsG: 6, fatG: 0 },
    { name: 'Salsa de tomate casera', caloriesKcal: 58, proteinG: 1, carbsG: 8, fatG: 2 },
    { name: 'Gazpacho', caloriesKcal: 44, proteinG: 1, carbsG: 4, fatG: 3 },
    { name: 'Hummus', caloriesKcal: 166, proteinG: 8, carbsG: 14, fatG: 9 },
    { name: 'Tahini', caloriesKcal: 595, proteinG: 17, carbsG: 21, fatG: 53 },
    { name: 'Miel', caloriesKcal: 304, proteinG: 0, carbsG: 82, fatG: 0 },
    { name: 'Mermelada sin azucar', caloriesKcal: 110, proteinG: 0, carbsG: 27, fatG: 0 },
    { name: 'Cacao puro en polvo', caloriesKcal: 228, proteinG: 20, carbsG: 58, fatG: 14 },
    { name: 'Chocolate negro 85%', caloriesKcal: 600, proteinG: 12, carbsG: 19, fatG: 52 },
    { name: 'Pasas', caloriesKcal: 299, proteinG: 3, carbsG: 79, fatG: 0 },
    { name: 'Orejones de albaricoque', caloriesKcal: 241, proteinG: 3, carbsG: 63, fatG: 1 },
    { name: 'Ciruelas secas', caloriesKcal: 240, proteinG: 2, carbsG: 64, fatG: 0 },
    { name: 'Granada', caloriesKcal: 83, proteinG: 2, carbsG: 19, fatG: 1 },
    { name: 'Mandarina', caloriesKcal: 53, proteinG: 1, carbsG: 13, fatG: 0 },
    { name: 'Melocoton', caloriesKcal: 39, proteinG: 1, carbsG: 10, fatG: 0 },
    { name: 'Albaricoque', caloriesKcal: 48, proteinG: 1, carbsG: 11, fatG: 0 },
    { name: 'Cereza', caloriesKcal: 63, proteinG: 1, carbsG: 16, fatG: 0 },
    { name: 'Boqueron', caloriesKcal: 131, proteinG: 20, carbsG: 0, fatG: 5 },
    { name: 'Trucha', caloriesKcal: 141, proteinG: 20, carbsG: 0, fatG: 6 },
];
const FOODS_100ML = [
    { name: 'Leche semidesnatada', caloriesKcal: 47, proteinG: 3, carbsG: 5, fatG: 2, foodCategory: 'bebidas' },
    { name: 'Leche desnatada', caloriesKcal: 35, proteinG: 3, carbsG: 5, fatG: 0, foodCategory: 'bebidas' },
    { name: 'Leche entera', caloriesKcal: 61, proteinG: 3, carbsG: 5, fatG: 3, foodCategory: 'bebidas' },
    { name: 'Bebida de almendra sin azucar', caloriesKcal: 24, proteinG: 1, carbsG: 1, fatG: 2, foodCategory: 'bebidas' },
    { name: 'Bebida de avena sin azucar', caloriesKcal: 45, proteinG: 1, carbsG: 7, fatG: 1, foodCategory: 'bebidas' },
    { name: 'Kefir natural', caloriesKcal: 60, proteinG: 3, carbsG: 4, fatG: 3, foodCategory: 'bebidas' },
    { name: 'Gazpacho casero', caloriesKcal: 44, proteinG: 1, carbsG: 4, fatG: 3, foodCategory: 'platos_completos' },
    { name: 'Salmorejo', caloriesKcal: 95, proteinG: 2, carbsG: 8, fatG: 6, foodCategory: 'platos_completos' },
    { name: 'Caldo de verduras', caloriesKcal: 18, proteinG: 1, carbsG: 3, fatG: 0, foodCategory: 'bebidas' },
    { name: 'Crema de calabacin ligera', caloriesKcal: 40, proteinG: 1, carbsG: 4, fatG: 2, foodCategory: 'platos_completos' },
    { name: 'Sopa de tomate', caloriesKcal: 38, proteinG: 1, carbsG: 6, fatG: 1, foodCategory: 'platos_completos' },
    { name: 'Zumo de naranja natural', caloriesKcal: 45, proteinG: 1, carbsG: 10, fatG: 0, foodCategory: 'bebidas' },
    { name: 'Zumo de tomate', caloriesKcal: 17, proteinG: 1, carbsG: 4, fatG: 0, foodCategory: 'bebidas' },
    { name: 'Horchata sin azucar', caloriesKcal: 52, proteinG: 1, carbsG: 10, fatG: 1, foodCategory: 'bebidas' },
    { name: 'Salsa de tomate casera', caloriesKcal: 58, proteinG: 1, carbsG: 8, fatG: 2, foodCategory: 'salsas_y_cremas' },
    { name: 'Pesto ligero', caloriesKcal: 310, proteinG: 6, carbsG: 6, fatG: 30, foodCategory: 'salsas_y_cremas' },
    { name: 'Salsa tzatziki', caloriesKcal: 75, proteinG: 3, carbsG: 4, fatG: 5, foodCategory: 'salsas_y_cremas' },
    { name: 'Crema de yogur natural', caloriesKcal: 80, proteinG: 4, carbsG: 6, fatG: 4, foodCategory: 'salsas_y_cremas' },
    { name: 'Batido de platano con leche', caloriesKcal: 78, proteinG: 3, carbsG: 13, fatG: 2, foodCategory: 'bebidas' },
    { name: 'Batido de frutos rojos', caloriesKcal: 62, proteinG: 2, carbsG: 10, fatG: 1, foodCategory: 'bebidas' },
];
const FOODS_PORTION = [
    { name: 'Huevo entero', caloriesKcal: 72, proteinG: 6, carbsG: 0, fatG: 5, foodCategory: 'carnes_huevos', notes: '1 porcion = 1 huevo mediano (50 g)' },
    { name: 'Tostada integral con tomate', caloriesKcal: 155, proteinG: 5, carbsG: 23, fatG: 4, foodCategory: 'platos_completos', notes: '1 porcion = 1 tostada (65 g)' },
    { name: 'Yogur natural individual', caloriesKcal: 95, proteinG: 6, carbsG: 7, fatG: 4, foodCategory: 'lacteos', notes: '1 porcion = 1 vasito (125 g)' },
    { name: 'Manzana mediana', caloriesKcal: 78, proteinG: 0, carbsG: 21, fatG: 0, foodCategory: 'frutas', notes: '1 porcion = 1 pieza (150 g)' },
    { name: 'Platano mediano', caloriesKcal: 105, proteinG: 1, carbsG: 27, fatG: 0, foodCategory: 'frutas', notes: '1 porcion = 1 pieza (120 g)' },
    { name: 'Naranja mediana', caloriesKcal: 70, proteinG: 1, carbsG: 17, fatG: 0, foodCategory: 'frutas', notes: '1 porcion = 1 pieza (150 g)' },
    { name: 'Pera mediana', caloriesKcal: 85, proteinG: 1, carbsG: 22, fatG: 0, foodCategory: 'frutas', notes: '1 porcion = 1 pieza (170 g)' },
    { name: 'Puñado de almendras', caloriesKcal: 174, proteinG: 6, carbsG: 6, fatG: 15, foodCategory: 'frutos_secos_semillas', notes: '1 porcion = 30 g' },
    { name: 'Puñado de nueces', caloriesKcal: 196, proteinG: 5, carbsG: 4, fatG: 20, foodCategory: 'frutos_secos_semillas', notes: '1 porcion = 30 g' },
    { name: 'Hummus con crudites', caloriesKcal: 180, proteinG: 6, carbsG: 12, fatG: 11, foodCategory: 'platos_completos', notes: '1 porcion = 80 g de hummus + 100 g de verdura' },
    { name: 'Ensalada mediterranea', caloriesKcal: 220, proteinG: 6, carbsG: 14, fatG: 15, foodCategory: 'platos_completos', notes: '1 porcion = plato mediano (280 g)' },
    { name: 'Lentejas estofadas', caloriesKcal: 265, proteinG: 14, carbsG: 34, fatG: 7, foodCategory: 'platos_completos', notes: '1 porcion = plato hondo (300 g)' },
    { name: 'Garbanzos con verduras', caloriesKcal: 290, proteinG: 13, carbsG: 36, fatG: 8, foodCategory: 'platos_completos', notes: '1 porcion = plato hondo (300 g)' },
    { name: 'Pasta integral con tomate', caloriesKcal: 340, proteinG: 12, carbsG: 58, fatG: 7, foodCategory: 'platos_completos', notes: '1 porcion = plato (280 g)' },
    { name: 'Arroz con verduras', caloriesKcal: 320, proteinG: 7, carbsG: 54, fatG: 8, foodCategory: 'platos_completos', notes: '1 porcion = plato (300 g)' },
    { name: 'Paella de marisco casera', caloriesKcal: 420, proteinG: 22, carbsG: 48, fatG: 14, foodCategory: 'platos_completos', notes: '1 porcion = plato (350 g)' },
    { name: 'Pechuga de pollo a la plancha', caloriesKcal: 198, proteinG: 37, carbsG: 0, fatG: 5, foodCategory: 'carnes_huevos', notes: '1 porcion = filete (120 g)' },
    { name: 'Salmon al horno', caloriesKcal: 250, proteinG: 24, carbsG: 0, fatG: 16, foodCategory: 'pescados_mariscos', notes: '1 porcion = lomo (120 g)' },
    { name: 'Tortilla francesa', caloriesKcal: 185, proteinG: 13, carbsG: 1, fatG: 14, foodCategory: 'carnes_huevos', notes: '1 porcion = 2 huevos (110 g)' },
    { name: 'Yogur con avena y fruta', caloriesKcal: 230, proteinG: 10, carbsG: 32, fatG: 6, foodCategory: 'platos_completos', notes: '1 porcion = bol (220 g)' },
];
exports.FOODS_V1 = [
    ...FOODS_100G.map((item, index) => ({
        ...item,
        foodCategory: resolve100gCategory(index + 1),
        foodType: resolve100gType(index + 1),
        id: buildId(index + 1),
        servingUnit: '100g',
    })),
    ...FOODS_100ML.map((item, index) => ({
        ...item,
        foodType: (item.foodCategory === 'platos_completos'
            ? 'plato'
            : 'ingrediente'),
        id: buildId(101 + index),
        servingUnit: '100ml',
    })),
    ...FOODS_PORTION.map((item, index) => ({
        ...item,
        foodType: (item.foodCategory === 'platos_completos'
            ? 'plato'
            : 'ingrediente'),
        id: buildId(121 + index),
        servingUnit: 'porcion',
    })),
];
function resolve100gCategory(position) {
    if (position <= 3)
        return 'aceites_y_grasas';
    if (position <= 20)
        return 'verduras_hortalizas';
    if (position <= 25)
        return 'legumbres';
    if (position <= 32)
        return 'cereales_tuberculos';
    if (position <= 43)
        return 'frutas';
    if (position <= 50)
        return 'frutos_secos_semillas';
    if (position <= 58)
        return 'lacteos';
    if (position <= 65)
        return 'carnes_huevos';
    if (position <= 76)
        return 'pescados_mariscos';
    if (position <= 81)
        return 'cereales_tuberculos';
    if (position <= 86)
        return 'salsas_y_cremas';
    if (position <= 93)
        return 'dulces_y_desayuno';
    if (position <= 98)
        return 'frutas';
    return 'pescados_mariscos';
}
function resolve100gType(position) {
    if (position === 84 || position === 85) {
        return 'plato';
    }
    return 'ingrediente';
}
function buildId(index) {
    return `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`;
}
