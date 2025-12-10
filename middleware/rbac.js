// middleware/rbac.js

// Простая проверка ролей и прав доступа
exports.rbac = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const user = req.user; // из токена, добавленного authMiddleware

      if (!user) {
        return res.status(401).json({ message: 'Неавторизованный доступ' });
      }

      // Если администратор — пропускаем
      if (user.role === 'admin') {
        return next();
      }

      // Здесь можно расширить проверку для конкретных разрешений
      return res.status(403).json({
        message: `Доступ запрещён: требуется разрешение ${requiredPermission}`
      });
    } catch (err) {
      next(err);
    }
  };
};
