document.addEventListener('DOMContentLoaded', function() {
  updateAuthUI();
  loadCart();
});

function loadCart() {
  fetch('/api/cart')
    .then(response => response.json())
    .then(cartItems => {
      const cartItemsDiv = document.getElementById('cartItems');
      const cartTotalDiv = document.getElementById('cartTotal');
      const totalPriceSpan = document.getElementById('totalPrice');

      if (cartItems.error) {
        cartItemsDiv.innerHTML = '<p>Please login to view your cart.</p>';
        cartTotalDiv.style.display = 'none';
        return;
      }

      if (cartItems.length === 0) {
        cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalDiv.style.display = 'none';
        return;
      }

      let totalPrice = 0;
      cartItemsDiv.innerHTML = '';
      cartItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        const cartItem = `
          <div class="card mb-3">
            <div class="row g-0">
              <div class="col-md-4">
                <img src="${item.image}" class="img-fluid rounded-start" alt="${item.name}">
              </div>
              <div class="col-md-8">
                <div class="card-body">
                  <h5 class="card-title">${item.name}</h5>
                  <p class="card-text">${item.description}</p>
                  <p class="card-text">Price: $${item.price}</p>
                  <div class="d-flex align-items-center">
                    <label class="me-2">Quantity:</label>
                    <input type="number" class="form-control me-2" style="width: 80px;" value="${item.quantity}" min="1" onchange="updateQuantity(${item.id}, this.value)">
                    <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.id})">Remove</button>
                  </div>
                  <p class="card-text mt-2"><strong>Total: $${itemTotal.toFixed(2)}</strong></p>
                </div>
              </div>
            </div>
          </div>
        `;
        cartItemsDiv.innerHTML += cartItem;
      });

      totalPriceSpan.textContent = totalPrice.toFixed(2);
      cartTotalDiv.style.display = 'block';
    })
    .catch(error => {
      console.error('Error loading cart:', error);
      document.getElementById('cartItems').innerHTML = '<p>Error loading cart.</p>';
    });
}

function updateQuantity(cartId, quantity) {
  fetch(`/api/cart/${cartId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ quantity: parseInt(quantity) })
  })
  .then(response => response.json())
  .then(data => {
    if (data.updated || data.deleted) {
      loadCart();
    }
  })
  .catch(error => console.error('Error updating quantity:', error));
}

function removeFromCart(cartId) {
  fetch(`/api/cart/${cartId}`, {
    method: 'DELETE'
  })
  .then(response => response.json())
  .then(data => {
    if (data.deleted) {
      loadCart();
    }
  })
  .catch(error => console.error('Error removing item:', error));
}

// Checkout function (placeholder)
document.getElementById('checkoutBtn').addEventListener('click', function() {
  alert('Checkout functionality not implemented yet. This would process the order.');
});
