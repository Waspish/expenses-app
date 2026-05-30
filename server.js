const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { exec } = require("child_process");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Создаем папку для загрузок, если её нет
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Инициализация базы данных
const db = new sqlite3.Database("expenses.db");

// Создание таблиц
db.serialize(() => {
  // Таблица расходов
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      category TEXT,
      date TEXT DEFAULT (datetime('now')),
      image_path TEXT
    )
  `);

  // Таблица категорий
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  // НОВАЯ таблица накоплений
  db.run(`
    CREATE TABLE IF NOT EXISTS savings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT DEFAULT (datetime('now'))
    )
  `);

  // Добавляем основные категории, если их нет
  const defaultCategories = [
    "Продукты",
    "Транспорт",
    "Развлечения",
    "Одежда",
    "Здоровье",
    "Жилье",
    "Подарки",
    "Прочее",
  ];

  const insertCategory = db.prepare(
    "INSERT OR IGNORE INTO categories (name) VALUES (?)"
  );
  defaultCategories.forEach((category) => {
    insertCategory.run(category);
  });
  insertCategory.finalize();
});

// Маршруты API

// Получить все расходы с фильтром по категории
app.get("/api/expenses", (req, res) => {
  const { category, month, year } = req.query;

  let query = "SELECT * FROM expenses WHERE 1=1";
  let params = [];

  // Фильтр по категории
  if (category && category !== "Все категории" && category !== "") {
    query += " AND category = ?";
    params.push(category);
  }

  // Фильтр по месяцу
  if (month && month !== "") {
    query += " AND strftime('%m', date) = ?";
    params.push(month.padStart(2, '0'));
  }

  // Фильтр по году
  if (year && year !== "") {
    query += " AND strftime('%Y', date) = ?";
    params.push(year);
  }

  query += " ORDER BY date DESC";


  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Database error in /api/expenses:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Добавить новый расход
app.post("/api/expenses", upload.single("image"), (req, res) => {
  const { person, amount, description, category } = req.body;
  const imagePath = req.file ? req.file.filename : null;

  if (!person || !amount) {
    return res.status(400).json({ error: "Укажите человека и сумму" });
  }

  db.run(
    "INSERT INTO expenses (person, amount, description, category, image_path) VALUES (?, ?, ?, ?, ?)",
    [person, parseFloat(amount), description, category, imagePath],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Возвращаем созданную запись
      db.get(
        "SELECT * FROM expenses WHERE id = ?",
        [this.lastID],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(row);
        }
      );
    }
  );
});

// Получить текущий баланс
app.get("/api/balance", (req, res) => {
  const query = `
    WITH persons AS (SELECT 'Андрей' as person UNION SELECT 'Настя' as person)
    SELECT
      p.person,
      COALESCE((
        SELECT SUM(amount) FROM savings WHERE person = p.person
      ), 0) as total_savings,
      COALESCE((
        SELECT SUM(amount) FROM expenses WHERE person = p.person
      ), 0) as total_expenses
    FROM persons p
  `;

  db.all(query, (err, rows) => {
    if (err) {
      console.error("Database error in /api/balance:", err);
      return res.status(500).json({ error: err.message });
    }

    const balance = {
      "Андрей": { savings: 0, expenses: 0, balance: 0 },
      "Настя": { savings: 0, expenses: 0, balance: 0 }
    };

    rows.forEach(row => {
      if (balance[row.person]) {
        balance[row.person] = {
          savings: row.total_savings,
          expenses: row.total_expenses,
          balance: row.total_savings - row.total_expenses
        };
      }
    });

    res.json(balance);
  });
});

// Получить категории
app.get("/api/categories", (req, res) => {
  db.all("SELECT * FROM categories ORDER BY name", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Получить статистику с фильтром по категории
app.get("/api/statistics", (req, res) => {
  const { category, month, year } = req.query;

  let query = `
    SELECT
      person,
      SUM(amount) as total,
      COUNT(*) as count
    FROM expenses
    WHERE 1=1
  `;
  let params = [];

  // Фильтр по категории
  if (category && category !== "" && category !== "Все категории") {
    query += " AND category = ?";
    params.push(category);
  }

  // Фильтр по месяцу
  if (month && month !== "") {
    query += " AND strftime('%m', date) = ?";
    params.push(month.padStart(2, '0'));
  }

  // Фильтр по году
  if (year && year !== "") {
    query += " AND strftime('%Y', date) = ?";
    params.push(year);
  }

  query += " GROUP BY person";


  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Database error in /api/statistics:", err);
      return res.status(500).json({ error: err.message });
    }

    // Если нет данных для выбранных фильтров, возвращаем пустой массив
    res.json(rows);
  });
});

// Получить доступные годы из базы данных
app.get("/api/available-years", (req, res) => {
  db.all(
    "SELECT DISTINCT strftime('%Y', date) as year FROM expenses ORDER BY year DESC",
    (err, rows) => {
      if (err) {
        console.error("Database error in /api/available-years:", err);
        return res.status(500).json({ error: err.message });
      }

      const years = rows.map(row => row.year).filter(year => year);
      res.json(years);
    }
  );
});

// Удалить расход
app.delete("/api/expenses/:id", (req, res) => {
  const { id } = req.params;

  // Сначала получаем информацию о файле изображения
  db.get("SELECT image_path FROM expenses WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Удаляем файл изображения, если он существует
    if (row && row.image_path) {
      const imagePath = path.join(__dirname, "uploads", row.image_path);
      fs.unlink(imagePath, (err) => {
        if (err) console.error("Ошибка удаления файла:", err);
      });
    }

    // Удаляем запись из базы данных
    db.run("DELETE FROM expenses WHERE id = ?", [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Расход не найден" });
      }
      res.json({ message: "Расход удален" });
    });
  });
});

// Добавить накопления
app.post("/api/savings", (req, res) => {
  const { person, amount, description } = req.body;

  if (!person || !amount) {
    return res.status(400).json({ error: "Укажите человека и сумму" });
  }

  db.run(
    "INSERT INTO savings (person, amount, description) VALUES (?, ?, ?)",
    [person, parseFloat(amount), description],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Возвращаем созданную запись
      db.get(
        "SELECT * FROM savings WHERE id = ?",
        [this.lastID],
        (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json(row);
        }
      );
    }
  );
});

// Получить историю накоплений с пагинацией
app.get("/api/savings", (req, res) => {
  const { limit = 5, offset = 0 } = req.query;

  db.all(
    "SELECT * FROM savings ORDER BY date DESC LIMIT ? OFFSET ?",
    [parseInt(limit), parseInt(offset)],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Получить общую сумму накоплений (для статистики)
app.get("/api/savings/total", (req, res) => {
  db.all(
    "SELECT person, SUM(amount) as total FROM savings GROUP BY person",
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const result = {};
      rows.forEach(row => {
        result[row.person] = row.total;
      });

      res.json(result);
    }
  );
});

// Удалить накопления
app.delete("/api/savings/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM savings WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Накопление не найдено" });
    }
    res.json({ message: "Накопление удалено" });
  });
});


// Запуск сервера с доступом по сети
app.listen(PORT, "0.0.0.0", () => {
  const networkInterfaces = os.networkInterfaces();

  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log("🌐 Доступ по следующим адресам:");
  console.log(`- Локальный: http://localhost:${PORT}`);

  // Получаем все IP-адреса
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((networkInterface) => {
      // Пропускаем внутренние и не-IPv4 адреса
      if (networkInterface.family === "IPv4" && !networkInterface.internal) {
        console.log(`- Сеть: http://${networkInterface.address}:${PORT}`);
	exec(`start http://${networkInterface.address}:${PORT}`)
      }
    });
  });
  console.log(
    '\nДля доступа с других устройств используйте адрес из раздела "Сеть"'
  );
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nЗавершение работы сервера...");
  db.close((err) => {
    if (err) {
      console.error("Ошибка при закрытии базы данных:", err);
    } else {
      console.log("База данных успешно закрыта.");
    }
    process.exit(0);
  });
});
