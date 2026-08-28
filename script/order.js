const tabs = document.querySelectorAll(".tab");
const ordersContainer = document.querySelector(".orders-container");
const emptyOrders = document.querySelector(".empty-orders");

const orderImages = {
    cheesecake: "../images/desserts/cheesecake.jpg",
    glazeddonut: "../images/desserts/glazeddonut.jpg",
    redvelvetpastry: "../images/desserts/redvelvetpastry.jpg",
    whitesaucepasta: "../images/pasta/whitesaucepasta.jpg",
    macandcheesepasta: "../images/pasta/macandcheesepasta.jpg",
    arrabbiatapasta: "../images/pasta/arrabbiatapasta.jpg",
    paneertikkapizza: "../images/pizza/paneertikkapizza.jpg",
    margheritapizza: "../images/pizza/margheritapizza.jpg",
    cheeseburstpizza: "../images/pizza/cheeseburstpizza.jpg",
    alootikkiburger: "../images/burger/alootikkiburger.jpg",
    alootikkiburger2: "../images/burger/alootikkiburger2.jpg",
    chickenburger: "../images/burger/chickenburger.jpg",
    classicvegburger: "../images/burger/classicvegburger.jpg",
    crispypaneerburger: "../images/burger/crispypaneerburger.jpg",
    doublecheeseburger: "../images/burger/doublecheeseburger.jpg",
    chickensandwich: "../images/sandwich/chickensandwich.jpg",
    cornandcheesesandwich: "../images/sandwich/cornandcheesesandwich.jpg",
    veggrilledsandwich: "../images/sandwich/veggrilledsandwich.jpg",
    classicfries: "../images/sides/classicfries.jpg",
    nachos: "../images/sides/nachos.jpg",
    periperifries: "../images/sides/periperifries.jpg",
    americano: "../images/drinks/americano.jpg",
    cappuccino: "../images/drinks/cappuccino.jpg",
    coldcoffee: "../images/drinks/coldcoffee.jpg",
    masalachai: "../images/drinks/masalachai.jpg",
    matcha: "../images/drinks/matcha.jpg"
};

function getOrCreateDeviceId() {
    let deviceId = localStorage.getItem("butterbloom_device_id");
    if (!deviceId) {
        deviceId = "DEV-" + Math.floor(1000 + Math.random() * 9000);
        localStorage.setItem("butterbloom_device_id", deviceId);
    }
    return deviceId;
}

function getOrders(){
    const myDeviceId = getOrCreateDeviceId();
    const allOrdersRaw = localStorage.getItem("butterbloom_all_orders");
    
    if (allOrdersRaw) {
        try {
            const allOrders = JSON.parse(allOrdersRaw);
            if (Array.isArray(allOrders)) {
                return allOrders.filter(o => o.userId === myDeviceId);
            }
        } catch {}
    }

    return JSON.parse(localStorage.getItem("orders")) || [];
}

function saveOrders(myOrders){
    localStorage.setItem("orders", JSON.stringify(myOrders));
    
    const myDeviceId = getOrCreateDeviceId();
    const allOrdersRaw = localStorage.getItem("butterbloom_all_orders");
    let allOrders = [];
    
    if (allOrdersRaw) {
        try {
            allOrders = JSON.parse(allOrdersRaw) || [];
        } catch {}
    }

    // Replace or merge current device's orders in all_orders
    const otherOrders = allOrders.filter(o => o.userId !== myDeviceId);
    const merged = [...myOrders, ...otherOrders];
    localStorage.setItem("butterbloom_all_orders", JSON.stringify(merged));
    
    window.dispatchEvent(new Event("ordersUpdated"));
}

let orderCards = [];

function parsePrice(price) {
    return Number(String(price || "").replace(/[^\d.]/g, "")) || 0;
}

function createOrderCard(order){

    const card = document.createElement("div");
    card.className = `order-card ${order.status}`;

    const info = document.createElement("div");
    info.className = "order-info";

    const title = document.createElement("h3");
    title.textContent = `Order #${order.orderId}`;

    const status = document.createElement("span");
    status.className = `status ${order.status}-status`;
    status.textContent = order.status;

    info.append(title, status);

    let total = 0;

    order.items.forEach(item=>{

        const food = document.createElement("p");

        food.textContent =
        `${item.name} × ${item.quantity}`;

        info.appendChild(food);

        total += parsePrice(item.price) * item.quantity;

    });

    const price = document.createElement("h2");
    price.textContent = `₹${total}`;

    card.append(info, price);

    return card;

}


function getCartItems() {
    const savedCart = localStorage.getItem("cart") || localStorage.getItem("butterbloomCart");

    if (!savedCart) {
        return [];
    }

    try {
        const cartItems = JSON.parse(savedCart);
        return Array.isArray(cartItems) ? cartItems : [];
    } catch {
        return [];
    }
}

