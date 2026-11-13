import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionsApi } from '../../api/transactions';

export const fetchTransactions = createAsyncThunk(
  'transactions/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await transactionsApi.list(params);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось загрузить транзакции'
      );
    }
  }
);

export const createTransaction = createAsyncThunk(
  'transactions/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await transactionsApi.create(payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось добавить транзакцию'
      );
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await transactionsApi.update(id, payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось обновить транзакцию'
      );
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/delete',
  async (id, { rejectWithValue }) => {
    try {
      await transactionsApi.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось удалить транзакцию'
      );
    }
  }
);

const slice = createSlice({
  name: 'transactions',
  initialState: {
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    clearTransactionsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.items = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.status = 'succeeded';
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createTransaction.pending, (state) => {
        state.error = null;
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateTransaction.pending, (state) => {
        state.error = null;
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearTransactionsError } = slice.actions;
export default slice.reducer;
