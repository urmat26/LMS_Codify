// -------------------------------------------------------------------------- //
//  INITIAL MOCK DATA (Fallback if localStorage is empty)                      //
// -------------------------------------------------------------------------- //
const DEFAULT_GROUPS = [
  { id: 'fe-302', name: 'Frontend-302', teacher: 'Алексей', branch: '7mkr', course: 'html-css' },
  { id: 'py-105', name: 'Python-105', teacher: 'Мария', branch: 'ibraimova', course: 'python' },
  { id: 'ui-401', name: 'UX/UI-401', teacher: 'Диана', branch: 'djal', course: 'startup' },
  { id: 'sc-101', name: 'Scratch-101', teacher: 'Иван', branch: '7mkr', course: 'scratch' },
  { id: 'rb-201', name: 'Roblox-201', teacher: 'Олег', branch: 'ibraimova', course: 'roblox' },
  { id: 'js-501', name: 'JavaScript-501', teacher: 'Самат', branch: 'djal', course: 'javascript' },
  { id: 'rb-301', name: 'Roblox Pro-301', teacher: 'Денис', branch: '7mkr', course: 'roblox-pro' }
];

const DEFAULT_STUDENTS = [
  { id: 'st-1', name: 'Аскар Аскаров', groupId: 'fe-302', balance: 1200, lastDeductedDate: null },
  { id: 'st-2', name: 'Бегаим Бакирова', groupId: 'fe-302', balance: 850, lastDeductedDate: null },
  { id: 'st-3', name: 'Иван Иванов', groupId: 'sc-101', balance: 50, lastDeductedDate: null },
  { id: 'st-4', name: 'Анна Смирнова', groupId: 'rb-201', balance: 300, lastDeductedDate: null },
  { id: 'st-5', name: 'Максим Макаров', groupId: 'py-105', balance: 2100, lastDeductedDate: null },
  { id: 'st-6', name: 'Жазгуль Жапарова', groupId: 'py-105', balance: 150, lastDeductedDate: null },
  { id: 'st-7', name: 'Дастан Джумабеков', groupId: 'ui-401', balance: 950, lastDeductedDate: null },
  { id: 'st-8', name: 'Султан Сулейманов', groupId: 'js-501', balance: 400, lastDeductedDate: null },
  { id: 'st-9', name: 'Камила Каримова', groupId: 'rb-301', balance: 1600, lastDeductedDate: null },
  { id: 'st-10', name: 'Эрлан Эсенов', groupId: 'sc-101', balance: 250, lastDeductedDate: null },
  { id: 'st-11', name: 'Алия Алиева', groupId: 'rb-201', balance: 750, lastDeductedDate: null },
  { id: 'st-12', name: 'Нурбек Нурланов', groupId: 'js-501', balance: 0, lastDeductedDate: null }
];

const DEFAULT_MERCH = [
  { id: 'm-1', name: 'Худи', cost: 1000, desc: 'Теплый брендированный оверсайз худи', icon: '🧥' },
  { id: 'm-2', name: 'Бомбер', cost: 1500, desc: 'Стильный осенний бомбер LMS Codify', icon: '🧥' },
  { id: 'm-3', name: 'Кружка', cost: 300, desc: 'Керамическая кружка с принтом для кофе', icon: '🥤' },
  { id: 'm-4', name: 'Носки', cost: 200, desc: 'Фирменные носки «Код живи, век учись»', icon: '🧦' },
  { id: 'm-5', name: 'Стикеры', cost: 50, desc: 'Набор IT-стикеров для ноутбука', icon: '🎨' }
];

const DEFAULT_HISTORY = [];

