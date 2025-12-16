document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const summaryItemsContainer = document.getElementById('summary-items');
    const cartTotalElement = document.getElementById('cart-total');

    // Load cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cartItems')) || [];

    function renderCart() {
        // Clear current content
        cartItemsContainer.innerHTML = '';
        summaryItemsContainer.innerHTML = '';

        const summaryHeader = document.getElementById('summary-header');

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
            cartTotalElement.innerText = '$0.00';
            if (summaryHeader) {
                summaryHeader.textContent = 'Order Summary';
            }
            return;
        }

        // Update summary header with item count
        if (summaryHeader) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            summaryHeader.textContent = `Order Summary (${totalItems} items)`;
        }

        let total = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            // 1. Render Left Side Item
            const itemEl = document.createElement('div');
            itemEl.classList.add('cart-item');

            itemEl.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <div class="item-quantity">
                        <span class="qty-label">Quantity:</span>
                        <button class="minus-btn" data-index="${index}">–</button>
                        <span>${item.quantity}</span>
                        <button class="plus-btn" data-index="${index}">+</button>
                    </div>
                </div>
                <span class="item-price">$${item.price.toFixed(2)}</span>
                <button class="remove-item" data-index="${index}">×</button>
            `;

            cartItemsContainer.appendChild(itemEl);

            // 2. Render Right Side Summary Row
            const summaryRow = document.createElement('div');
            summaryRow.classList.add('summary-row');
            summaryRow.innerHTML = `
                <span>${item.name} x${item.quantity}</span>
                <span>$${itemTotal.toFixed(2)}</span>
            `;
            summaryItemsContainer.appendChild(summaryRow);
        });

        // Update Total
        cartTotalElement.innerText = '$' + total.toFixed(2);

        // Attach Event Listeners
        attachEvents();
    }

    function attachEvents() {
        // Plus Buttons
        document.querySelectorAll('.plus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                cart[index].quantity += 1;
                saveAndRender();
            });
        });

        // Minus Buttons
        document.querySelectorAll('.minus-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                if (cart[index].quantity > 1) {
                    cart[index].quantity -= 1;
                    saveAndRender();
                }
            });
        });

        // Remove Buttons
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                cart.splice(index, 1);
                saveAndRender();
            });
        });
    }

    function saveAndRender() {
        localStorage.setItem('cartItems', JSON.stringify(cart));
        renderCart();
        // Update header counter if available (function from common.js)
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        }
    }

    // Initial Render
    renderCart();

    //  IN-PLACE CHECKOUT FUNCTIONALITY 

    const summaryView = document.getElementById('summary-view');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const nextBtn = document.getElementById('next-btn');
    const confirmBtn = document.getElementById('confirm-btn');
    const homeBtn = document.getElementById('home-btn');

    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');

    const locationForm = document.getElementById('location-form');

    // Start checkout - show Step 1
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // Hide summary, show Step 1
        summaryView.classList.add('hidden');
        step1.classList.remove('hidden');
        step2.classList.add('hidden');
        step3.classList.add('hidden');

        // Clear form
        locationForm.reset();
    });

    // Step 1: Next button (with validation)
    nextBtn.addEventListener('click', () => {
        const country = document.getElementById('country').value.trim();
        const city = document.getElementById('city').value.trim();
        const postal = document.getElementById('postal').value.trim();
        const street = document.getElementById('street').value.trim();

        if (!country || !city || !postal || !street) {
            alert('Please fill in all location fields before proceeding.');
            return;
        }

        // Hide Step 1, show Step 2
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
    });

    // Step 2: Confirm Order button
    confirmBtn.addEventListener('click', () => {
        const selectedPayment = document.querySelector('input[name="payment"]:checked').value;

        // Store order info (optional - could send to backend here)
        const orderInfo = {
            items: cart,
            location: {
                country: document.getElementById('country').value,
                city: document.getElementById('city').value,
                postal: document.getElementById('postal').value,
                street: document.getElementById('street').value
            },
            payment: selectedPayment,
            total: calculateTotal()
        };

        console.log('Order placed:', orderInfo);

        // Clear cart
        cart = [];
        localStorage.removeItem('cartItems');

        // Re-render cart to show empty state
        renderCart();

        // Update cart count in header
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        }

        // Hide Step 2, show Step 3 (confirmation)
        step2.classList.add('hidden');
        step3.classList.remove('hidden');
    });

    // Step 3: Back to Home button
    homeBtn.addEventListener('click', () => {
        window.location.href = '/index.html';
    });

    // Helper function to calculate total
    function calculateTotal() {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
});
