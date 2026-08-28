// ==========================================================================
// ButterBloom Cafe — Admin Dashboard Script
// ==========================================================================

const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

const STORAGE_KEYS = {
    ALL_ORDERS: "butterbloom_all_orders",
    USER_ORDERS: "orders",
    ADMIN_AUTH: "butterbloom_admin_authenticated",
    DEVICE_ID: "butterbloom_device_id"
};

// --------------------------------------------------------------------------
// Multi-User Demo Seed Generator
// --------------------------------------------------------------------------
const DEMO_ORDERS = [
    {
        orderId: "849201",
        userId: "DEV-101",
        userName: "Rahul Verma (Laptop)",
        timestamp: "2026-08-28 05:10 PM",
        status: "ongoing",
        items: [
            { id: 16, name: "Paneer Tikka Pizza", price: 200, quantity: 1 },
            { id: 3, name: "Cold Coffee", price: 150, quantity: 2 }
        ],
        total: 500
    },
    {
        orderId: "782194",
        userId: "DEV-102",
        userName: "Ananya Sharma (iPhone)",
        timestamp: "2026-08-28 04:45 PM",
        status: "ongoing",
        items: [
            { id: 24, name: "Cheesecake", price: 180, quantity: 1 },
            { id: 1, name: "Cappuccino", price: 120, quantity: 1 }
        ],
        total: 300
    },
    {
        orderId: "654129",
        userId: "DEV-103",
        userName: "Priya Singh (iPad)",
        timestamp: "2026-08-28 03:20 PM",
        status: "completed",
        items: [
            { id: 19, name: "White Sauce Pasta", price: 150, quantity: 2 },
            { id: 21, name: "Peri Peri Fries", price: 80, quantity: 1 },
            { id: 2, name: "Masala Chai", price: 80, quantity: 2 }
        ],
        total: 540
    },
    {
        orderId: "591048",
        userId: "DEV-101",
        userName: "Rahul Verma (Laptop)",
        timestamp: "2026-08-27 07:15 PM",
        status: "completed",
        items: [
            { id: 8, name: "Double Cheese Burger", price: 150, quantity: 2 },
            { id: 25, name: "Glazed Donuts", price: 150, quantity: 1 }
        ],
        total: 450
    },
    {
        orderId: "430291",
        userId: "DEV-104",
        userName: "Amit Patel (Android)",
        timestamp: "2026-08-27 01:30 PM",
        status: "cancelled",
        items: [
            { id: 14, name: "Cheese Burst Pizza", price: 120, quantity: 1 }
        ],
        total: 120
    }
];

// Helper: Ensure device ID exists
function getOrCreateDeviceId() {
    let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
        deviceId = "DEV-" + Math.floor(1000 + Math.random() * 9000);
        localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    return deviceId;
}

// --------------------------------------------------------------------------
// Storage Management
// --------------------------------------------------------------------------
function getAllOrders() {
    const raw = localStorage.getItem(STORAGE_KEYS.ALL_ORDERS);
    if (!raw) {
        // Initialize with demo seed
        localStorage.setItem(STORAGE_KEYS.ALL_ORDERS, JSON.stringify(DEMO_ORDERS));
        return DEMO_ORDERS;
    }
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveAllOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.ALL_ORDERS, JSON.stringify(orders));

    // Also sync orders for the current device to user's 'orders' key
    const currentDeviceId = getOrCreateDeviceId();
    const myDeviceOrders = orders.filter(o => o.userId === currentDeviceId);
    localStorage.setItem(STORAGE_KEYS.USER_ORDERS, JSON.stringify(myDeviceOrders));

    window.dispatchEvent(new Event("ordersUpdated"));
}

// --------------------------------------------------------------------------
// DOM Elements
// --------------------------------------------------------------------------
const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const loginForm = document.getElementById("loginForm");
const adminUsernameInput = document.getElementById("adminUsername");
const adminPasswordInput = document.getElementById("adminPassword");
const loginErrorMsg = document.getElementById("loginErrorMsg");
const adminUserControl = document.getElementById("adminUserControl");
const logoutBtn = document.getElementById("logoutBtn");

