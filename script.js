// Load transactions from localStorage or initialize empty array
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentEditCustomer = null;

// Add a new customer/transaction
function addTransaction() {
    const customerName = document.getElementById('customerName').value.trim();
    const boxType = document.getElementById('boxType').value;
    const boxCount = document.getElementById('boxCount').value;

    if (!customerName) {
        alert('Customer name is required');
        return;
    }

    // Check for duplicate customer (case-insensitive)
    const existingCustomer = transactions.find(t => t.customerName.toLowerCase() === customerName.toLowerCase());
    if (existingCustomer && !boxCount) {
        alert('Customer already exists. Add box details from their page.');
        return;
    }

    const transaction = {
        id: Date.now(),
        customerName,
        boxType,
        boxCount: boxCount ? parseInt(boxCount) : 0,
        date: new Date().toLocaleString(),
        returned: false,
        returnDate: null
    };

    transactions.push(transaction);
    saveTransactions();
    displayCustomers();
    clearForm();
}

// Add box details to an existing customer
function addBoxToCustomer() {
    const customerName = document.getElementById('customerViewName').textContent.replace("'s Transactions", "");
    const boxType = document.getElementById('newBoxType').value;
    const boxCount = document.getElementById('newBoxCount').value;

    if (!boxCount || boxCount <= 0) {
        alert('Please enter a valid number of boxes');
        return;
    }

    const transaction = {
        id: Date.now(),
        customerName,
        boxType,
        boxCount: parseInt(boxCount),
        date: new Date().toLocaleString(),
        returned: false,
        returnDate: null
    };

    transactions.push(transaction);
    saveTransactions();
    showCustomerView(customerName);
    document.getElementById('addBoxForm').style.display = 'none';
}

// Mark a transaction as returned
function markReturned(id) {
    transactions = transactions.map(t => 
        t.id === id ? { ...t, returned: true, returnDate: new Date().toLocaleString() } : t
    );
    saveTransactions();
    showCustomerView(transactions.find(t => t.id === id).customerName);
}

// Display unique customer list on main page with 3-dot menu
function displayCustomers(filter = '') {
    const list = document.getElementById('customerList');
    list.innerHTML = '';

    const uniqueCustomers = [...new Set(transactions.map(t => t.customerName))].filter(c => 
        c.toLowerCase().includes(filter.toLowerCase())
    );
    uniqueCustomers.forEach(customer => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span onclick="showCustomerView('${customer}')">${customer}</span>
            <button class="ellipsis-btn" onclick="toggleDropdown(event, '${customer}')">⋮</button>
            <div class="dropdown" id="dropdown-${customer.replace(/\s+/g, '-')}">
                <button onclick="editCustomer('${customer}')">Edit Name</button>
                <button onclick="deleteCustomer('${customer}')">Delete Customer</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// Toggle dropdown menu
function toggleDropdown(event, customer) {
    event.stopPropagation();
    const dropdown = document.getElementById(`dropdown-${customer.replace(/\s+/g, '-')}`);
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Edit customer name
function editCustomer(customer) {
    currentEditCustomer = customer;
    document.getElementById('editCustomerName').value = customer;
    document.getElementById('editCustomerModal').style.display = 'block';
}

function saveEditedCustomer() {
    const newName = document.getElementById('editCustomerName').value.trim();
    if (!newName) {
        alert('New name cannot be empty');
        return;
    }

    if (transactions.some(t => t.customerName.toLowerCase() === newName.toLowerCase() && t.customerName !== currentEditCustomer)) {
        alert('This name already exists');
        return;
    }

    transactions = transactions.map(t => 
        t.customerName === currentEditCustomer ? { ...t, customerName: newName } : t
    );
    saveTransactions();
    displayCustomers();
    closeEditModal();
}

function closeEditModal() {
    document.getElementById('editCustomerModal').style.display = 'none';
    currentEditCustomer = null;
}

// Delete customer and all their transactions
function deleteCustomer(customer) {
    if (confirm(`Are you sure you want to delete ${customer} and all their transactions?`)) {
        transactions = transactions.filter(t => t.customerName !== customer);
        saveTransactions();
        displayCustomers();
    }
}

// Search customers
function searchCustomers() {
    const searchInput = document.getElementById('searchInput').value;
    displayCustomers(searchInput);
}

// Show main view (customer list)
function showMainView() {
    document.getElementById('mainView').style.display = 'block';
    document.getElementById('customerView').style.display = 'none';
    displayCustomers();
}

// Show customer detail view (dynamic "page")
function showCustomerView(customerName) {
    document.getElementById('mainView').style.display = 'none';
    document.getElementById('customerView').style.display = 'block';

    const title = document.getElementById('customerViewName');
    const list = document.getElementById('customerTransactionList');

    title.textContent = `${customerName}'s Transactions`;
    list.innerHTML = '';

    const customerTransactions = transactions.filter(t => t.customerName === customerName);
    customerTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    customerTransactions.forEach(t => {
        const row = document.createElement('tr');
        row.className = t.returned ? 'returned' : 'not-returned';
        row.innerHTML = `
            <td>${t.boxType}</td>
            <td>${t.boxCount}</td>
            <td>${t.date}</td>
            <td>${t.returnDate || '-'}</td>
            <td>${t.returned ? 'Returned' : 'Not Returned'}</td>
            <td>
                ${!t.returned ? `
                    <button onclick="markReturned(${t.id})">Mark Returned</button>
                    <button onclick="deleteTransaction(${t.id})">Delete</button>
                ` : ''}
            </td>
        `;
        list.appendChild(row);
    });
}

// Delete a single transaction
function deleteTransaction(id) {
    const customerName = transactions.find(t => t.id === id).customerName;
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    if (transactions.some(t => t.customerName === customerName)) {
        showCustomerView(customerName);
    } else {
        showMainView();
    }
}

// Show/hide add box form
function showAddBoxForm() {
    const form = document.getElementById('addBoxForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Export transactions to CSV
function exportToCSV() {
    const headers = ['ID', 'Customer Name', 'Box Type', 'Quantity', 'Issued Date', 'Returned', 'Return Date'];
    const rows = transactions.map(t => [
        t.id,
        t.customerName,
        t.boxType,
        t.boxCount,
        t.date,
        t.returned ? 'Yes' : 'No',
        t.returnDate || ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'box-o_transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Import transactions from CSV
function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(','));
        const headers = rows.shift();

        const importedTransactions = rows.map(row => ({
            id: parseInt(row[0]),
            customerName: row[1],
            boxType: row[2],
            boxCount: parseInt(row[3]),
            date: row[4],
            returned: row[5].trim().toLowerCase() === 'yes',
            returnDate: row[6] || null
        })).filter(t => t.id && t.customerName && t.boxType);

        transactions = [...transactions, ...importedTransactions];
        saveTransactions();
        displayCustomers();
        alert('Transactions imported successfully!');
    };
    reader.readAsText(file);
}

// Clear the input form
function clearForm() {
    document.getElementById('customerName').value = '';
    document.getElementById('boxCount').value = '';
}

// Load customers on page load
window.onload = () => {
    displayCustomers();
};
