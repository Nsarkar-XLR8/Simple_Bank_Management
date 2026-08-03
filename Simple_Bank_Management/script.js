/**
 * Apex Bank Enterprise Management System
 * Modular Vanilla ES6+ Implementation
 */

class Transaction {
    constructor(type, amount, description, balanceAfter) {
        this.id = 'TX-' + Math.floor(100000 + Math.random() * 900000);
        this.type = type; // 'deposit' | 'withdraw' | 'transfer'
        this.amount = parseFloat(amount);
        this.description = description;
        this.balanceAfter = parseFloat(balanceAfter);
        this.date = new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

class BankAccount {
    constructor(name, balance, accountType, id = null, status = 'active', transactionHistory = [], createdAt = null) {
        this.id = id || 'ACC-' + Math.floor(1000 + Math.random() * 9000);
        this.name = name.trim();
        this.balance = parseFloat(balance);
        this.accountType = accountType;
        this.status = status; // 'active' | 'frozen'
        this.createdAt = createdAt || new Date().toISOString();
        this.transactionHistory = transactionHistory.length > 0 
            ? transactionHistory 
            : [new Transaction('deposit', this.balance, `Initial Account Opening Deposit`, this.balance)];
    }

    deposit(amount, description = null) {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return { success: false, message: 'Invalid deposit amount' };
        }
        if (this.status === 'frozen') {
            return { success: false, message: 'Account is frozen! Cannot deposit funds.' };
        }

        this.balance += numericAmount;
        const tx = new Transaction(
            'deposit', 
            numericAmount, 
            description || `Cash Deposit`, 
            this.balance
        );
        this.transactionHistory.unshift(tx);
        return { success: true, message: `Successfully deposited $${numericAmount.toFixed(2)}` };
    }

    withdraw(amount, description = null) {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return { success: false, message: 'Invalid withdrawal amount' };
        }
        if (this.status === 'frozen') {
            return { success: false, message: 'Account is frozen! Cannot withdraw funds.' };
        }
        if (numericAmount > this.balance) {
            return { success: false, message: `Insufficient funds! Available balance: $${this.balance.toFixed(2)}` };
        }

        this.balance -= numericAmount;
        const tx = new Transaction(
            'withdraw', 
            numericAmount, 
            description || `Cash Withdrawal`, 
            this.balance
        );
        this.transactionHistory.unshift(tx);
        return { success: true, message: `Successfully withdrew $${numericAmount.toFixed(2)}` };
    }

    transferTo(recipientAccount, amount) {
        const numericAmount = parseFloat(amount);
        if (!recipientAccount) {
            return { success: false, message: 'Destination account not found' };
        }
        if (recipientAccount.id === this.id) {
            return { success: false, message: 'Cannot transfer funds to the same account' };
        }
        if (this.status === 'frozen' || recipientAccount.status === 'frozen') {
            return { success: false, message: 'Transfer failed! One or both accounts are frozen.' };
        }

        // Perform withdrawal check from source
        const withdrawRes = this.withdraw(numericAmount, `Transfer Out to ${recipientAccount.name} (${recipientAccount.id})`);
        if (!withdrawRes.success) {
            return withdrawRes;
        }

        // Perform deposit into recipient
        recipientAccount.deposit(numericAmount, `Transfer In from ${this.name} (${this.id})`);
        return { 
            success: true, 
            message: `Successfully transferred $${numericAmount.toFixed(2)} to ${recipientAccount.name}` 
        };
    }
}

class BankSystem {
    constructor() {
        this.accounts = [];
        this.storageKey = 'apex_bank_accounts_v2';
        this.loadFromStorage();
    }

