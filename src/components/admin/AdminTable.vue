<template>
  <div>
    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
            <th v-if="$slots.actions">{{ $t('admin.actions') }}</th>
          </tr>
        </thead>
        <transition-group tag="tbody" :name="slideName">
          <tr v-if="pageRows.length === 0" key="empty">
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)">{{ $t('admin.empty') }}</td>
          </tr>
          <tr v-for="row in pageRows" :key="rowKey(row)">
            <td v-for="col in columns" :key="col.key">{{ showCell(row, col) }}</td>
            <td v-if="$slots.actions">
              <div class="row-actions">
                <slot name="actions" :row="row" />
              </div>
            </td>
          </tr>
        </transition-group>
      </table>
    </div>
    <div v-if="totalPages > 1" class="pagination">
      <button class="page-button" type="button" :disabled="page <= 1" @click="changePage(page - 1)">‹</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button class="page-button" type="button" :disabled="page >= totalPages" @click="changePage(page + 1)">›</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminTable',
  props: {
    rows: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    pageSize: { type: Number, default: 8 }
  },
  data() {
    return { page: 1, slideName: 'page-switch' };
  },
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.rows.length / this.pageSize));
    },
    pageRows() {
      const start = (this.page - 1) * this.pageSize;
      return this.rows.slice(start, start + this.pageSize);
    }
  },
  watch: {
    rows() {
      if (this.page > this.totalPages) this.page = this.totalPages;
    }
  },
  methods: {
    rowKey(row) {
      return row.id ?? row.trade_no ?? row.code ?? JSON.stringify(row).slice(0, 80);
    },
    showCell(row, col) {
      if (typeof col.format === 'function') return col.format(row);
      const value = row[col.key];
      if (value == null || value === '') return '—';
      if (typeof value === 'object') return JSON.stringify(value);
      return value;
    },
    changePage(next) {
      this.slideName = next > this.page ? 'page-switch' : 'page-switch-right';
      this.page = next;
    }
  }
};
</script>
