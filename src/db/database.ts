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
      `);

      db = database;

      console.log("✅ DATABASE READY");

      return database;
    } catch (error) {
      console.error("❌ DATABASE INIT ERROR:", error);

      // Allow initialization to be retried if something fails
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

  console.log("✏️ EXPENSE UPDATED:", {
    id,
    amount,
    category,
    note,
  });
}

export async function deleteExpense(id: number) {
  const database = await getDatabase();

  await database.runAsync(
    `
      DELETE FROM expenses
      WHERE id = ?
    `,
    id
  );

  console.log("🗑️ EXPENSE DELETED:", id);
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

    console.log("✏️ BUDGET UPDATED:", {
      id: existing.id,
      category,
      amount,
      month,
    });

    return existing.id;
  }

  const result = await database.runAsync(
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

  console.log("✅ BUDGET SAVED:", {
    id: result.lastInsertRowId,
    category,
    amount,
    month,
  });

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

  console.log("💰 BUDGETS LOADED:", budgets);

  return budgets;
}

export async function deleteBudget(id: number) {
  const database = await getDatabase();

  await database.runAsync(
    `
      DELETE FROM budgets
      WHERE id = ?
    `,
    id
  );

  console.log("🗑️ BUDGET DELETED:", id);
}