// -------------------------------------------------------------------------- //
//  STATE MANAGEMENT                                                          //
// -------------------------------------------------------------------------- //
class AppState {
  constructor() {
    this.groups = this.load('codecoin_groups_v3', DEFAULT_GROUPS);
    this.students = this.load('codecoin_students_v3', DEFAULT_STUDENTS);
    this.merch = this.load('codecoin_merch_v3', DEFAULT_MERCH);
    this.history = this.load('codecoin_history_v3', DEFAULT_HISTORY);
    
    // Auth state
    this.currentUser = this.load('codecoin_user_v3', null);
    
    // User mock balance
    this.userBalance = this.load('codecoin_user_balance_v3', 1000);

    // User cart
    this.cart = [];

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
    this.students.forEach(st => st.lastDeductedDate = null);
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
    this.save('codecoin_groups_v3', this.groups);
    this.save('codecoin_students_v3', this.students);
    this.save('codecoin_merch_v3', this.merch);
    this.save('codecoin_history_v3', this.history);
    this.save('codecoin_user_v3', this.currentUser);
    this.save('codecoin_user_balance_v3', this.userBalance);
    this.updateStudentDeductionFlags();
  }

  login(username, password) {
    if (username === 'admin' && password === 'admin') {
      this.currentUser = { username: 'admin', role: 'admin', name: 'Отдел Заботы' };
      this.persistAll();
      return true;
    }
    if (username === 'user' && password === 'user') {
      this.currentUser = { username: 'user', role: 'user', name: 'Студент' };
      this.persistAll();
      return true;
    }
    return false;
  }

  logout() {
    this.currentUser = null;
    this.persistAll();
  }

  // Admin Deduct Coins
  deductCoins(studentId, itemObj, qty, isCustom = false, customAmount = 0, comment = '') {
    const student = this.students.find(s => s.id === studentId);
    if (!student) return { success: false, msg: 'Студент не найден' };

    let itemName = isCustom ? `Списание: ${comment}` : itemObj.name;
    let itemCost = isCustom ? customAmount : itemObj.cost;
    let totalCost = isCustom ? customAmount : itemCost * qty;

    if (student.balance < totalCost) return { success: false, msg: 'Недостаточно коинов на балансе' };

    student.balance -= totalCost;
    
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
    if (!tx || tx.status === 'reverted') return { success: false, msg: 'Транзакция недоступна' };

    if (tx.studentId === 'user-self') {
       this.userBalance += tx.totalDeducted;
    } else {
       const student = this.students.find(s => s.id === tx.studentId);
       if (student) student.balance += tx.totalDeducted;
    }
    
    tx.status = 'reverted';
    this.persistAll();
    return { success: true };
  }

  saveMerchItem(id, name, cost, desc, icon) {
    if (id) {
      const item = this.merch.find(m => m.id === id);
      if (item) {
        item.name = name; item.cost = Number(cost); item.desc = desc; item.icon = icon;
      }
    } else {
      this.merch.push({ id: 'm-' + Date.now(), name, cost: Number(cost), desc, icon });
    }
    this.persistAll();
  }

  deleteMerchItem(id) {
    this.merch = this.merch.filter(m => m.id !== id);
    this.persistAll();
  }
}

const state = new AppState();

// -------------------------------------------------------------------------- //
//  DOM ELEMENTS                                                              //
// -------------------------------------------------------------------------- //
const elements = {
  loginScreen: document.getElementById('login-screen'),
  loginForm: document.getElementById('login-form'),
  loginError: document.getElementById('login-error'),
  appContainer: document.getElementById('app-container'),
  btnLogout: document.getElementById('btn-logout'),
  currentUserAvatar: document.getElementById('current-user-avatar'),
  currentUserName: document.getElementById('current-user-name'),
  currentUserRole: document.getElementById('current-user-role'),
  adminStats: document.getElementById('admin-stats'),
  userStats: document.getElementById('user-stats'),
  userBalanceDisplay: document.getElementById('user-balance-display'),
  statsTotalItems: document.getElementById('stats-total-items'),
  statsTotalCoins: document.getElementById('stats-total-coins'),
  adminNav: document.getElementById('admin-nav'),
  userNav: document.getElementById('user-nav'),
  tabs: document.querySelectorAll('.tab-content'),
  navButtons: document.querySelectorAll('.nav-btn'),
  
  // Admin Groups & Students
  branchSelect: document.getElementById('branch-select'),
  courseSelect: document.getElementById('course-select'),
  groupSelect: document.getElementById('group-select'),
  studentSearch: document.getElementById('student-search'),
  searchClear: document.getElementById('search-clear'),
  studentsTableBody: document.getElementById('students-table-body'),
  studentsEmpty: document.getElementById('students-empty'),

  // Admin Merch
  btnAddMerch: document.getElementById('btn-add-merch'),
  merchCatalogGrid: document.getElementById('merch-catalog-grid'),
  
  // Admin History
  historySearch: document.getElementById('history-search'),
  historyTableBody: document.getElementById('history-table-body'),

  // User Shop
  userShopGrid: document.getElementById('user-shop-grid'),
  btnViewCart: document.getElementById('btn-view-cart'),
  cartBadge: document.getElementById('cart-badge'),
  userHistoryTableBody: document.getElementById('user-history-table-body'),
  userHistoryEmpty: document.getElementById('user-history-empty'),

  // Modals
  deductModal: document.getElementById('deduct-modal'),
  merchModal: document.getElementById('merch-modal'),
  cartModal: document.getElementById('cart-modal'),
  toastContainer: document.getElementById('toast-container')
};

