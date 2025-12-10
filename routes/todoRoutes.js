const express = require('express');
const router = express.Router();
const { todoValidation } = require('../middleware/validators');

const todoController = require('../controllers/todoController');
const { authenticateToken, isOwnerOrAdmin } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/asyncHandler');
// Применяем проверку токена ко всем маршрутам
router.use(authenticateToken);

router.get('/', asyncHandler(todoController.getAll));
router.get('/:id', isOwnerOrAdmin(async (req) => {
  const todo = await require('../models').Todo.findByPk(req.params.id);
  return todo ? todo.user_id : null;
}), asyncHandler(todoController.getById));

router.post('/', asyncHandler(todoController.create));
router.put('/:id', isOwnerOrAdmin(async (req) => {
  const todo = await require('../models').Todo.findByPk(req.params.id);
  return todo ? todo.user_id : null;
}), asyncHandler(todoController.update));

router.delete('/:id', isOwnerOrAdmin(async (req) => {
  const todo = await require('../models').Todo.findByPk(req.params.id);
  return todo ? todo.user_id : null;
}), asyncHandler(todoController.remove));
router.post('/', todoValidation, asyncHandler(todoController.create));
router.put('/:id', todoValidation, asyncHandler(todoController.update));

module.exports = router;
