const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const { rbac } = require('../middleware/rbac');
const { asyncHandler } = require('../middleware/asyncHandler');
const { categoryValidation } = require('../middleware/validators');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Получить список всех категорий
 *     responses:
 *       200:
 *         description: Список категорий
 *   post:
 *     summary: Создать новую категорию
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Категория создана
 */
router.use(authenticateToken);
// 🧩 CRUD для категори
router.post('/', categoryValidation, asyncHandler(categoryController.create));
router.put('/:id', categoryValidation, asyncHandler(categoryController.update));
router.get('/', asyncHandler(categoryController.getAll));
router.get('/:id', asyncHandler(categoryController.getById));
router.post('/', isAdmin, asyncHandler(categoryController.create)); // только admin
router.put('/:id', isAdmin, asyncHandler(categoryController.update));
router.delete('/:id', isAdmin, rbac('DELETE_CATEGORY'), asyncHandler(categoryController.remove));

module.exports = router;

