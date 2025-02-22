// Load transactions from localStorage or initialize empty array
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Add a new transaction with unique customer check
function addTransaction() {
    const customerName = document.getElementById('customerName').value.trim();
    const boxType = document.getElementById('boxType').value;
    const boxCount = document.getElementById('boxCount').value;

    if (!customerName || !boxCount || boxCount <= 0) {
        alert('Please fill all fields with valid data');
        return;
    }

    // Check for duplicate customer name
    const existingCustomer = transactions.some(t => t.customerName.toLowerCase() === customerName.toLowerCase());
    if (existingCustomer) {
        // If customer exists, add transaction to their history
        const transaction = {
            id: Date.now(),
            customerName,
            boxType,
            boxCount: parseInt(boxCount),
            date: new Date().toLocaleString(),
            returned: false
        };
        transactions.push(transaction);
    } else {
        // New customer, add first transaction
        const transaction = {
            id: Date.now(),
            customerName,
            boxType,
            boxCount: parseInt(boxCount),
            date: new Date().toLocaleString(),
            returned: false
        };
        transactions.push(transaction);
    }

    saveTransactions();
    displayCustomers();
    autoExportToCSV();
    clearForm();
}

// Mark a transaction as returned
function markReturned(id) {
    transactions = transactions.map(t => 
        t.id === id ? { ...t, returned: true } : t
    );
    saveTransactions();
    showCustomerView(transactions.find(t => t.id === id).customerName);
}

// Delete a transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    const customerName = document.getElementById('customerViewName').textContent.replace("'s Transactions", "");
    if (transactions.some(t => t.customerName === customerName)) {
        showCustomerView(customerName);
    } else {
        showMainView();
    }
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Display unique customer list on main page
function displayCustomers() {
    const list = document.getElementById('customerList');
    list.innerHTML = '';

    const uniqueCustomers = [...new Set(transactions.map(t => t.customerName))];
    uniqueCustomers.forEach(customer => {
        const li = document.createElement('li');
        li.textContent = customer;
        li.onclick = () => showCustomerView(customer);
        list.appendChild(li);
    });
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
            <td>${t.returned ? 'Returned' : 'Not Returned'}</td>
            <td>
                ${!t.returned ? `<button onclick="markReturned(${t.id})">Mark Returned</button>` : ''}
                <button onclick="deleteTransaction(${t.id})">Delete</button>
            </td>
        `;
        list.appendChild(row);
    });
}

// Export transactions to CSV (manual trigger)
function exportToCSV() {
    const headers = ['ID', 'Customer Name', 'Box Type', 'Quantity', 'Date', 'Returned'];
    const rows = transactions.map(t => [
        t.id,
        t.customerName,
        t.boxType,
        t.boxCount,
        t.date,
        t.returned ? 'Yes' : 'No'
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

// Automatically export to CSV after adding a transaction
function autoExportToCSV() {
    exportToCSV();
}

// Import transactions from CSV
function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(','));
        const headers = rows.shift(); // Remove header row

        const importedTransactions = rows.map(row => ({
            id: parseInt(row[0]),
            customerName: row[1],
            boxType: row[2],
            boxCount: parseInt(row[3]),
            date: row[4],
            returned: row[5].trim().toLowerCase() === 'yes'
        })).filter(t => t.id && t.customerName && t.boxType && t.boxCount && t.date);

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