// -------------------------------------------------------------------------- //
//  INITIALIZATION & ROUTING                                                  //
// -------------------------------------------------------------------------- //
document.addEventListener('DOMContentLoaded', () => {
  setupAuth();
  setupNavigation();
  setupAdminTabs();
  setupUserTabs();
  setupCartModal();
  checkAuthState();
});

function setupAuth() {
  elements.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    if (state.login(user, pass)) {
      elements.loginError.classList.add('hidden');
      checkAuthState();
    } else {
      elements.loginError.classList.remove('hidden');
    }
  });

  elements.btnLogout.addEventListener('click', () => {
    state.logout();
    checkAuthState();
  });
}

function checkAuthState() {
  if (state.currentUser) {
    elements.loginScreen.classList.add('hidden');
    elements.appContainer.classList.remove('hidden');
    
    elements.currentUserName.textContent = state.currentUser.name;
    elements.currentUserRole.textContent = state.currentUser.role === 'admin' ? 'Администратор' : 'Студент';
    elements.currentUserAvatar.textContent = state.currentUser.name[0].toUpperCase();

    if (state.currentUser.role === 'admin') {
      elements.adminNav.style.display = 'flex';
      elements.userNav.style.display = 'none';
      elements.adminStats.style.display = 'flex';
      elements.userStats.style.display = 'none';
      switchTab('tab-groups');
      renderAdminData();
    } else {
      elements.adminNav.style.display = 'none';
      elements.userNav.style.display = 'flex';
      elements.adminStats.style.display = 'none';
      elements.userStats.style.display = 'flex';
      switchTab('tab-shop');
      renderUserData();
    }
  } else {
    elements.loginScreen.classList.remove('hidden');
    elements.appContainer.classList.add('hidden');
  }
}

function switchTab(tabId) {
  elements.navButtons.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  elements.tabs.forEach(tab => {
    if (tab.id === tabId) tab.classList.add('active');
    else tab.classList.remove('active');
  });
}

function setupNavigation() {
  elements.navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      switchTab(targetTabId);
      if (state.currentUser.role === 'admin') renderAdminData();
      else renderUserData();
    });
  });
}

