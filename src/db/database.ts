import * as SQLite from "expo-sqlite";

export type Expense = {
  id: number;
  amount: number;
  category: string;
  note: string;
  date: string;
};

export type Budget = {
  id: number;
  category: string;
  amount: number;
  month: string;
};

export type SavingsGoal = {
  id: number;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string;
  icon: string;
  created_at: string;
};

export type RecurringExpense = {
  id: number;
  amount: number;
  category: string;
  note: string;
  frequency: string;
  next_date: string;
  active: number;
  created_at: string;
};

export type CustomCategory = {
  id: number;
  name: string;
  icon: string;
  created_at: string;
};

let db: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/* ========================================================= */
/* DATABASE INITIALIZATION */
/* ========================================================= */

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return Promise.resolve(db);

  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    try {
      const database =
        await SQLite.openDatabaseAsync("spendly.db");

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          note TEXT DEFAULT '',
          date TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          amount REAL NOT NULL,
          month TEXT NOT NULL,
          UNIQUE(category, month)
        );

        CREATE TABLE IF NOT EXISTS savings_goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          target_amount REAL NOT NULL,
          saved_amount REAL NOT NULL DEFAULT 0,
          deadline TEXT NOT NULL,
          icon TEXT NOT NULL DEFAULT 'flag-outline',
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS recurring_expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          note TEXT DEFAULT '',
          frequency TEXT NOT NULL,
          next_date TEXT NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS custom_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          icon TEXT NOT NULL DEFAULT 'wallet-outline',
          created_at TEXT NOT NULL
        );
      `);

      db = database;

      console.log("✅ DATABASE READY");

      return database;
    } catch (error) {
      console.error(
        "❌ DATABASE INIT ERROR:",
        error
      );

      dbPromise = null;

      throw error;
    }
  })();

  return dbPromise;
}

/* ========================================================= */
/* EXPENSES */
/* ========================================================= */

export async function addExpense(
  amount: number,
  category: string,
  note: string
) {
  const database = await getDatabase();

  const result =
    await database.runAsync(
      `
        INSERT INTO expenses
          (amount, category, note, date)
        VALUES
          (?, ?, ?, ?)
      `,
      amount,
      category,
      note,
      new Date().toISOString()
    );

  console.log(
    "✅ EXPENSE INSERTED:",
    {
      id: result.lastInsertRowId,
      amount,
      category,
      note,
    }
  );

  return result.lastInsertRowId;
}

export async function getExpenses(): Promise<
  Expense[]
> {
  const database = await getDatabase();

  return await database.getAllAsync<Expense>(
    `
      SELECT *
      FROM expenses
      ORDER BY date DESC
    `
  );
}

export async function getExpenseById(
  id: number
): Promise<Expense | null> {
  const database = await getDatabase();

  const result =
    await database.getFirstAsync<Expense>(
      `
        SELECT *
        FROM expenses
        WHERE id = ?
      `,
      id
    );

  return result ?? null;
}

export async function updateExpense(
  id: number,
  amount: number,
  category: string,
  note: string
) {
  const database = await getDatabase();

  await database.runAsync(
    `
      UPDATE expenses
      SET
        amount = ?,
        category = ?,
        note = ?
      WHERE id = ?
    `,
    amount,
    category,
    note,
    id
  );

  console.log(
    "✏️ EXPENSE UPDATED:",
    {
      id,
      amount,
      category,
      note,
    }
  );
}

export async function deleteExpense(
  id: number
) {
  const database = await getDatabase();

  await database.runAsync(
    `
      DELETE FROM expenses
      WHERE id = ?
    `,
    id
  );

  console.log(
    "🗑️ EXPENSE DELETED:",
    id
  );
}

/* ========================================================= */
/* BUDGETS */
/* ========================================================= */

export async function addBudget(
  category: string,
  amount: number
) {
  const database = await getDatabase();

  const month = new Date()
    .toISOString()
    .slice(0, 7);

  console.log("💰 SAVING BUDGET...");
  console.log("Category:", category);
  console.log("Amount:", amount);
  console.log("Month:", month);

  const existing =
    await database.getFirstAsync<Budget>(
      `
        SELECT *
        FROM budgets
        WHERE category = ?
        AND month = ?
      `,
      category,
      month
    );

  if (existing) {
    await database.runAsync(
      `
        UPDATE budgets
        SET amount = ?
        WHERE id = ?
      `,
      amount,
      existing.id
    );

    console.log(
      "✏️ BUDGET UPDATED:",
      {
        id: existing.id,
        category,
        amount,
        month,
      }
    );

    return existing.id;
  }

  const result =
    await database.runAsync(
      `
        INSERT INTO budgets
          (category, amount, month)
        VALUES
          (?, ?, ?)
      `,
      category,
      amount,
      month
    );

  console.log(
    "✅ BUDGET SAVED:",
    {
      id: result.lastInsertRowId,
      category,
      amount,
      month,
    }
  );

  return result.lastInsertRowId;
}

export async function getBudgets(): Promise<
  Budget[]
> {
  const database = await getDatabase();

  const month = new Date()
    .toISOString()
    .slice(0, 7);

  const budgets =
    await database.getAllAsync<Budget>(
      `
        SELECT *
        FROM budgets
        WHERE month = ?
        ORDER BY category ASC
      `,
      month
    );

  console.log(
    "💰 BUDGETS LOADED:",
    budgets
  );

  return budgets;
}

export async function deleteBudget(
  id: number
) {
  const database = await getDatabase();

  await database.runAsync(
    `
      DELETE FROM budgets
      WHERE id = ?
    `,
    id
  );

  console.log(
    "🗑️ BUDGET DELETED:",
    id
  );
}

/* ========================================================= */
/* SAVINGS GOALS */
/* ========================================================= */

export async function addSavingsGoal(
  name: string,
  targetAmount: number,
  deadline: string,
  icon: string
) {
  const database = await getDatabase();

  const result =
    await database.runAsync(
      `
        INSERT INTO savings_goals
          (
            name,
            target_amount,
            saved_amount,
            deadline,
            icon,
            created_at
          )
        VALUES
          (?, ?, 0, ?, ?, ?)
      `,
      name.trim(),
      targetAmount,
      deadline,
      icon,
      new Date().toISOString()
    );

  console.log(
    "🎯 SAVINGS GOAL ADDED:",
    {
      id: result.lastInsertRowId,
      name,
      targetAmount,
      deadline,
      icon,
    }
  );

  return result.lastInsertRowId;
}

export async function getSavingsGoals(): Promise<
  SavingsGoal[]
> {
  const database = await getDatabase();

  return await database.getAllAsync<SavingsGoal>(
    `
      SELECT *
      FROM savings_goals
      ORDER BY created_at DESC
    `
  );
}

export async function getSavingsGoalById(
  id: number
): Promise<SavingsGoal | null> {
  const database = await getDatabase();

  const result =
    await database.getFirstAsync<SavingsGoal>(
      `
        SELECT *
        FROM savings_goals
        WHERE id = ?
      `,
      id
    );

  return result ?? null;
}

export async function updateSavingsGoal(
  id: number,
  name: string,
  targetAmount: number,
  deadline: string,
  icon: string
) {
  const database = await getDatabase();

  await database.runAsync(
    `
      UPDATE savings_goals
      SET
        name = ?,
        target_amount = ?,
        deadline = ?,
        icon = ?
      WHERE id = ?
    `,
    name.trim(),
    targetAmount,
    deadline,
    icon,
    id
  );

  console.log(
    "✏️ SAVINGS GOAL UPDATED:",
    {
      id,
      name,
      targetAmount,
      deadline,
      icon,
    }
  );
}

export async function updateSavingsGoalAmount(
  id: number,
  savedAmount: number
) {
  const database = await getDatabase();

  await database.runAsync(
    `
      UPDATE savings_goals
      SET saved_amount = ?
      WHERE id = ?
    `,
    savedAmount,
    id
  );
}

export async function addToSavingsGoal(
  id: number,
  amount: number
) {
  const database = await getDatabase();

  const goal =
    await getSavingsGoalById(id);

  if (!goal) {
    throw new Error(
      "Savings goal not found."
    );
  }

  const newAmount =
    goal.saved_amount + amount;

  await database.runAsync(
    `
      UPDATE savings_goals
      SET saved_amount = ?
      WHERE id = ?
    `,
    newAmount,
    id
  );

  console.log(
    "💰 MONEY ADDED TO GOAL:",
    {
      id,
      amount,
      newAmount,
    }
  );
}

export async function deleteSavingsGoal(
  id: number
) {
  const database = await getDatabase();

  await database.runAsync(
    `
      DELETE FROM savings_goals
      WHERE id = ?
    `,
    id
  );

  console.log(
    "🗑️ SAVINGS GOAL DELETED:",
    id
  );
}

/* ========================================================= */
/* RECURRING EXPENSES */
/* ========================================================= */

export async function addRecurringExpense(
  amount: number,
  category: string,
  note: string,
  frequency: string,
  nextDate: string
) {
  const database = await getDatabase();

  const result =
    await database.runAsync(
      `
        INSERT INTO recurring_expenses
          (
            amount,
            category,
            note,
            frequency,
            next_date,
            active,
            created_at
          )
        VALUES
          (?, ?, ?, ?, ?, 1, ?)
      `,
      amount,
      category,
      note.trim(),
      frequency,
      nextDate,
      new Date().toISOString()
    );

  console.log(
    "🔁 RECURRING EXPENSE ADDED:",
    {
      id: result.lastInsertRowId,
      amount,
      category,
      frequency,
      nextDate,
    }
  );

  return result.lastInsertRowId;
}

export async function getRecurringExpenses(): Promise<
  RecurringExpense[]
> {
  const database = await getDatabase();

  return await database.getAllAsync<RecurringExpense>(
    `
      SELECT *
      FROM recurring_expenses
      ORDER BY next_date ASC
    `
  );
}

export async function getRecurringExpenseById(
  id: number
): Promise<RecurringExpense | null> {
  const database = await getDatabase();

  const result =
    await database.getFirstAsync<RecurringExpense>(
      `
        SELECT *
        FROM recurring_expenses
        WHERE id = ?
      `,
      id
    );

  return result ?? null;
}

export async function updateRecurringExpense(
  id: number,
  amount: number,
  category: string,
  note: string,
  frequency: string,
  nextDate: string
) {
  const database = await getDatabase();

  await database.runAsync(
    `
      UPDATE recurring_expenses
      SET
        amount = ?,
        category = ?,
        note = ?,
        frequency = ?,
        next_date = ?
      WHERE id = ?
    `,
    amount,
    category,
    note.trim(),
    frequency,
    nextDate,
    id
  );

  console.log(
    "✏️ RECURRING EXPENSE UPDATED:",
    id
  );
}

export async function toggleRecurringExpense(
  id: number,
  active: number
) {
  const database = await getDatabase();

  await database.runAsync(
    `
      UPDATE recurring_expenses
      SET active = ?
      WHERE id = ?
    `,
    active,
    id
  );

  console.log(
    active
      ? "▶️ RECURRING EXPENSE RESUMED:"
      : "⏸️ RECURRING EXPENSE PAUSED:",
    id
  );
}

export async function deleteRecurringExpense(
  id: number
) {
  const database = await getDatabase();

  await database.runAsync(
    `
      DELETE FROM recurring_expenses
      WHERE id = ?
    `,
    id
  );

  console.log(
    "🗑️ RECURRING EXPENSE DELETED:",
    id
  );
}

/* ========================================================= */
/* CUSTOM CATEGORIES */
/* ========================================================= */

export async function addCustomCategory(
  name: string,
  icon: string
) {
  const database = await getDatabase();

  const cleanName =
    name.trim();

  if (!cleanName) {
    throw new Error(
      "Category name is required."
    );
  }

  const result =
    await database.runAsync(
      `
        INSERT INTO custom_categories
          (
            name,
            icon,
            created_at
          )
        VALUES
          (?, ?, ?)
      `,
      cleanName,
      icon,
      new Date().toISOString()
    );

  console.log(
    "🏷️ CUSTOM CATEGORY ADDED:",
    {
      id: result.lastInsertRowId,
      name: cleanName,
      icon,
    }
  );

  return result.lastInsertRowId;
}

export async function getCustomCategories(): Promise<
  CustomCategory[]
> {
  const database = await getDatabase();

  return await database.getAllAsync<CustomCategory>(
    `
      SELECT *
      FROM custom_categories
      ORDER BY name COLLATE NOCASE ASC
    `
  );
}

export async function getCustomCategoryById(
  id: number
): Promise<CustomCategory | null> {
  const database = await getDatabase();

  const result =
    await database.getFirstAsync<CustomCategory>(
      `
        SELECT *
        FROM custom_categories
        WHERE id = ?
      `,
      id
    );

  return result ?? null;
}

export async function updateCustomCategory(
  id: number,
  name: string,
  icon: string
) {
  const database = await getDatabase();

  const cleanName =
    name.trim();

  if (!cleanName) {
    throw new Error(
      "Category name is required."
    );
  }

  await database.runAsync(
    `
      UPDATE custom_categories
      SET
        name = ?,
        icon = ?
      WHERE id = ?
    `,
    cleanName,
    icon,
    id
  );

  console.log(
    "✏️ CUSTOM CATEGORY UPDATED:",
    {
      id,
      name: cleanName,
      icon,
    }
  );
}

export async function deleteCustomCategory(
  id: number
) {
  const database = await getDatabase();

  await database.runAsync(
    `
      DELETE FROM custom_categories
      WHERE id = ?
    `,
    id
  );

  console.log(
    "🗑️ CUSTOM CATEGORY DELETED:",
    id
  );
}