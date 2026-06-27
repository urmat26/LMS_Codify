// -------------------------------------------------------------------------- //
//  INITIAL MOCK DATA (Fallback if localStorage is empty)                      //
// -------------------------------------------------------------------------- //
const DEFAULT_GROUPS = [
  { id: 'fe-302', name: 'Frontend-302', teacher: 'Алексей' },
  { id: 'py-105', name: 'Python-105', teacher: 'Мария' },
  { id: 'ui-401', name: 'UX/UI-401', teacher: 'Диана' }
];

const DEFAULT_STUDENTS = [
  // Frontend-302
  { id: 'st-1', name: 'Аскар Аскаров', groupId: 'fe-302', balance: 1200, lastDeductedDate: null },
  { id: 'st-2', name: 'Бегаим Бакирова', groupId: 'fe-302', balance: 850, lastDeductedDate: null },
  { id: 'st-3', name: 'Данияр Давлетов', groupId: 'fe-302', balance: 150, lastDeductedDate: null },
  { id: 'st-4', name: 'Екатерина Елисеева', groupId: 'fe-302', balance: 2100, lastDeductedDate: null },
  { id: 'st-5', name: 'Исламбек Исмаилов', groupId: 'fe-302', balance: 50, lastDeductedDate: null },
  { id: 'st-6', name: 'Мээрим Маратова', groupId: 'fe-302', balance: 950, lastDeductedDate: null },
  { id: 'st-7', name: 'Нурбек Назаров', groupId: 'fe-302', balance: 300, lastDeductedDate: null },
  { id: 'st-8', name: 'Салтанат Садыкова', groupId: 'fe-302', balance: 1600, lastDeductedDate: null },
  
  // Python-105
  { id: 'st-9', name: 'Алина Асанова', groupId: 'py-105', balance: 1400, lastDeductedDate: null },
  { id: 'st-10', name: 'Бексултан Болотов', groupId: 'py-105', balance: 110, lastDeductedDate: null },
  { id: 'st-11', name: 'Гульзада Гапарова', groupId: 'py-105', balance: 750, lastDeductedDate: null },
  { id: 'st-12', name: 'Жаныбек Жумаев', groupId: 'py-105', balance: 1900, lastDeductedDate: null },
  { id: 'st-13', name: 'Канат Кадыров', groupId: 'py-105', balance: 400, lastDeductedDate: null },
  { id: 'st-14', name: 'Нурсултан Нурланов', groupId: 'py-105', balance: 95, lastDeductedDate: null },

  // UX/UI-401
  { id: 'st-15', name: 'Айпери Алиева', groupId: 'ui-401', balance: 1350, lastDeductedDate: null },
  { id: 'st-16', name: 'Дастан Дооронов', groupId: 'ui-401', balance: 280, lastDeductedDate: null },
  { id: 'st-17', name: 'Камилла Караева', groupId: 'ui-401', balance: 1750, lastDeductedDate: null },
  { id: 'st-18', name: 'Руслан Рахимов', groupId: 'ui-401', balance: 90, lastDeductedDate: null },
  { id: 'st-19', name: 'Эльвира Эсенова', groupId: 'ui-401', balance: 600, lastDeductedDate: null }
];

const DEFAULT_MERCH = [
  { id: 'm-1', name: 'Худи', cost: 1000, desc: 'Теплый брендированный оверсайз худи', icon: '🧥' },
  { id: 'm-2', name: 'Бомбер', cost: 1500, desc: 'Стильный осенний бомбер LMS Codify', icon: '🧥' },
  { id: 'm-3', name: 'Кружка', cost: 300, desc: 'Керамическая кружка с принтом для кофе', icon: '🥤' },
  { id: 'm-4', name: 'Носки', cost: 200, desc: 'Фирменные носки «Код живи, век учись»', icon: '🧦' },
  { id: 'm-5', name: 'Стикеры', cost: 50, desc: 'Набор IT-стикеров для ноутбука', icon: '🎨' },
  { id: 'm-6', name: 'Блокнот', cost: 150, desc: 'Блокнот в линейку для записей лекций', icon: '📓' }
];