    loadFromStorage() {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.accounts = parsed.map(acc => new BankAccount(
                    acc.name,
                    acc.balance,
                    acc.accountType,
                    acc.id,
                    acc.status || 'active',
                    acc.transactionHistory || [],
                    acc.createdAt
                ));
            } catch (err) {
                console.error("Failed to load accounts from storage:", err);
                this.seedInitialDemoData();
            }
        } else {
            this.seedInitialDemoData();
        }
    }

    seedInitialDemoData() {
        this.accounts = [
            new BankAccount('Eleanor Vance', 12450.00, 'Savings', 'ACC-1001'),
            new BankAccount('Alexander Wright', 4890.50, 'Current', 'ACC-1002'),
            new BankAccount('Sophia Martinez', 32000.75, 'Savings', 'ACC-1003')
        ];
        this.saveToStorage();
    }

    saveToStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.accounts));
    }

    addAccount(account) {
        this.accounts.push(account);
        this.saveToStorage();
    }

    deleteAccount(id) {
        this.accounts = this.accounts.filter(acc => acc.id !== id);
        this.saveToStorage();
    }

    getAccountById(id) {
        return this.accounts.find(acc => acc.id === id);
    }

    toggleAccountStatus(id) {
        const acc = this.getAccountById(id);
        if (acc) {
            acc.status = acc.status === 'active' ? 'frozen' : 'active';
            this.saveToStorage();
            return acc.status;
        }
        return null;
    }

    getMetrics() {
        const totalFunds = this.accounts.reduce((sum, acc) => sum + acc.balance, 0);
        const totalAccounts = this.accounts.length;
        const avgBalance = totalAccounts > 0 ? totalFunds / totalAccounts : 0;
        const totalTransactions = this.accounts.reduce((sum, acc) => sum + acc.transactionHistory.length, 0);

        return {
            totalFunds,
            totalAccounts,
            avgBalance,
            totalTransactions
        };
    }

    exportToCSV() {
        if (this.accounts.length === 0) return false;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Account ID,Customer Name,Account Type,Status,Current Balance ($),Total Transactions\n";

        this.accounts.forEach(acc => {
            csvContent += `"${acc.id}","${acc.name}","${acc.accountType}","${acc.status}",${acc.balance.toFixed(2)},${acc.transactionHistory.length}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `apex_bank_report_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
    }
}

// Global Bank System Instance
const bank = new BankSystem();

// Active Modal Session Target
let activeAccountIdForModal = null;

// UI Controller Logic
document.addEventListener('DOMContentLoaded', () => {
    initUI();
});

function initUI() {
    renderDashboard();
    setupEventListeners();
}

function renderDashboard() {
    updateMetrics();
    renderAccountsTable();
}

function updateMetrics() {
    const metrics = bank.getMetrics();
    document.getElementById('statTotalFunds').textContent = `$${metrics.totalFunds.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('statTotalAccounts').textContent = metrics.totalAccounts;
    document.getElementById('statAvgBalance').textContent = `$${metrics.avgBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('statTotalTransactions').textContent = metrics.totalTransactions;
}

function renderAccountsTable() {
    const tbody = document.getElementById('accountsList');
    const emptyState = document.getElementById('emptyState');
    tbody.innerHTML = '';

    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    const filterType = document.getElementById('filterType').value;
    const sortBy = document.getElementById('sortBy').value;

    let filtered = bank.accounts.filter(acc => {
        const matchesSearch = acc.name.toLowerCase().includes(searchQuery) || acc.id.toLowerCase().includes(searchQuery);
        const matchesType = filterType === 'ALL' || acc.accountType === filterType;
        return matchesSearch && matchesType;
    });

    // Sorting
    filtered.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'balance-high') return b.balance - a.balance;
        if (sortBy === 'balance-low') return a.balance - b.balance;
        // Default newest (by creation or array index)
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (filtered.length === 0) {
        emptyState.style.display = 'block';
        return;
    } else {
        emptyState.style.display = 'none';
    }

    filtered.forEach(account => {
        const tr = document.createElement('tr');

        const isFrozen = account.status === 'frozen';
        const badgeClass = account.accountType === 'Savings' ? 'badge-savings' : 'badge-current';
        const statusClass = isFrozen ? 'badge-frozen' : 'badge-active';
        const statusText = isFrozen ? 'Frozen' : 'Active';

        tr.innerHTML = `
            <td><span class="acc-id">${account.id}</span></td>
            <td><span class="acc-name">${escapeHTML(account.name)}</span></td>
            <td><span class="badge ${badgeClass}">${account.accountType}</span></td>
            <td><span class="acc-balance">$${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
            <td>
                <span class="badge ${statusClass}">
                    <span class="status-dot"></span>
                    ${statusText}
                </span>
            </td>
            <td>
                <div class="action-btn-group" style="justify-content: flex-end;">
                    <button class="btn-icon deposit" title="Deposit" onclick="openDepositModal('${account.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>
                    <button class="btn-icon withdraw" title="Withdraw" onclick="openWithdrawModal('${account.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
                        </svg>
                    </button>
                    <button class="btn-icon transfer" title="Transfer" onclick="openTransferModal('${account.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </button>
                    <button class="btn-icon" title="View Audit History" onclick="openHistoryModal('${account.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                    <button class="btn-icon" title="${isFrozen ? 'Unfreeze Account' : 'Freeze Account'}" onclick="toggleStatus('${account.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="${isFrozen ? 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z' : 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM12 11V7a4 4 0 00-8 0'}" />
                        </svg>
                    </button>
                    <button class="btn-icon delete" title="Delete Account" onclick="confirmDeleteAccount('${account.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setupEventListeners() {
    // New Account Form
    document.getElementById('bankForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const balance = parseFloat(document.getElementById('balance').value);
        const accountType = document.getElementById('accountType').value;

        if (!name || isNaN(balance) || balance < 0) {
            showToast('Please fill all fields with valid data.', 'error');
            return;
        }

        const newAccount = new BankAccount(name, balance, accountType);
        bank.addAccount(newAccount);
        renderDashboard();
        showToast(`Created ${accountType} account for ${name} (${newAccount.id})`, 'success');
        
        e.target.reset();
    });

    // Toolbar filters & search
    document.getElementById('searchInput').addEventListener('input', renderAccountsTable);
    document.getElementById('filterType').addEventListener('change', renderAccountsTable);
    document.getElementById('sortBy').addEventListener('change', renderAccountsTable);

    // Header buttons
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        if (bank.exportToCSV()) {
            showToast('Exported bank accounts report to CSV', 'info');
        } else {
            showToast('No accounts available to export', 'warning');
        }
    });

    document.getElementById('resetDemoBtn').addEventListener('click', () => {
        if (confirm('Reset to initial sample demo data? This will clear custom accounts.')) {
            bank.seedInitialDemoData();
            renderDashboard();
            showToast('Bank accounts reset to demo data', 'info');
        }
    });

    // Modal Close Buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.currentTarget.getAttribute('data-close');
            closeModal(modalId);
        });
    });

    // Modal Overlay backdrop clicks
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });

    // Confirm Deposit
    document.getElementById('confirmDepositBtn').addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('depositAmountInput').value);
        const acc = bank.getAccountById(activeAccountIdForModal);
        if (!acc) return;

        const res = acc.deposit(amount);
        if (res.success) {
            bank.saveToStorage();
            renderDashboard();
            closeModal('depositModal');
            showToast(res.message, 'success');
        } else {
            showToast(res.message, 'error');
        }
    });

    // Confirm Withdraw
    document.getElementById('confirmWithdrawBtn').addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('withdrawAmountInput').value);
        const acc = bank.getAccountById(activeAccountIdForModal);
        if (!acc) return;

        const res = acc.withdraw(amount);
        if (res.success) {
            bank.saveToStorage();
            renderDashboard();
            closeModal('withdrawModal');
            showToast(res.message, 'success');
        } else {
            showToast(res.message, 'error');
        }
    });

    // Confirm Transfer
    document.getElementById('confirmTransferBtn').addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('transferAmountInput').value);
        const targetId = document.getElementById('transferTargetSelect').value;
        const sourceAcc = bank.getAccountById(activeAccountIdForModal);
        const targetAcc = bank.getAccountById(targetId);

        if (!sourceAcc || !targetAcc) {
            showToast('Invalid source or destination account', 'error');
            return;
        }

        const res = sourceAcc.transferTo(targetAcc, amount);
        if (res.success) {
            bank.saveToStorage();
            renderDashboard();
            closeModal('transferModal');
            showToast(res.message, 'success');
        } else {
            showToast(res.message, 'error');
        }
    });
}

// Modal Trigger Functions
function openDepositModal(id) {
    const acc = bank.getAccountById(id);
    if (!acc) return;
    if (acc.status === 'frozen') {
        showToast('Account is frozen! Unfreeze to make deposits.', 'warning');
        return;
    }

    activeAccountIdForModal = id;
    document.getElementById('depositAccountInfo').innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Account Holder</span>
            <span class="summary-val">${escapeHTML(acc.name)} (${acc.id})</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Current Balance</span>
            <span class="summary-val" style="color: var(--success);">$${acc.balance.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('depositAmountInput').value = '';
    showModal('depositModal');
}

function openWithdrawModal(id) {
    const acc = bank.getAccountById(id);
    if (!acc) return;
    if (acc.status === 'frozen') {
        showToast('Account is frozen! Unfreeze to make withdrawals.', 'warning');
        return;
    }

    activeAccountIdForModal = id;
    document.getElementById('withdrawAccountInfo').innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Account Holder</span>
            <span class="summary-val">${escapeHTML(acc.name)} (${acc.id})</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Available Balance</span>
            <span class="summary-val" style="color: var(--success);">$${acc.balance.toFixed(2)}</span>
        </div>
    `;
    document.getElementById('withdrawAmountInput').value = '';
    showModal('withdrawModal');
}

function openTransferModal(id) {
    const acc = bank.getAccountById(id);
    if (!acc) return;
    if (acc.status === 'frozen') {
        showToast('Account is frozen! Unfreeze to transfer funds.', 'warning');
        return;
    }

    activeAccountIdForModal = id;
    document.getElementById('transferSourceAccountInfo').innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Source Account</span>
            <span class="summary-val">${escapeHTML(acc.name)} (${acc.id})</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Available Balance</span>
            <span class="summary-val" style="color: var(--success);">$${acc.balance.toFixed(2)}</span>
        </div>
    `;
    
    // Populate recipient dropdown
    const select = document.getElementById('transferTargetSelect');
    select.innerHTML = '';
    const availableTargets = bank.accounts.filter(a => a.id !== id && a.status === 'active');

    if (availableTargets.length === 0) {
        showToast('No active recipient accounts available for transfer', 'warning');
        return;
    }

    availableTargets.forEach(target => {
        const option = document.createElement('option');
        option.value = target.id;
        option.textContent = `${target.name} (${target.id}) - $${target.balance.toFixed(2)}`;
        select.appendChild(option);
    });

    document.getElementById('transferAmountInput').value = '';
    showModal('transferModal');
}

function openHistoryModal(id) {
    const acc = bank.getAccountById(id);
    if (!acc) return;

    document.getElementById('historyAccountInfo').innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Account Holder</span>
            <span class="summary-val">${escapeHTML(acc.name)} (${acc.id})</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Current Balance</span>
            <span class="summary-val" style="color: var(--success);">$${acc.balance.toFixed(2)}</span>
        </div>
    `;

    const listContainer = document.getElementById('historyListContainer');
    listContainer.innerHTML = '';

    if (acc.transactionHistory.length === 0) {
        listContainer.innerHTML = `<div class="empty-state"><p>No transactions recorded yet.</p></div>`;
    } else {
        acc.transactionHistory.forEach(tx => {
            const isPlus = tx.type === 'deposit';
            const sign = isPlus ? '+' : '-';
            const amountClass = isPlus ? 'plus' : 'minus';

            const item = document.createElement('div');
            item.className = `history-item ${tx.type}`;
            item.innerHTML = `
                <div>
                    <div class="history-desc">${escapeHTML(tx.description)}</div>
                    <div class="history-date">${tx.date} • Ref: ${tx.id}</div>
                </div>
                <div class="history-amount ${amountClass}">
                    ${sign}$${tx.amount.toFixed(2)}
                </div>
            `;
            listContainer.appendChild(item);
        });
    }

    showModal('historyModal');
}

function toggleStatus(id) {
    const newStatus = bank.toggleAccountStatus(id);
    if (newStatus) {
        renderDashboard();
        showToast(`Account ${id} is now ${newStatus.toUpperCase()}`, newStatus === 'frozen' ? 'warning' : 'success');
    }
}

function confirmDeleteAccount(id) {
    const acc = bank.getAccountById(id);
    if (!acc) return;
    if (confirm(`Are you sure you want to permanently delete account ${acc.id} (${acc.name})?`)) {
        bank.deleteAccount(id);
        renderDashboard();
        showToast(`Deleted account ${id}`, 'info');
    }
}

// Modal Utility Helpers
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// Toast Notification System
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSVG = '';
    if (type === 'success') {
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    } else if (type === 'error') {
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    } else if (type === 'warning') {
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`;
    } else {
        iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    }

    toast.innerHTML = `${iconSVG} <span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 200);
    }, 3500);
}

// XSS Sanitizer Helper
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