const kpiTotalOrders = document.getElementById("kpiTotalOrders");
const kpiOngoingOrders = document.getElementById("kpiOngoingOrders");
const kpiCompletedOrders = document.getElementById("kpiCompletedOrders");
const kpiCancelledOrders = document.getElementById("kpiCancelledOrders");
const kpiTotalRevenue = document.getElementById("kpiTotalRevenue");

const orderSearchInput = document.getElementById("orderSearchInput");
const statusTabs = document.querySelectorAll(".status-tab");
const ordersTableBody = document.getElementById("ordersTableBody");
const tableEmptyState = document.getElementById("tableEmptyState");

const userSelectDropdown = document.getElementById("userSelectDropdown");
const inspectUserName = document.getElementById("inspectUserName");
const inspectUserId = document.getElementById("inspectUserId");
const inspectOrderCount = document.getElementById("inspectOrderCount");
const inspectTotalSpent = document.getElementById("inspectTotalSpent");
const inspectCompletedCount = document.getElementById("inspectCompletedCount");
const inspectCancelledCount = document.getElementById("inspectCancelledCount");
const userHistoryList = document.getElementById("userHistoryList");

const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");
const seedDemoDataBtn = document.getElementById("seedDemoDataBtn");
const adminToastContainer = document.getElementById("adminToastContainer");

let currentStatusFilter = "all";
let currentSearchQuery = "";

// --------------------------------------------------------------------------
// Authentication Logic
// --------------------------------------------------------------------------
function checkAuth() {
    const isAuth = sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === "true";
    if (isAuth) {
        loginScreen.style.display = "none";
        dashboardScreen.style.display = "block";
        adminUserControl.style.display = "flex";
        renderDashboard();
    } else {
        loginScreen.style.display = "flex";
        dashboardScreen.style.display = "none";
        adminUserControl.style.display = "none";
    }
}

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = adminUsernameInput.value.trim();
    const pass = adminPasswordInput.value.trim();

    if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, "true");
        loginErrorMsg.style.display = "none";
        loginForm.reset();
        showToast("Welcome to ButterBloom Admin!", "success");
        checkAuth();
    } else {
        loginErrorMsg.style.display = "flex";
        adminPasswordInput.value = "";
        adminPasswordInput.focus();
    }
});

logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    showToast("Logged out successfully.", "info");
    checkAuth();
});

// --------------------------------------------------------------------------
// KPI Metrics Calculation
// --------------------------------------------------------------------------
function renderMetrics(orders) {
    const total = orders.length;
    const ongoing = orders.filter(o => o.status === "ongoing").length;
    const completed = orders.filter(o => o.status === "completed").length;
    const cancelled = orders.filter(o => o.status === "cancelled").length;
    
    const revenue = orders
        .filter(o => o.status === "completed")
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    kpiTotalOrders.textContent = total;
    kpiOngoingOrders.textContent = ongoing;
    kpiCompletedOrders.textContent = completed;
    kpiCancelledOrders.textContent = cancelled;
    kpiTotalRevenue.textContent = `₹${revenue.toLocaleString("en-IN")}`;
}

