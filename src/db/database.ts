import * as SQLite from "expo-sqlite";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */

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
  target_date: string;
  created_at: string;
};

/* ─────────────────────────────────────────────
   DATABASE INSTANCE
───────────────────────────────────────────── */

let db: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/* ─────────────────────────────────────────────
   DATABASE INITIALIZATION
───────────────────────────────────────────── */

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Already initialized
  if (db) {
    return Promise.resolve(db);
  }

  // Initialization already in progress
  if (dbPromise) {
    return dbPromise;
  }

  // Start initialization once
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
          target_date TEXT DEFAULT '',
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

      // Allow initialization to be retried
      // if something fails.
      dbPromise = null;

      throw error;
    }
  })();

  return dbPromise;
}

/* ─────────────────────────────────────────────
   EXPENSES
───────────────────────────────────────────── */

export async function addExpense(
  amount: number,
  category: string,
  note: string
) {
  const database = await getDatabase();

  const result = await database.runAsync(
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

  console.log("✅ EXPENSE INSERTED:", {
    id: result.lastInsertRowId,
    amount,
    category,
    note,
  });

  return result.lastInsertRowId;
}

export async function getExpenses(): Promise<Expense[]> {
  const database = await getDatabase();

  const expenses =
    await database.getAllAsync<Expense>(
      `
        SELECT *
        FROM expenses
        ORDER BY date DESC
      `
    );

  return expenses;
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

  console.log("✏️ EXPENSE UPDATED:", {
    id,
    amount,
    category,
    note,
  });
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

/* ─────────────────────────────────────────────
   BUDGETS
───────────────────────────────────────────── */

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

  /*
   * If a budget already exists for the
   * same category and month, update it.
   */
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

export async function getBudgets(): Promise<Budget[]> {
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

/* ─────────────────────────────────────────────
   SAVINGS GOALS
───────────────────────────────────────────── */

export async function addSavingsGoal(
  name: string,
  targetAmount: number,
  targetDate: string = ""
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
            target_date,
            created_at
          )
        VALUES
          (?, ?, 0, ?, ?)
      `,
      name,
      targetAmount,
      targetDate,
      new Date().toISOString()
    );

  console.log(
    "🎯 SAVINGS GOAL CREATED:",
    {
      id: result.lastInsertRowId,
      name,
      targetAmount,
      targetDate,
    }
  );

  return result.lastInsertRowId;
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const database = await getDatabase();

  const goals =
    await database.getAllAsync<SavingsGoal>(
      `
        SELECT *
        FROM savings_goals
        ORDER BY id DESC
      `
    );

  console.log(
    "🎯 SAVINGS GOALS LOADED:",
    goals
  );

  return goals;
}

export async function getSavingsGoalById(
  id: number
): Promise<SavingsGoal | null> {
  const database = await getDatabase();

  const goal =
    await database.getFirstAsync<SavingsGoal>(
      `
        SELECT *
        FROM savings_goals
        WHERE id = ?
      `,
      id
    );

  return goal ?? null;
}

export async function updateSavingsGoal(
  id: number,
  name: string,
  targetAmount: number,
  targetDate: string
) {
  const database = await getDatabase();

  await database.runAsync(
    `
      UPDATE savings_goals
      SET
        name = ?,
        target_amount = ?,
        target_date = ?
      WHERE id = ?
    `,
    name,
    targetAmount,
    targetDate,
    id
  );

  console.log(
    "✏️ SAVINGS GOAL UPDATED:",
    {
      id,
      name,
      targetAmount,
      targetDate,
    }
  );
}

export async function updateSavingsGoalAmount(
  id: number,
  savedAmount: number
) {
  const database = await getDatabase();

  /*
   * Prevent negative saved amounts.
   */
  const safeAmount =
    Math.max(0, savedAmount);

  await database.runAsync(
    `
      UPDATE savings_goals
      SET saved_amount = ?
      WHERE id = ?
    `,
    safeAmount,
    id
  );

  console.log(
    "💰 SAVINGS GOAL AMOUNT UPDATED:",
    {
      id,
      savedAmount: safeAmount,
    }
  );
}

export async function addToSavingsGoal(
  id: number,
  amount: number
) {
  const database = await getDatabase();

  if (amount <= 0) {
    throw new Error(
      "Savings amount must be greater than zero."
    );
  }

  const goal =
    await database.getFirstAsync<SavingsGoal>(
      `
        SELECT *
        FROM savings_goals
        WHERE id = ?
      `,
      id
    );

  if (!goal) {
    throw new Error(
      "Savings goal not found."
    );
  }

  const newSavedAmount =
    goal.saved_amount + amount;

  await database.runAsync(
    `
      UPDATE savings_goals
      SET saved_amount = ?
      WHERE id = ?
    `,
    newSavedAmount,
    id
  );

  console.log(
    "💵 MONEY ADDED TO SAVINGS GOAL:",
    {
      id,
      addedAmount: amount,
      newSavedAmount,
    }
  );

  return newSavedAmount;
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