const DEFAULT_HISTORY = [
  {
    id: 'tx-1',
    date: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    studentId: 'st-3', // Данияр Давлетов
    studentName: 'Данияр Давлетов',
    groupName: 'Frontend-302',
    itemName: 'Стикеры',
    itemCost: 50,
    qty: 2,
    totalDeducted: 100,
    operator: 'Отдел Заботы',
    status: 'completed', // completed | reverted
    isCustom: false
  },
  {
    id: 'tx-2',
    date: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    studentId: 'st-7', // Нурбек Назаров
    studentName: 'Нурбек Назаров',
    groupName: 'Frontend-302',
    itemName: 'Носки',
    itemCost: 200,
    qty: 1,
    totalDeducted: 200,
    operator: 'Отдел Заботы',
    status: 'completed',
    isCustom: false
  }
];

// -------------------------------------------------------------------------- //
//  STATE MANAGEMENT                                                          //
// -------------------------------------------------------------------------- //
class AppState {
  constructor() {
    this.groups = this.load('codecoin_groups', DEFAULT_GROUPS);
    this.students = this.load('codecoin_students', DEFAULT_STUDENTS);
    this.merch = this.load('codecoin_merch', DEFAULT_MERCH);
    this.history = this.load('codecoin_history', DEFAULT_HISTORY);
    
    // Sync active student status today from history
    this.updateStudentDeductionFlags();
  }

  load(key, fallback) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  }

  save(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  updateStudentDeductionFlags() {
    // Clear flags first
    this.students.forEach(st => st.lastDeductedDate = null);
    
    // Find completed transactions from today
    const today = new Date().toDateString();
    this.history.forEach(tx => {
      if (tx.status === 'completed') {
        const txDate = new Date(tx.date).toDateString();
        if (txDate === today) {
          const student = this.students.find(s => s.id === tx.studentId);
          if (student) {
            student.lastDeductedDate = tx.date;
          }
        }
      }
    });
  }

  persistAll() {
    this.save('codecoin_groups', this.groups);
    this.save('codecoin_students', this.students);
    this.save('codecoin_merch', this.merch);
    this.save('codecoin_history', this.history);
    this.updateStudentDeductionFlags();
  }

  // Business operations
  deductCoins(studentId, itemObj, qty, isCustom = false, customAmount = 0, comment = '') {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return { success: false, msg: 'Студент не найден' };

    let itemName = '';
    let itemCost = 0;
    let totalCost = 0;

    if (isCustom) {
      itemName = `Списание: ${comment}`;
      itemCost = customAmount;
      totalCost = customAmount;
    } else {
      itemName = itemObj.name;
      itemCost = itemObj.cost;
      totalCost = itemCost * qty;
    }

    if (student.balance < totalCost) {
      return { success: false, msg: 'Недостаточно коинов на балансе' };
    }

    // Deduct
    student.balance -= totalCost;
    
    // Create transaction
    const group = this.groups.find(g => g.id === student.groupId);
    const newTx = {
      id: 'tx-' + Date.now(),
      date: new Date().toISOString(),
      studentId: student.id,
      studentName: student.name,
      groupName: group ? group.name : 'Unknown',
      itemName: itemName,
      itemCost: itemCost,
      qty: isCustom ? 1 : qty,
      totalDeducted: totalCost,
      operator: 'Отдел Заботы',
      status: 'completed',
      isCustom: isCustom
    };

    this.history.unshift(newTx);
    this.persistAll();
    return { success: true, tx: newTx, student: student };
  }

  revertTransaction(txId) {
    const tx = this.history.find(t => t.id === txId);
    if (!tx) return { success: false, msg: 'Транзакция не найдена' };
    if (tx.status === 'reverted') return { success: false, msg: 'Транзакция уже отменена' };

    const student = this.students.find(s => s.id === tx.studentId);
    if (!student) return { success: false, msg: 'Студент для возврата не найден' };

    // Return coins
    student.balance += tx.totalDeducted;
    tx.status = 'reverted';

    this.persistAll();
    return { success: true, tx: tx, student: student };
  }

  // Merch Catalog CRUD
  saveMerchItem(id, name, cost, desc, icon) {
    if (id) {
      // Edit
      const item = this.merch.find(m => m.id === id);
      if (item) {
        item.name = name;
        item.cost = Number(cost);
        item.desc = desc;
        item.icon = icon;
      }
    } else {
      // Add
      const newItem = {
        id: 'm-' + Date.now(),
        name: name,
        cost: Number(cost),
        desc: desc,
        icon: icon
      };
      this.merch.push(newItem);
    }
    this.persistAll();
  }

  deleteMerchItem(id) {
    this.merch = this.merch.filter(m => m.id !== id);
    this.persistAll();
  }
}

