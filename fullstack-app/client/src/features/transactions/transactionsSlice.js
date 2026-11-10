import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionsApi } from '../../api/transactions';

export const fetchTransactions = createAsyncThunk('transactions/fetch', async (params) => {
  const { data } = await transactionsApi.list(params);
  return data;
});
export const createTransaction = createAsyncThunk('transactions/create', async (payload) => {
  const { data } = await transactionsApi.create(payload);
  return data;
});
export const updateTransaction = createAsyncThunk('transactions/update', async ({ id, ...payload }) => {
  const { data } = await transactionsApi.update(id, payload);
  return data;
});
export const deleteTransaction = createAsyncThunk('transactions/delete', async (id) => {
  await transactionsApi.remove(id);
  return id;
});

const slice = createSlice({
  name: 'transactions',
  initialState: { items: [], total: 0, page: 1, limit: 10, status: 'idle' },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTransactions.fulfilled, (s, a) => {
      s.items = a.payload.data; s.total = a.payload.total; s.page = a.payload.page; s.limit = a.payload.limit; s.status = 'succeeded';
    });
    b.addCase(createTransaction.fulfilled, (s, a) => { s.items.unshift(a.payload); s.total += 1; });
    b.addCase(updateTransaction.fulfilled, (s, a) => {
      const i = s.items.findIndex((x) => x.id === a.payload.id);
      if (i !== -1) s.items[i] = a.payload;
    });
    b.addCase(deleteTransaction.fulfilled, (s, a) => {
      s.items = s.items.filter((x) => x.id !== a.payload); s.total = Math.max(0, s.total - 1);
    });
  },
});
export default slice.reducer;
