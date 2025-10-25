let allProducts = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
  loadProducts();
  updateAuthUI();

  // Search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', filterProducts);
  }

  // Filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      currentFilter = this.getAttribute('data-filter');
      filterProducts();
      // Update active button
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
    });
  });
});

function loadProducts() {
  fetch('/api/items')
    .then(response => response.json())
    .then(items => {
      allProducts = items;
      displayProducts(items);
    })
    .catch(error => console.error('Error loading products:', error));
}

function displayProducts(products) {
  const productsDiv = document.getElementById('products');
  productsDiv.innerHTML = '';
  products.forEach(item => {
    const productCard = `
      <div class="col-lg-4 col-md-6 mb-4">
        <div class="card h-100">
          <img src="${item.image}" class="card-img-top" alt="${item.name}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${item.name}</h5>
            <p class="card-text flex-grow-1">${item.description}</p>
            <div class="mt-auto">
              <p class="price mb-3">$${item.price}</p>
              <button class="btn btn-primary w-100 add-to-cart" data-id="${item.id}">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    `;
    productsDiv.innerHTML += productCard;
  });

  // Add event listeners to "Add to Cart" buttons
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function() {
      const jerseyId = this.getAttribute('data-id');
      addToCart(jerseyId);
    });
  });
}

function filterProducts() {
  const searchInput = document.getElementById('searchInput');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  let filteredProducts = allProducts;

  // Apply category filter
  if (currentFilter !== 'all') {
    filteredProducts = filteredProducts.filter(item => item.category === currentFilter);
  }

  // Apply search filter
  if (searchTerm) {
    filteredProducts = filteredProducts.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.team.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm)
    );
  }

  displayProducts(filteredProducts);
}

function addToCart(jerseyId) {
  fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ jerseyId: parseInt(jerseyId), quantity: 1 })
  })
  .then(response => response.json())
  .then(data => {
    if (data.error) {
      alert('Please login to add items to cart');
      window.location.href = 'login.html';
    } else {
      alert('Item added to cart!');
    }
  })
  .catch(error => console.error('Error adding to cart:', error));
}