function createCartItem(cartItem) {
    const item = document.createElement("div");
    item.className = "cart-item";

    const image = document.createElement("img");
    image.src = cartItem.image || orderImages[cartItem.item] || "../images/cafe.jpg";
    image.alt = cartItem.name || "Cart item";

    const info = document.createElement("div");
    info.className = "cart-item-info";

    const name = document.createElement("h3");
    name.textContent = cartItem.name || "Untitled Item";

    const controls = document.createElement("div");
    controls.className = "quantity-controls";

    const minus = document.createElement("button");
    minus.textContent = "−";

    const qty = document.createElement("span");
    qty.textContent = cartItem.quantity;

    const plus = document.createElement("button");
    plus.textContent = "+";

    controls.append(minus, qty, plus);

    info.append(name, controls);

    const price = document.createElement("strong");
    price.className = "cart-item-price";
    
    price.textContent = `₹${parsePrice(cartItem.price) * cartItem.quantity}`
    item.append(image, info, price);

    plus.onclick = () => {
        addToCart ({

            id: cartItem.id,
            item: cartItem.item,
            name: cartItem.name,
            price: cartItem.price,
            image: cartItem.image
        });

        renderCart();

        if(typeof updateCartPreview==="function"){
            updateCartPreview();
        }
    };

    minus.onclick = () => {

        removeFromCart(cartItem.id);
        renderCart();
    };

    return item;
}

window.addEventListener("cartUpdated",()=>{

    renderCart();

});


function placeOrder(){

    const cartItems = getCartItems();
    let orders = getOrders();

    if(cartItems.length === 0){
        return;
    }

    const deviceId = getOrCreateDeviceId();
    const totalPrice = cartItems.reduce((sum, item) => {
        const qty = Number(item.quantity) || 1;
        return sum + parsePrice(item.price) * qty;
    }, 0);

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) + ", " +
                          now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const newOrder = {
        orderId: Date.now().toString().slice(-6),
        userId: deviceId,
        userName: `Device ${deviceId}`,
        timestamp: formattedDate,
        status: "ongoing",
        items: cartItems,
        total: totalPrice
    };

    orders.unshift(newOrder);
    saveOrders(orders);
    renderOrders();
    localStorage.removeItem("cart");
    renderCart();

    alert("🎉 Order placed successfully!");
}


const checkoutBtn = document.querySelector(".checkout-btn");
function renderCart() {
    const cartItemsContainer = document.querySelector(".cart-items");
    const cartCount = document.querySelector(".cart-count");
    const cartTotal = document.querySelector(".cart-total");

    if (!cartItemsContainer || !cartCount || !cartTotal || !checkoutBtn) {
        return;
    }

    const cartItems = getCartItems();
    const totalItems = cartItems.reduce((total, item) => total + (Number(item.quantity) || 1), 0);
    const totalPrice = cartItems.reduce((total, item) => {
        const quantity = Number(item.quantity) || 1;
        return total + parsePrice(item.price) * quantity;
    }, 0);

    cartItemsContainer.innerHTML = "";

    if (cartItems.length === 0) {
        const emptyCart = document.createElement("div");
        emptyCart.className = "empty-cart";
        emptyCart.textContent = "Your cart is empty.";
        cartItemsContainer.appendChild(emptyCart);
    } else {
        cartItems.forEach(item => {
            cartItemsContainer.appendChild(createCartItem(item));
        });
    }

    cartCount.textContent = `${totalItems} ${totalItems === 1 ? "item" : "items"}`;
    cartTotal.textContent = `₹${totalPrice}`;
    checkoutBtn.disabled = cartItems.length === 0;  
}


function filterOrders(filter) {
    let visibleCards = 0;

    orderCards.forEach(card => {
        const shouldShow = filter === "all" || card.classList.contains(filter);

        if (shouldShow) {
            visibleCards++;
        }

        card.classList.toggle("hide", !shouldShow);
    });

    if (emptyOrders) {
        emptyOrders.classList.toggle("hide", visibleCards > 0);
    }
}

function renderOrders(){

    const orders = getOrders();

    if (!ordersContainer) return;

    ordersContainer.innerHTML = "";

    if(orders.length === 0){
        emptyOrders.classList.remove("hide");
        orderCards = [];
        return;
    }

    emptyOrders.classList.add("hide");

    orders.forEach(order=>{
        ordersContainer.appendChild(
            createOrderCard(order)
        );
    });

    orderCards = Array.from(ordersContainer.querySelectorAll(".order-card"));
}

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(btn => btn.classList.remove("active"));
        tab.classList.add("active");
        filterOrders(tab.dataset.filter);
    });
});

renderOrders();
renderCart();


checkoutBtn.addEventListener("click", placeOrder);


// CONTACT POPUP

const contactBtn=document.querySelectorAll(".contact-us");
const popup=document.getElementById("contactPopup");
const closeBtn=document.getElementById("closePopup");
const contactForm=document.getElementById("contactForm");

contactBtn.forEach(btn =>{
    btn.addEventListener("click",()=>{
        popup.classList.add("show");
    });
})

closeBtn.addEventListener("click",()=>{
    popup.classList.remove("show");
});

popup.addEventListener("click",(e)=>{

    if(e.target===popup){
        popup.classList.remove("show");
    }
});

contactForm.addEventListener("submit",(e)=>{

    e.preventDefault();
    alert("Thank you! We'll contact you soon.");
    contactForm.reset();
    popup.classList.remove("show");
});

// Real-time synchronization with Admin dashboard status changes
window.addEventListener("storage", (e) => {
    if (e.key === "orders" || e.key === "butterbloom_all_orders") {
        renderOrders();
    }
});

window.addEventListener("ordersUpdated", () => {
    renderOrders();
});