// --------------------------------------------------------------------------
// Orders Table Rendering
// --------------------------------------------------------------------------
function renderOrdersTable() {
    const allOrders = getAllOrders();
    renderMetrics(allOrders);

    let filtered = allOrders;

    // Filter by status tab
    if (currentStatusFilter !== "all") {
        filtered = filtered.filter(o => o.status === currentStatusFilter);
    }

    // Filter by search keyword
    if (currentSearchQuery) {
        const q = currentSearchQuery.toLowerCase();
        filtered = filtered.filter(o => {
            const matchId = String(o.orderId || "").toLowerCase().includes(q);
            const matchUser = String(o.userName || "").toLowerCase().includes(q) || String(o.userId || "").toLowerCase().includes(q);
            const matchItems = (o.items || []).some(it => String(it.name || "").toLowerCase().includes(q));
            return matchId || matchUser || matchItems;
        });
    }

    ordersTableBody.innerHTML = "";

    if (filtered.length === 0) {
        tableEmptyState.style.display = "block";
        return;
    }

    tableEmptyState.style.display = "none";

    filtered.forEach(order => {
        const row = document.createElement("tr");

        // Format items list
        const itemsListHtml = (order.items || [])
            .map(it => `<li>${escapeHtml(it.name)} <strong>× ${it.quantity}</strong></li>`)
            .join("");

        // Format actions
        let actionsHtml = "";
        if (order.status === "ongoing") {
            actionsHtml = `
                <div class="table-action-btns">
                    <button class="btn-complete" onclick="changeOrderStatus('${order.orderId}', 'completed')" title="Mark Completed">
                        <i class="fa-solid fa-check"></i> Complete
                    </button>
                    <button class="btn-cancel" onclick="changeOrderStatus('${order.orderId}', 'cancelled')" title="Cancel Order">
                        <i class="fa-solid fa-xmark"></i> Cancel
                    </button>
                    <button class="btn-inspect-user" onclick="inspectUserDirectly('${order.userId}')" title="Inspect User History">
                        <i class="fa-solid fa-user"></i>
                    </button>
                </div>
            `;
        } else {
            actionsHtml = `
                <div class="table-action-btns">
                    <button class="btn-inspect-user" onclick="inspectUserDirectly('${order.userId}')" title="Inspect User History">
                        <i class="fa-solid fa-user"></i> History
                    </button>
                </div>
            `;
        }

        row.innerHTML = `
            <td class="order-id-cell">#${escapeHtml(String(order.orderId))}</td>
            <td class="customer-cell">
                <span class="customer-name">${escapeHtml(order.userName || "Customer")}</span>
                <span class="customer-device">${escapeHtml(order.userId || "DEV-000")}</span>
            </td>
            <td>${escapeHtml(order.timestamp || "Recent")}</td>
            <td>
                <ul class="items-cell-list">${itemsListHtml}</ul>
            </td>
            <td class="price-cell">₹${order.total || 0}</td>
            <td>
                <span class="status-badge ${order.status}">
                    <i class="fa-solid ${getStatusIcon(order.status)}"></i> ${order.status}
                </span>
            </td>
            <td>${actionsHtml}</td>
        `;

        ordersTableBody.appendChild(row);
    });
}

function getStatusIcon(status) {
    if (status === "completed") return "fa-circle-check";
    if (status === "cancelled") return "fa-ban";
    return "fa-clock";
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// --------------------------------------------------------------------------
// Order Status Mutation
// --------------------------------------------------------------------------
window.changeOrderStatus = function(orderId, newStatus) {
    const allOrders = getAllOrders();
    const target = allOrders.find(o => String(o.orderId) === String(orderId));

    if (!target) {
        showToast("Order not found.", "warning");
        return;
    }

    target.status = newStatus;
    saveAllOrders(allOrders);

    const statusLabel = newStatus === "completed" ? "Completed" : "Cancelled";
    showToast(`Order #${orderId} marked as ${statusLabel}.`, newStatus === "completed" ? "success" : "warning");

    renderOrdersTable();
    
    // Refresh user inspector if currently inspecting this user
    if (userSelectDropdown.value === target.userId) {
        renderUserHistory(target.userId);
    }
};

// --------------------------------------------------------------------------
// User History Inspector
// --------------------------------------------------------------------------
function populateUserDropdown() {
    const allOrders = getAllOrders();
    const currentDeviceId = getOrCreateDeviceId();

    // Map unique user IDs with their latest known user name
    const userMap = new Map();
    allOrders.forEach(o => {
        if (o.userId) {
            userMap.set(o.userId, o.userName || `Customer (${o.userId})`);
        }
    });

    // Ensure current device is present
    if (!userMap.has(currentDeviceId)) {
        userMap.set(currentDeviceId, "Current Device (You)");
    }

    const previousSelected = userSelectDropdown.value;
    userSelectDropdown.innerHTML = "";

    userMap.forEach((name, id) => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = `${name} [${id}]`;
        if (id === currentDeviceId) {
            opt.textContent += " ⭐ (This Device)";
        }
        userSelectDropdown.appendChild(opt);
    });

    if (previousSelected && userMap.has(previousSelected)) {
        userSelectDropdown.value = previousSelected;
    } else if (userSelectDropdown.options.length > 0) {
        userSelectDropdown.selectedIndex = 0;
    }

    if (userSelectDropdown.value) {
        renderUserHistory(userSelectDropdown.value);
    }
}