// Instantiate state
const state = new AppState();

// -------------------------------------------------------------------------- //
//  DOM ELEMENTS & ROUTING                                                    //
// -------------------------------------------------------------------------- //
const elements = {
  // Navigation
  navButtons: document.querySelectorAll('.nav-btn'),
  tabs: document.querySelectorAll('.tab-content'),
  
  // Header Stats
  statsTotalItems: document.getElementById('stats-total-items'),
  statsTotalCoins: document.getElementById('stats-total-coins'),

  // Groups and Students Tab
  groupSelect: document.getElementById('group-select'),
  studentSearch: document.getElementById('student-search'),
  searchClear: document.getElementById('search-clear'),
  studentsTableBody: document.getElementById('students-table-body'),
  studentsEmpty: document.getElementById('students-empty'),

  // Merch Catalog Tab
  btnAddMerch: document.getElementById('btn-add-merch'),
  merchCatalogGrid: document.getElementById('merch-catalog-grid'),

  // History Tab
  historySearch: document.getElementById('history-search'),
  historyTableBody: document.getElementById('history-table-body'),
  historyEmpty: document.getElementById('history-empty'),

  // Modal: Deduct
  deductModal: document.getElementById('deduct-modal'),
  deductModalClose: document.getElementById('deduct-modal-close'),
  btnDeductCancel: document.getElementById('btn-deduct-cancel'),
  btnDeductConfirm: document.getElementById('btn-deduct-confirm'),
  modalStudentAvatar: document.getElementById('modal-student-avatar'),
  modalStudentName: document.getElementById('modal-student-name'),
  modalStudentGroup: document.getElementById('modal-student-group'),
  modalStudentBalanceVal: document.getElementById('modal-student-balance-val'),
  modalTabMerch: document.getElementById('modal-tab-merch'),
  modalTabCustom: document.getElementById('modal-tab-custom'),
  modalFormMerchSection: document.getElementById('modal-form-merch-section'),
  modalFormCustomSection: document.getElementById('modal-form-custom-section'),
  modalMerchGrid: document.getElementById('modal-merch-grid'),
  qtyMinus: document.getElementById('qty-minus'),
  qtyPlus: document.getElementById('qty-plus'),
  qtyInput: document.getElementById('qty-input'),
  customAmount: document.getElementById('custom-amount'),
  customComment: document.getElementById('custom-comment'),
  modalSummarySection: document.getElementById('modal-summary-section'),
  summaryTotalCost: document.getElementById('summary-total-cost'),
  summaryRemainingBalance: document.getElementById('summary-remaining-balance'),
  modalErrorBox: document.getElementById('modal-error-box'),
  modalErrorMsg: document.getElementById('modal-error-msg'),

  // Modal: Merch Edit
  merchModal: document.getElementById('merch-modal'),
  merchModalTitle: document.getElementById('merch-modal-title'),
  merchModalClose: document.getElementById('merch-modal-close'),
  btnMerchCancel: document.getElementById('btn-merch-cancel'),
  btnMerchSave: document.getElementById('btn-merch-save'),
  merchForm: document.getElementById('merch-form'),
  merchEditId: document.getElementById('merch-edit-id'),
  merchName: document.getElementById('merch-name'),
  merchCost: document.getElementById('merch-cost'),
  merchDesc: document.getElementById('merch-desc'),
  merchIcon: document.getElementById('merch-icon'),

  // General Toast Container
  toastContainer: document.getElementById('toast-container')
};

