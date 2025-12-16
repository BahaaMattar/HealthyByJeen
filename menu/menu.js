document.addEventListener('DOMContentLoaded', () => {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    // Helper to check if it's the customize card
    function isCustomizeCard(card) {
        const title = card.querySelector('h3').innerText;
        return title.includes('Customize Your Own Plate');
    }

    // 1. Handle "Add to Cart" buttons
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Prevent default button behavior
            event.preventDefault();
            event.stopPropagation(); // Stop bubbling to card click

            // Find the parent card
            const card = button.closest('.menu-card');

            // Check if this is the "Customize Your Own Plate" card
            if (isCustomizeCard(card)) {
                window.location.href = '/customization/customization.html';
                return;
            }

            // Extract item details
            const title = card.querySelector('h3').innerText;
            const priceText = card.querySelector('.price').innerText;
            const price = parseFloat(priceText.replace('$', ''));
            const imageSrc = '../menu/' + card.querySelector('.card-image-wrapper img').getAttribute('src');
            // Getting description for the cart page display
            const description = card.querySelector('.card-content p').innerText;

            // Create item object
            const item = {
                id: title.replace(/\s+/g, '-').toLowerCase(),
                name: title,
                price: price,
                image: imageSrc, // Path relative to menu page
                description: description,
                quantity: 1
            };

            addToCart(item, button);
        });
    });

    // 2.  Customize Your Own Plate" card clickable
    const allCards = document.querySelectorAll('.menu-card');
    allCards.forEach(card => {
        if (isCustomizeCard(card)) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                window.location.href = '/customization/customization.html';
            });
        }
    });

    function addToCart(newItem, btnElement) {
        let cart = JSON.parse(localStorage.getItem('cartItems')) || [];

        // Check if item already exists
        const existingItemIndex = cart.findIndex(item => item.id === newItem.id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push(newItem);
        }


        localStorage.setItem('cartItems', JSON.stringify(cart));


        console.log(`${newItem.name} added to cart!`);

        // Trigger animation and then update count
        animateItemToCart(btnElement, () => {
            updateCartCount();
        });
    }

    function animateItemToCart(startElement, callback) {

        let cartIcon = document.querySelector('.mobile-header-cart .cart-wrapper img');
        if (!cartIcon || cartIcon.offsetParent === null) {
            // 2. Fallback to desktop icon
            cartIcon = document.querySelector('.header-icons .cart-wrapper img');
        }

        // If no visible icon is found, just run callback immediately
        if (!cartIcon || cartIcon.offsetParent === null) {
            if (callback) callback();
            return;
        }

        // Create the flying image clone
        const card = startElement.closest('.menu-card');
        const img = card.querySelector('.card-image-wrapper img');
        const flyImg = img.cloneNode();

        // Get start and end positions
        const startRect = img.getBoundingClientRect();
        const endRect = cartIcon.getBoundingClientRect();

        // Style the flying image initial state (for compatibility if animation fails, but we use animate API)
        flyImg.style.position = 'fixed';
        flyImg.style.left = startRect.left + 'px';
        flyImg.style.top = startRect.top + 'px';
        flyImg.style.width = startRect.width + 'px';
        flyImg.style.height = startRect.height + 'px';
        flyImg.style.zIndex = '9999';
        flyImg.style.borderRadius = '50%';
        flyImg.style.opacity = '1';
        flyImg.style.pointerEvents = 'none';

        document.body.appendChild(flyImg);

        // Define Keyframes for "Pop and Fly"
        const keyframes = [
            // Start: Original position
            {
                left: `${startRect.left}px`,
                top: `${startRect.top}px`,
                width: `${startRect.width}px`,
                height: `${startRect.height}px`,
                transform: 'scale(1)',
                opacity: 1
            },
            // 20%: Pop Up and Scale Up (The Jump)
            {
                left: `${startRect.left}px`,
                top: `${startRect.top - 50}px`, // Pop up 50px
                width: `${startRect.width}px`,
                height: `${startRect.height}px`,
                transform: 'scale(1.1)', // Slight zoom
                opacity: 1,
                offset: 0.2 // Timing point
            },
            // 100%: End at Cart (Shrunk)
            {
                left: `${endRect.left}px`,
                top: `${endRect.top}px`,
                width: '30px',
                height: '30px',
                transform: 'scale(0.2)',
                opacity: 0.5
            }
        ];

        // Animate using Web Animations API
        const animation = flyImg.animate(keyframes, {
            duration: 600, // Faster: 600ms
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', // Smooth dynamic easing
            fill: 'forwards'
        });

        // Cleanup after animation
        animation.onfinish = () => {
            flyImg.remove();
            if (callback) callback();
        };
    }
});
