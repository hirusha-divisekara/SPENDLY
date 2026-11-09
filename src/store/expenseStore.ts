import { create } from "zustand";
import {
    Expense,
    fetchExpenses,
    insertExpense,
    removeExpense,
} from "../db/database";

type ExpenseStore = {
  expenses: Expense[];
  loading: boolean;

  loadExpenses: () => Promise<void>;

  addExpense: (
    amount: number,
    category: string,
    note: string,
  ) => Promise<void>;

  deleteExpense: (id: number) => Promise<void>;
};

export const useExpenseStore = create<ExpenseStore>(
  (set) => ({
    expenses: [],
    loading: false,

    loadExpenses: async () => {
      try {
        set({ loading: true });

        const expenses = await fetchExpenses();

        set({
          expenses,
          loading: false,
        });
      } catch (error) {
        console.error(
          "LOAD EXPENSES ERROR:",
          error,
        );

        set({ loading: false });
      }
    },

    addExpense: async (
      amount,
      category,
      note,
    ) => {
      try {
        await insertExpense(
          amount,
          category,
          note,
        );

        const expenses =
          await fetchExpenses();

        set({ expenses });

        console.log(
          "EXPENSE SAVED:",
          amount,
          category,
        );
      } catch (error) {
        console.error(
          "SAVE EXPENSE ERROR:",
          error,
        );

        throw error;
      }
    },

    deleteExpense: async (id) => {
      try {
        await removeExpense(id);

        const expenses =
          await fetchExpenses();

        set({ expenses });
      } catch (error) {
        console.error(
          "DELETE EXPENSE ERROR:",
          error,
        );
      }
    },
  }),
);