function showToast(title, message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : '⚠️'}</span>
    <div class="toast-body"><span class="toast-title" style="display:block;font-weight:bold">${title}</span><span class="toast-message">${message}</span></div>`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// -------------------------------------------------------------------------- //
//  ADMIN LOGIC                                                               //
// -------------------------------------------------------------------------- //
function renderAdminData() {
  updateAdminStats();
  renderStudentsTable();
  renderAdminMerchCatalog();
  renderHistoryTable();
}

function updateAdminStats() {
  const completedTx = state.history.filter(tx => tx.status === 'completed');
  elements.statsTotalItems.textContent = completedTx.reduce((sum, tx) => sum + (tx.isCustom ? 1 : tx.qty), 0);
  elements.statsTotalCoins.textContent = completedTx.reduce((sum, tx) => sum + tx.totalDeducted, 0);
}

function setupAdminTabs() {
  populateGroupsDropdown();
  elements.branchSelect.addEventListener('change', () => {
    populateGroupsDropdown();
    renderStudentsTable();
  });
  elements.courseSelect.addEventListener('change', () => {
    populateGroupsDropdown();
    renderStudentsTable();
  });
  elements.groupSelect.addEventListener('change', renderStudentsTable);
  elements.studentSearch.addEventListener('input', renderStudentsTable);
  elements.btnAddMerch.addEventListener('click', () => openMerchModal(null));
  elements.historySearch.addEventListener('input', renderHistoryTable);

  document.getElementById('deduct-modal-close').addEventListener('click', () => elements.deductModal.classList.remove('show'));
  document.getElementById('btn-deduct-cancel').addEventListener('click', () => elements.deductModal.classList.remove('show'));
  
  document.getElementById('merch-modal-close').addEventListener('click', () => elements.merchModal.classList.remove('show'));
  document.getElementById('btn-merch-cancel').addEventListener('click', () => elements.merchModal.classList.remove('show'));
  document.getElementById('btn-merch-save').addEventListener('click', saveMerchModal);
  
  setupDeductModalEvents();
}

function populateGroupsDropdown() {
  const branch = elements.branchSelect.value;
  const course = elements.courseSelect.value;
  
  const filteredGroups = state.groups.filter(g => {
    const matchBranch = branch === 'all' || g.branch === branch;
    const matchCourse = course === 'all' || g.course === course;
    return matchBranch && matchCourse;
  });

  elements.groupSelect.innerHTML = '<option value="all">Все группы</option>' + 
    filteredGroups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
}

function renderStudentsTable() {
  const branch = elements.branchSelect.value;
  const course = elements.courseSelect.value;
  const selectedGroup = elements.groupSelect.value;
  const search = elements.studentSearch.value.toLowerCase().trim();
  
  const filtered = state.students.filter(st => {
    const group = state.groups.find(g => g.id === st.groupId);
    if (!group) return false;
    
    const matchBranch = branch === 'all' || group.branch === branch;
    const matchCourse = course === 'all' || group.course === course;
    const matchGroup = selectedGroup === 'all' || st.groupId === selectedGroup;
    const matchSearch = st.name.toLowerCase().includes(search);
    
    if (search !== '') {
      return matchSearch;
    }
    
    return matchBranch && matchCourse && matchGroup && matchSearch;
  });
  
  if (filtered.length === 0) {
    elements.studentsTableBody.innerHTML = '';
    elements.studentsEmpty.classList.remove('hidden');
    return;
  }
  elements.studentsEmpty.classList.add('hidden');
  elements.studentsTableBody.innerHTML = filtered.map(st => `
    <tr>
      <td><b>${st.name}</b></td>
      <td>🪙 ${st.balance} CC</td>
      <td>${st.lastDeductedDate ? '🎁 Выдано сегодня' : '—'}</td>
      <td class="text-right">
        <button class="btn btn-primary btn-sm" onclick="openDeductModal('${st.id}')">Списать</button>
      </td>
    </tr>
  `).join('');
}

let currentDeductStudentId = null;
let deductMode = 'merch';
let selectedMerchId = null;
let currentDeductQty = 1;

window.openDeductModal = function(studentId) {
  const student = state.students.find(s => s.id === studentId);
  if (!student) return;
  
  const group = state.groups.find(g => g.id === student.groupId);
  currentDeductStudentId = studentId;
  deductMode = 'merch';
  selectedMerchId = null;
  currentDeductQty = 1;

  document.getElementById('modal-student-name').textContent = student.name;
  document.getElementById('modal-student-group').textContent = group ? `Группа: ${group.name}` : '';
  document.getElementById('modal-student-avatar').textContent = student.name[0].toUpperCase();
  document.getElementById('modal-student-balance-val').textContent = `${student.balance} CC`;

  document.getElementById('modal-tab-merch').classList.add('active');
  document.getElementById('modal-tab-custom').classList.remove('active');
  document.getElementById('modal-form-merch-section').classList.add('active');
  document.getElementById('modal-form-custom-section').classList.remove('active');

  document.getElementById('modal-merch-grid').innerHTML = state.merch.map(m => `
    <div class="merch-select-item" onclick="selectDeductMerch('${m.id}')" id="deduct-merch-${m.id}" style="padding:10px; border:1px solid #ddd; border-radius:8px; cursor:pointer; margin-bottom:10px;">
      <div>${m.icon} <b>${m.name}</b></div>
      <div class="text-blue">${m.cost} CC</div>
    </div>
  `).join('');

  document.getElementById('custom-amount').value = '';
  document.getElementById('custom-comment').value = '';
  updateDeductSummary();
  
  elements.deductModal.classList.add('show');
}

window.selectDeductMerch = function(id) {
  selectedMerchId = id;
  document.querySelectorAll('.merch-select-item').forEach(el => {
    el.style.borderColor = '#ddd';
    el.style.backgroundColor = 'transparent';
  });
  const selectedEl = document.getElementById(`deduct-merch-${id}`);
  selectedEl.style.borderColor = '#007AFF';
  selectedEl.style.backgroundColor = 'rgba(0, 122, 255, 0.05)';
  updateDeductSummary();
}

function updateDeductSummary() {
  let totalCost = 0;
  if (deductMode === 'merch' && selectedMerchId) {
    const item = state.merch.find(m => m.id === selectedMerchId);
    if (item) totalCost = item.cost * currentDeductQty;
  } else if (deductMode === 'custom') {
    totalCost = Number(document.getElementById('custom-amount').value) || 0;
  }

  const student = state.students.find(s => s.id === currentDeductStudentId);
  const remaining = student ? student.balance - totalCost : 0;

  document.getElementById('summary-total-cost').textContent = `${totalCost} CC`;
  document.getElementById('summary-remaining-balance').textContent = `${remaining} CC`;

  const confirmBtn = document.getElementById('btn-deduct-confirm');
  const errorBox = document.getElementById('modal-error-box');

  if (totalCost > 0 && student && student.balance >= totalCost) {
    confirmBtn.disabled = false;
    errorBox.classList.add('hidden');
  } else {
    confirmBtn.disabled = true;
    if (student && student.balance < totalCost) {
      errorBox.classList.remove('hidden');
    } else {
      errorBox.classList.add('hidden');
    }
  }

  document.getElementById('qty-input').value = currentDeductQty;
  document.getElementById('qty-minus').disabled = currentDeductQty <= 1;
}

function setupDeductModalEvents() {
  document.getElementById('modal-tab-merch').addEventListener('click', (e) => {
    deductMode = 'merch';
    e.target.classList.add('active');
    document.getElementById('modal-tab-custom').classList.remove('active');
    document.getElementById('modal-form-merch-section').classList.add('active');
    document.getElementById('modal-form-custom-section').classList.remove('active');
    updateDeductSummary();
  });

  document.getElementById('modal-tab-custom').addEventListener('click', (e) => {
    deductMode = 'custom';
    e.target.classList.add('active');
    document.getElementById('modal-tab-merch').classList.remove('active');
    document.getElementById('modal-form-custom-section').classList.add('active');
    document.getElementById('modal-form-merch-section').classList.remove('active');
    updateDeductSummary();
  });

  document.getElementById('qty-minus').addEventListener('click', () => {
    if (currentDeductQty > 1) {
      currentDeductQty--;
      updateDeductSummary();
    }
  });

  document.getElementById('qty-plus').addEventListener('click', () => {
    currentDeductQty++;
    updateDeductSummary();
  });

  document.getElementById('custom-amount').addEventListener('input', updateDeductSummary);

  document.getElementById('btn-deduct-confirm').addEventListener('click', () => {
    if (deductMode === 'merch') {
      const item = state.merch.find(m => m.id === selectedMerchId);
      if (item) {
        state.deductCoins(currentDeductStudentId, item, currentDeductQty);
      }
    } else {
      const amount = Number(document.getElementById('custom-amount').value);
      const comment = document.getElementById('custom-comment').value;
      if (amount > 0 && comment) {
        state.deductCoins(currentDeductStudentId, null, 1, true, amount, comment);
      }
    }
    elements.deductModal.classList.remove('show');
    renderAdminData();
    showToast('Успех', 'Списание прошло успешно');
  });
}

function renderAdminMerchCatalog() {
  elements.merchCatalogGrid.innerHTML = state.merch.map(item => `
    <div class="merch-card">
      <div class="merch-icon">${item.icon}</div>
      <div class="merch-name">${item.name}</div>
      <div class="merch-desc">${item.desc}</div>
      <div class="merch-price">🪙 ${item.cost} CC</div>
      <div class="merch-card-actions">
        <button class="btn btn-secondary btn-sm" onclick="openMerchModal('${item.id}')">Изменить</button>
        <button class="btn btn-secondary btn-sm" onclick="deleteMerch('${item.id}')">Удалить</button>
      </div>
    </div>
  `).join('');
}

window.openMerchModal = function(id) {
  document.getElementById('merch-form').reset();
  if (id) {
    const item = state.merch.find(m => m.id === id);
    document.getElementById('merch-edit-id').value = item.id;
    document.getElementById('merch-name').value = item.name;
    document.getElementById('merch-cost').value = item.cost;
    document.getElementById('merch-desc').value = item.desc;
    document.getElementById('merch-icon').value = item.icon;
  } else {
    document.getElementById('merch-edit-id').value = '';
    document.getElementById('merch-icon').value = '🎁';
  }
  elements.merchModal.classList.add('show');
}

function saveMerchModal(e) {
  e.preventDefault();
  const id = document.getElementById('merch-edit-id').value;
  const name = document.getElementById('merch-name').value;
  const cost = document.getElementById('merch-cost').value;
  const desc = document.getElementById('merch-desc').value;
  const icon = document.getElementById('merch-icon').value;
  if(name && cost) {
    state.saveMerchItem(id, name, cost, desc, icon);
    elements.merchModal.classList.remove('show');
    renderAdminMerchCatalog();
    showToast('Успех', 'Мерч сохранен');
  }
}

window.deleteMerch = function(id) {
  if (confirm('Удалить товар?')) {
    state.deleteMerchItem(id);
    renderAdminMerchCatalog();
  }
}

function renderHistoryTable() {
  const search = elements.historySearch.value.toLowerCase().trim();
  const filtered = state.history.filter(tx => tx.studentName.toLowerCase().includes(search));
  elements.historyTableBody.innerHTML = filtered.map(tx => `
    <tr>
      <td>${new Date(tx.date).toLocaleString('ru-RU')}</td>
      <td>${tx.studentName}<br><small>${tx.groupName}</small></td>
      <td>${tx.itemName} (x${tx.qty})</td>
      <td>-${tx.totalDeducted} CC</td>
      <td>${tx.operator}</td>
      <td>${tx.status === 'completed' ? '✅ Проведено' : '❌ Отменено'}</td>
      <td class="text-right">
        ${tx.status === 'completed' ? `<button class="btn btn-secondary btn-sm" onclick="revertAdminTx('${tx.id}')">Отменить</button>` : ''}
      </td>
    </tr>
  `).join('');
}

window.revertAdminTx = function(id) {
  if(confirm('Отменить транзакцию?')) {
    state.revertTransaction(id);
    renderHistoryTable();
    updateAdminStats();
    showToast('Успех', 'Транзакция отменена', 'warning');
  }
}

// -------------------------------------------------------------------------- //
//  USER LOGIC (SHOP & CART)                                                  //
// -------------------------------------------------------------------------- //
function setupUserTabs() {
  elements.btnViewCart.addEventListener('click', openCartModal);
  document.getElementById('cart-modal-close').addEventListener('click', () => elements.cartModal.classList.remove('show'));
  document.getElementById('btn-cart-cancel').addEventListener('click', () => elements.cartModal.classList.remove('show'));
  document.getElementById('btn-cart-confirm').addEventListener('click', confirmPurchase);
}

function renderUserData() {
  elements.userBalanceDisplay.textContent = `${state.userBalance} CC`;
  renderUserShop();
  renderUserHistory();
  updateCartBadge();
}

function renderUserShop() {
  elements.userShopGrid.innerHTML = state.merch.map(item => `
    <div class="merch-card">
      <div class="merch-icon">${item.icon}</div>
      <div class="merch-name">${item.name}</div>
      <div class="merch-desc">${item.desc}</div>
      <div class="merch-price">🪙 ${item.cost} CC</div>
      <button class="btn btn-primary" onclick="addToCart('${item.id}')">В корзину</button>
    </div>
  `).join('');
}

window.addToCart = function(itemId) {
  const item = state.merch.find(m => m.id === itemId);
  if (!item) return;
  const existing = state.cart.find(c => c.item.id === itemId);
  if (existing) {
    existing.qty++;
  } else {
    state.cart.push({ item, qty: 1 });
  }
  showToast('Добавлено', `${item.name} добавлен в корзину`);
  updateCartBadge();
}

function updateCartBadge() {
  const totalItems = state.cart.reduce((sum, c) => sum + c.qty, 0);
  elements.cartBadge.textContent = totalItems;
}

function openCartModal() {
  const container = document.getElementById('cart-items-container');
  const costDisplay = document.getElementById('cart-total-cost');
  const btnConfirm = document.getElementById('btn-cart-confirm');
  const errorBox = document.getElementById('cart-error-box');

  document.getElementById('cart-user-balance').textContent = `${state.userBalance} CC`;
  errorBox.classList.add('hidden');

  if (state.cart.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding: 20px;">Ваша корзина пуста</p>';
    costDisplay.textContent = '0 CC';
    btnConfirm.disabled = true;
  } else {
    container.innerHTML = state.cart.map(c => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-icon">${c.item.icon}</div>
          <div>
            <div class="cart-item-name">${c.item.name}</div>
            <div class="cart-item-price">${c.item.cost} CC x ${c.qty}</div>
          </div>
        </div>
        <button class="btn-remove-item" onclick="removeFromCart('${c.item.id}')">❌</button>
      </div>
    `).join('');
    
    const totalCost = state.cart.reduce((sum, c) => sum + (c.item.cost * c.qty), 0);
    costDisplay.textContent = `${totalCost} CC`;
    
    if (totalCost > state.userBalance) {
      errorBox.classList.remove('hidden');
      btnConfirm.disabled = true;
    } else {
      btnConfirm.disabled = false;
    }
  }
  
  elements.cartModal.classList.add('show');
}