// Current active context for deduction modal
let activeStudent = null;
let selectedMerchItem = null;
let currentDeductionMode = 'merch'; // merch | custom

// Initialize Application
function init() {
  setupNavigation();
  setupGroupsAndStudentsTab();
  setupMerchCatalogTab();
  setupHistoryTab();
  setupDeductionModal();
  setupMerchModal();
  updateHeaderStats();
}

// -------------------------------------------------------------------------- //
//  CORE SYSTEM: TABS & NOTIFICATIONS                                         //
// -------------------------------------------------------------------------- //
function setupNavigation() {
  elements.navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      
      // Update buttons
      elements.navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update tab panels
      elements.tabs.forEach(tab => {
        if (tab.id === targetTabId) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      // Refresh corresponding tab views
      if (targetTabId === 'tab-groups') {
        renderStudentsTable();
      } else if (targetTabId === 'tab-catalog') {
        renderMerchCatalog();
      } else if (targetTabId === 'tab-history') {
        renderHistoryTable();
      }
    });
  });
}

function showToast(title, message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'danger') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-body">
      <span class="toast-title">${title}</span>
      <span class="toast-message">${message}</span>
    </div>
  `;

  elements.toastContainer.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

function updateHeaderStats() {
  const completedTx = state.history.filter(tx => tx.status === 'completed');
  
  // Calculate total items issued
  const totalItems = completedTx.reduce((sum, tx) => sum + (tx.isCustom ? 1 : tx.qty), 0);
  elements.statsTotalItems.textContent = totalItems;

  // Calculate total coins spent
  const totalCoins = completedTx.reduce((sum, tx) => sum + tx.totalDeducted, 0);
  elements.statsTotalCoins.textContent = totalCoins.toLocaleString();
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// -------------------------------------------------------------------------- //
//  TAB 1: GROUPS & STUDENTS VIEW                                             //
// -------------------------------------------------------------------------- //
function setupGroupsAndStudentsTab() {
  // Populate group dropdown selector
  elements.groupSelect.innerHTML = state.groups.map(g => 
    `<option value="${g.id}">${g.name} (Преподаватель: ${g.teacher})</option>`
  ).join('');

  elements.groupSelect.addEventListener('change', () => {
    renderStudentsTable();
  });

  // Search input listeners
  elements.studentSearch.addEventListener('input', () => {
    if (elements.studentSearch.value.trim() !== '') {
      elements.searchClear.style.display = 'block';
    } else {
      elements.searchClear.style.display = 'none';
    }
    renderStudentsTable();
  });

  elements.searchClear.addEventListener('click', () => {
    elements.studentSearch.value = '';
    elements.searchClear.style.display = 'none';
    renderStudentsTable();
  });

  // Initial render
  renderStudentsTable();
}

function renderStudentsTable() {
  const selectedGroupId = elements.groupSelect.value;
  const searchQuery = elements.studentSearch.value.toLowerCase().trim();

  // Filter students based on selected group and search query
  const filteredStudents = state.students.filter(st => {
    const matchesGroup = st.groupId === selectedGroupId;
    const matchesSearch = st.name.toLowerCase().includes(searchQuery);
    return matchesGroup && matchesSearch;
  });

  // Sort students alphabetically
  filteredStudents.sort((a, b) => a.name.localeCompare(b.name));

  if (filteredStudents.length === 0) {
    elements.studentsTableBody.innerHTML = '';
    elements.studentsEmpty.classList.remove('hidden');
    return;
  }

  elements.studentsEmpty.classList.add('hidden');
  
  elements.studentsTableBody.innerHTML = filteredStudents.map(st => {
    const initials = getInitials(st.name);
    
    // Check if student has a deduction flag today
    let statusHTML = '<span class="status-badge none">—</span>';
    if (st.lastDeductedDate) {
      const timeStr = new Date(st.lastDeductedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      statusHTML = `<span class="status-badge issued" title="Списание в ${timeStr}">🎁 Получил сегодня</span>`;
    }

    return `
      <tr>
        <td>
          <div class="student-cell">
            <div class="student-avatar">${initials}</div>
            <div class="student-info-meta">
              <span class="student-name">${st.name}</span>
              <span class="student-group-name">Студент группы</span>
            </div>
          </div>
        </td>
        <td>
          <span class="coin-badge ${st.balance < 100 ? 'low-balance' : ''}">
            🪙 ${st.balance} CC
          </span>
        </td>
        <td>${statusHTML}</td>
        <td class="text-right">
          <button class="btn btn-primary btn-sm" onclick="openDeductModal('${st.id}')">
            Списать коины
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Expose open modal globally for click binding in dynamic table HTML
window.openDeductModal = function(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;

  activeStudent = student;
  selectedMerchItem = null;
  currentDeductionMode = 'merch';
  
  // Reset fields
  elements.qtyInput.value = 1;
  elements.qtyMinus.disabled = true;
  elements.customAmount.value = '';
  elements.customComment.value = '';
  
  // Set modal details
  elements.modalStudentAvatar.textContent = getInitials(student.name);
  elements.modalStudentName.textContent = student.name;
  
  const group = state.groups.find(g => g.id === student.groupId);
  elements.modalStudentGroup.textContent = `Группа: ${group ? group.name : 'Unknown'}`;
  elements.modalStudentBalanceVal.textContent = `${student.balance} CC`;

  // Toggle forms and tabs inside modal
  elements.modalTabMerch.classList.add('active');
  elements.modalTabCustom.classList.remove('active');
  elements.modalFormMerchSection.classList.add('active');
  elements.modalFormCustomSection.classList.remove('active');

  // Load select options
  renderModalMerchGrid();
  updateModalSummary();

  // Show modal
  elements.deductModal.classList.add('show');
};

