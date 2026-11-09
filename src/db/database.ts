import * as SQLite from "expo-sqlite";

export type Expense = {
  id: number;
  amount: number;
  category: string;
  note: string;
  date: string;
};

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("spendly.db");

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        note TEXT DEFAULT '',
        date TEXT NOT NULL
      );
    `);
  }

  return db;
}

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

  const result = await database.getFirstAsync<Expense>(
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