window.removeFromCart = function(itemId) {
  state.cart = state.cart.filter(c => c.item.id !== itemId);
  updateCartBadge();
  openCartModal(); // Refresh modal
}

function confirmPurchase() {
  const totalCost = state.cart.reduce((sum, c) => sum + (c.item.cost * c.qty), 0);
  
  // ALert for confirmation
  if (!confirm(`Подтвердите транзакцию на сумму ${totalCost} CC`)) {
    return;
  }

  if (totalCost > state.userBalance) return;

  state.userBalance -= totalCost;
  
  // Add to history
  state.cart.forEach(c => {
    state.history.unshift({
      id: 'tx-' + Date.now() + Math.random(),
      date: new Date().toISOString(),
      studentId: 'user-self',
      studentName: 'Студент (Вы)',
      groupName: '-',
      itemName: c.item.name,
      itemCost: c.item.cost,
      qty: c.qty,
      totalDeducted: c.item.cost * c.qty,
      operator: 'Самостоятельно',
      status: 'completed',
      isCustom: false
    });
  });

  state.cart = [];
  state.persistAll();
  
  elements.cartModal.classList.remove('show');
  renderUserData();
  
  alert('Покупка успешна! Пожалуйста, заберите товар(ы) на ресепшене.');
}

function renderUserHistory() {
  const userHistory = state.history.filter(tx => tx.studentId === 'user-self');
  if (userHistory.length === 0) {
    elements.userHistoryTableBody.innerHTML = '';
    elements.userHistoryEmpty.classList.remove('hidden');
    return;
  }
  
  elements.userHistoryEmpty.classList.add('hidden');
  elements.userHistoryTableBody.innerHTML = userHistory.map(tx => `
    <tr>
      <td>${new Date(tx.date).toLocaleString('ru-RU')}</td>
      <td>${tx.itemName} (x${tx.qty})</td>
      <td>${tx.totalDeducted} CC</td>
      <td>${tx.status === 'completed' ? '✅ Ожидает на ресепшене' : '❌ Отменено'}</td>
    </tr>
  `).join('');
}