function renderUserHistory(userId) {
    const allOrders = getAllOrders();
    const userOrders = allOrders.filter(o => o.userId === userId);

    const userName = userOrders.length > 0 ? userOrders[0].userName : "Customer";
    inspectUserName.textContent = userName;
    inspectUserId.textContent = `Device / User ID: ${userId}`;

    const totalOrders = userOrders.length;
    const totalSpent = userOrders
        .filter(o => o.status === "completed")
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const completedCount = userOrders.filter(o => o.status === "completed").length;
    const cancelledCount = userOrders.filter(o => o.status === "cancelled").length;

    inspectOrderCount.textContent = totalOrders;
    inspectTotalSpent.textContent = `₹${totalSpent.toLocaleString("en-IN")}`;
    inspectCompletedCount.textContent = completedCount;
    inspectCancelledCount.textContent = cancelledCount;

    userHistoryList.innerHTML = "";

    if (userOrders.length === 0) {
        userHistoryList.innerHTML = `
            <div class="table-empty-state">
                <p>No orders on record for this customer/device yet.</p>
            </div>
        `;
        return;
    }

    userOrders.forEach(order => {
        const itemCard = document.createElement("div");
        itemCard.className = "user-history-item";

        const itemsSummary = (order.items || [])
            .map(it => `${escapeHtml(it.name)} × ${it.quantity}`)
            .join(", ");

        itemCard.innerHTML = `
            <div class="user-hist-left">
                <div>
                    <span class="user-hist-id">Order #${escapeHtml(String(order.orderId))}</span>
                    <div class="user-hist-date">${escapeHtml(order.timestamp || "Recent")}</div>
                </div>
            </div>
            <div class="user-hist-items">
                <strong>Items:</strong> ${itemsSummary}
            </div>
            <div class="user-hist-right">
                <span class="user-hist-price">₹${order.total || 0}</span>
                <span class="status-badge ${order.status}">
                    <i class="fa-solid ${getStatusIcon(order.status)}"></i> ${order.status}
                </span>
            </div>
        `;

        userHistoryList.appendChild(itemCard);
    });
}

window.inspectUserDirectly = function(userId) {
    userSelectDropdown.value = userId;
    renderUserHistory(userId);
    userSelectDropdown.scrollIntoView({ behavior: "smooth", block: "center" });
};

userSelectDropdown.addEventListener("change", (e) => {
    renderUserHistory(e.target.value);
});

// --------------------------------------------------------------------------
// Filtering & Search Listeners
// --------------------------------------------------------------------------
statusTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        statusTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentStatusFilter = tab.dataset.filter;
        renderOrdersTable();
    });
});

orderSearchInput.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value.trim();
    renderOrdersTable();
});

refreshOrdersBtn.addEventListener("click", () => {
    renderDashboard();
    showToast("Orders refreshed.", "info");
});

seedDemoDataBtn.addEventListener("click", () => {
    if (confirm("Reset orders with fresh sample data from multiple users?")) {
        localStorage.setItem(STORAGE_KEYS.ALL_ORDERS, JSON.stringify(DEMO_ORDERS));
        renderDashboard();
        showToast("Demo orders restored.", "success");
    }
});

// --------------------------------------------------------------------------
// Toast Notification
// --------------------------------------------------------------------------
function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `admin-toast ${type}`;
    
    let iconClass = "fa-circle-info";
    if (type === "success") iconClass = "fa-circle-check";
    if (type === "warning") iconClass = "fa-triangle-exclamation";

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    adminToastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(30px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// --------------------------------------------------------------------------
// Dashboard Render Coordinator
// --------------------------------------------------------------------------
function renderDashboard() {
    renderOrdersTable();
    populateUserDropdown();
}

// Real-time synchronization when other tabs place orders
window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEYS.ALL_ORDERS || e.key === STORAGE_KEYS.USER_ORDERS) {
        renderDashboard();
    }
});

window.addEventListener("ordersUpdated", () => {
    renderDashboard();
});

// Initial boot
document.addEventListener("DOMContentLoaded", () => {
    getOrCreateDeviceId();
    checkAuth();
});