// -------------------------------------------------------------------------- //
//  TAB 2: MERCH CATALOG SECTION                                              //
// -------------------------------------------------------------------------- //
function setupMerchCatalogTab() {
  elements.btnAddMerch.addEventListener('click', () => {
    openMerchModal(null);
  });
  renderMerchCatalog();
}

function renderMerchCatalog() {
  const grid = elements.merchCatalogGrid;
  
  if (state.merch.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🎁</div>
        <h3>Каталог пуст</h3>
        <p>Нажмите "Добавить товар", чтобы наполнить каталог наград</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.merch.map(item => `
    <div class="merch-card" data-id="${item.id}">
      <div class="merch-icon-wrapper">${item.icon || '🎁'}</div>
      <div class="merch-details">
        <span class="merch-title">${item.name}</span>
        <span class="merch-desc">${item.desc || 'Описание отсутствует'}</span>
      </div>
      <div class="merch-price">🪙 ${item.cost} CC</div>
      <div class="merch-actions">
        <button class="btn btn-secondary btn-sm" onclick="openMerchModal('${item.id}')">Изменить</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteMerch('${item.id}')">Удалить</button>
      </div>
    </div>
  `).join('');
}

window.openMerchModal = function(itemId) {
  elements.merchForm.reset();
  
  if (itemId) {
    // Edit Mode
    const item = state.merch.find(m => m.id === itemId);
    if (!item) return;
    
    elements.merchModalTitle.textContent = 'Изменить товар';
    elements.merchEditId.value = item.id;
    elements.merchName.value = item.name;
    elements.merchCost.value = item.cost;
    elements.merchDesc.value = item.desc || '';
    elements.merchIcon.value = item.icon || '🎁';
  } else {
    // Add Mode
    elements.merchModalTitle.textContent = 'Добавить товар';
    elements.merchEditId.value = '';
    elements.merchIcon.value = '🎁';
  }
  
  elements.merchModal.classList.add('show');
};

window.confirmDeleteMerch = function(itemId) {
  const item = state.merch.find(m => m.id === itemId);
  if (!item) return;

  if (confirm(`Вы уверены, что хотите удалить товар "${item.name}" из каталога?`)) {
    state.deleteMerchItem(itemId);
    renderMerchCatalog();
    showToast('Каталог наград обновлен', `Товар "${item.name}" успешно удален`, 'danger');
    updateHeaderStats();
  }
};

function setupMerchModal() {
  const close = () => elements.merchModal.classList.remove('show');
  
  elements.merchModalClose.addEventListener('click', close);
  elements.btnMerchCancel.addEventListener('click', close);
  
  elements.btnMerchSave.addEventListener('click', (e) => {
    e.preventDefault();
    
    const name = elements.merchName.value.trim();
    const cost = Number(elements.merchCost.value);
    const desc = elements.merchDesc.value.trim();
    const icon = elements.merchIcon.value.trim();
    const id = elements.merchEditId.value;

    if (!name || cost <= 0 || !icon) {
      showToast('Ошибка заполнения', 'Пожалуйста, заполните все обязательные поля корректно', 'warning');
      return;
    }

    state.saveMerchItem(id, name, cost, desc, icon);
    renderMerchCatalog();
    close();
    
    showToast(
      id ? 'Товар изменен' : 'Товар добавлен',
      `Товар "${name}" успешно сохранен в каталоге`,
      'success'
    );
    updateHeaderStats();
  });
}

// -------------------------------------------------------------------------- //
//  TAB 3: TRANSACTION AUDIT HISTORY                                          //
// -------------------------------------------------------------------------- //
function setupHistoryTab() {
  elements.historySearch.addEventListener('input', () => {
    renderHistoryTable();
  });
}

function renderHistoryTable() {
  const query = elements.historySearch.value.toLowerCase().trim();
  
  const filtered = state.history.filter(tx => 
    tx.studentName.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    elements.historyTableBody.innerHTML = '';
    elements.historyEmpty.classList.remove('hidden');
    return;
  }

  elements.historyEmpty.classList.add('hidden');

  elements.historyTableBody.innerHTML = filtered.map(tx => {
    const txDate = new Date(tx.date);
    const dateStr = txDate.toLocaleDateString('ru-RU');
    const timeStr = txDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    // Status text
    let statusBadge = '';
    let actionBtn = '';
    
    if (tx.status === 'completed') {
      statusBadge = `<span class="status-badge issued">🪙 Проведено</span>`;
      actionBtn = `
        <button class="btn btn-danger btn-sm" onclick="revertTx('${tx.id}')">
          Отменить списание
        </button>
      `;
    } else {
      statusBadge = `<span class="status-badge reverted">❌ Отменено</span>`;
      actionBtn = `<span class="text-muted" style="font-size: 0.8rem;">Списание отменено</span>`;
    }

    return `
      <tr>
        <td>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 500;">${dateStr}</span>
            <span class="text-muted" style="font-size: 0.75rem;">${timeStr}</span>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 600;">${tx.studentName}</span>
            <span class="text-muted" style="font-size: 0.75rem;">${tx.groupName}</span>
          </div>
        </td>
        <td>
          <span style="font-weight: 500;">${tx.itemName}</span>
          ${tx.qty > 1 && !tx.isCustom ? `<span class="text-muted"> (x${tx.qty})</span>` : ''}
        </td>
        <td>
          <strong style="color: ${tx.status === 'completed' ? '#c084fc' : 'var(--color-text-muted)'}; text-decoration: ${tx.status === 'reverted' ? 'line-through' : 'none'}">
            -${tx.totalDeducted} CC
          </strong>
        </td>
        <td>${tx.operator}</td>
        <td>${statusBadge}</td>
        <td class="text-right">${actionBtn}</td>
      </tr>
    `;
  }).join('');
}

window.revertTx = function(txId) {
  const tx = state.history.find(t => t.id === txId);
  if (!tx) return;

  if (confirm(`Вы действительно хотите отменить списание "${tx.itemName}" на сумму ${tx.totalDeducted} CC для студента ${tx.studentName}? Коины будут возвращены на баланс.`)) {
    const res = state.revertTransaction(txId);
    
    if (res.success) {
      renderHistoryTable();
      updateHeaderStats();
      showToast(
        'Операция отменена',
        `Студенту ${res.student.name} возвращено ${tx.totalDeducted} CodeCoin. Баланс: ${res.student.balance} CC.`,
        'warning'
      );
    } else {
      showToast('Ошибка отмены', res.msg, 'danger');
    }
  }
};

// -------------------------------------------------------------------------- //
//  MODAL: DEDUCT COIN DIALOGUE & FORM VALIDATIONS                             //
// -------------------------------------------------------------------------- //
function setupDeductionModal() {
  const close = () => {
    elements.deductModal.classList.remove('show');
    activeStudent = null;
    selectedMerchItem = null;
  };
  
  elements.deductModalClose.addEventListener('click', close);
  elements.btnDeductCancel.addEventListener('click', close);

  // Tab selections
  elements.modalTabMerch.addEventListener('click', () => {
    currentDeductionMode = 'merch';
    elements.modalTabMerch.classList.add('active');
    elements.modalTabCustom.classList.remove('active');
    elements.modalFormMerchSection.classList.add('active');
    elements.modalFormCustomSection.classList.remove('active');
    updateModalSummary();
  });

  elements.modalTabCustom.addEventListener('click', () => {
    currentDeductionMode = 'custom';
    elements.modalTabMerch.classList.remove('active');
    elements.modalTabCustom.classList.add('active');
    elements.modalFormMerchSection.classList.remove('active');
    elements.modalFormCustomSection.classList.add('active');
    updateModalSummary();
  });

  // Quantity controllers
  elements.qtyMinus.addEventListener('click', () => {
    let val = Number(elements.qtyInput.value);
    if (val > 1) {
      val--;
      elements.qtyInput.value = val;
      if (val === 1) elements.qtyMinus.disabled = true;
      updateModalSummary();
    }
  });

  elements.qtyPlus.addEventListener('click', () => {
    let val = Number(elements.qtyInput.value);
    val++;
    elements.qtyInput.value = val;
    elements.qtyMinus.disabled = false;
    updateModalSummary();
  });

  // Custom form input keyups
  elements.customAmount.addEventListener('input', updateModalSummary);
  elements.customComment.addEventListener('input', updateModalSummary);

  // Confirm Button Action
  elements.btnDeductConfirm.addEventListener('click', () => {
    if (!activeStudent) return;
    
    let res = null;

    if (currentDeductionMode === 'merch') {
      if (!selectedMerchItem) {
        showToast('Товар не выбран', 'Пожалуйста, выберите товар из списка наград', 'warning');
        return;
      }
      
      const qty = Number(elements.qtyInput.value);
      res = state.deductCoins(activeStudent.id, selectedMerchItem, qty, false);
      
    } else {
      const amount = Number(elements.customAmount.value);
      const comment = elements.customComment.value.trim();
      
      if (amount <= 0 || !comment) {
        showToast('Неполные данные', 'Задайте причину списания и количество коинов', 'warning');
        return;
      }
      
      res = state.deductCoins(activeStudent.id, null, 1, true, amount, comment);
    }

    if (res && res.success) {
      close();
      renderStudentsTable();
      updateHeaderStats();
      
      const textDetail = currentDeductionMode === 'merch' 
        ? `Выдано: "${res.tx.itemName}" (${res.tx.totalDeducted} CC)` 
        : `Произвольное списание: ${res.tx.totalDeducted} CC`;
        
      showToast(
        'Списание проведено успешно!',
        `${res.student.name}. Осталось коинов: ${res.student.balance} CC. ${textDetail}`,
        'success'
      );
    } else {
      showToast('Ошибка списания', res ? res.msg : 'Непредвиденная ошибка', 'danger');
    }
  });
}

function renderModalMerchGrid() {
  const grid = elements.modalMerchGrid;
  
  if (state.merch.length === 0) {
    grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 1rem 0;">Каталог мерча пуст.</p>';
    return;
  }

  grid.innerHTML = state.merch.map(item => {
    const isInsufficient = activeStudent ? (activeStudent.balance < item.cost) : false;
    const extraClass = isInsufficient ? 'insufficient-funds' : '';
    const tooltip = isInsufficient ? 'Недостаточно коинов на балансе' : '';

    return `
      <div class="merch-select-item ${extraClass}" 
           data-id="${item.id}" 
           title="${tooltip}"
           onclick="selectModalMerch(this, '${item.id}', ${isInsufficient})">
        <span class="select-item-icon">${item.icon || '🎁'}</span>
        <span class="select-item-name">${item.name}</span>
        <span class="select-item-cost">${item.cost} CC</span>
      </div>
    `;
  }).join('');
}

window.selectModalMerch = function(element, itemId, isInsufficient) {
  if (isInsufficient) {
    showToast('Баланс недостаточен', 'Этот товар стоит больше, чем доступно коинов у студента', 'warning');
    return;
  }

  // De-select all items
  const items = elements.modalMerchGrid.querySelectorAll('.merch-select-item');
  items.forEach(el => el.classList.remove('selected'));

  // Select current
  element.classList.add('selected');
  selectedMerchItem = state.merch.find(m => m.id === itemId);
  
  // Reset quantity to 1 when selecting a new item
  elements.qtyInput.value = 1;
  elements.qtyMinus.disabled = true;

  updateModalSummary();
};

function updateModalSummary() {
  if (!activeStudent) return;
  
  let totalCost = 0;
  let hasError = false;
  let errorMsg = '';
  let canConfirm = false;

  if (currentDeductionMode === 'merch') {
    elements.modalSummarySection.classList.remove('hidden');
    
    if (selectedMerchItem) {
      const qty = Number(elements.qtyInput.value);
      totalCost = selectedMerchItem.cost * qty;
      
      if (activeStudent.balance < totalCost) {
        hasError = true;
        errorMsg = `Баланса студента недостаточно для покупки ${qty} шт. мерча! (Требуется: ${totalCost} CC)`;
      } else {
        canConfirm = true;
      }
    } else {
      totalCost = 0;
    }
  } else {
    // Custom deduction mode
    const customAmt = Number(elements.customAmount.value);
    const comment = elements.customComment.value.trim();
    
    if (customAmt > 0 && comment !== '') {
      totalCost = customAmt;
      
      if (activeStudent.balance < totalCost) {
        hasError = true;
        errorMsg = `Сумма списания (${totalCost} CC) превышает текущий баланс студента (${activeStudent.balance} CC)!`;
      } else {
        canConfirm = true;
      }
    } else {
      totalCost = 0;
      elements.modalSummarySection.classList.add('hidden');
    }
  }

  // Render values
  elements.summaryTotalCost.textContent = `${totalCost} CC`;
  elements.summaryRemainingBalance.textContent = `${activeStudent.balance - totalCost} CC`;

  // Render error box
  if (hasError) {
    elements.modalErrorMsg.textContent = errorMsg;
    elements.modalErrorBox.classList.remove('hidden');
    elements.btnDeductConfirm.disabled = true;
  } else {
    elements.modalErrorBox.classList.add('hidden');
    elements.btnDeductConfirm.disabled = !canConfirm;
  }
}

// -------------------------------------------------------------------------- //
//  ENTRY POINT LAUNCH                                                        //
// -------------------------------------------------------------------------- //
document.addEventListener('DOMContentLoaded', init);
