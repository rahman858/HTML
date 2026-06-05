// ==================== KONFIGURASI ====================
const API_BASE = 'https://dummyjson.com/products';

// ==================== DOM ELEMENTS ====================
const productForm = document.getElementById('product-form');
const namaInput = document.getElementById('nama');
const hargaInput = document.getElementById('harga');
const editIdInput = document.getElementById('edit-id');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit');
const productContainer = document.getElementById('product-container');
const formTitle = document.getElementById('form-title');
const productCount = document.getElementById('product-count');

// ==================== STATE ====================
let products = [];

// ==================== HELPER FUNCTIONS ====================
function formatRupiah(price) {
    return new Intl.NumberFormat('id-ID').format(price);
}

function showError(message) {
    const existingError = document.querySelector('.error-message');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `⚠️ ${message}`;
    
    const formCard = document.querySelector('.form-card');
    formCard.insertBefore(errorDiv, formCard.firstChild);
    
    setTimeout(() => {
        if (errorDiv.parentElement) errorDiv.remove();
    }, 4000);
}

function showTemporaryMessage(message, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'error-message';
    msgDiv.style.background = type === 'success' ? '#d4edda' : '#f8d7da';
    msgDiv.style.color = type === 'success' ? '#155724' : '#721c24';
    msgDiv.style.borderLeftColor = type === 'success' ? '#28a745' : '#dc3545';
    msgDiv.innerHTML = message;
    
    const formCard = document.querySelector('.form-card');
    formCard.insertBefore(msgDiv, formCard.firstChild);
    
    setTimeout(() => {
        if (msgDiv.parentElement) msgDiv.remove();
    }, 3000);
}

function updateProductCount() {
    const count = products.length;
    productCount.textContent = `${count} ${count === 1 ? 'produk' : 'produk'}`;
}

function showLoading(isLoading) {
    if (isLoading) {
        productContainer.innerHTML = '<div class="loading">⏳ Memuat data produk...</div>';
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function resetForm() {
    editIdInput.value = '';
    namaInput.value = '';
    hargaInput.value = '';
    formTitle.innerHTML = '➕ Tambah Produk Baru';
    submitBtn.innerHTML = '💾 Simpan Produk';
    cancelEditBtn.style.display = 'none';
}

// ==================== RENDER PRODUCTS ====================
function renderProducts() {
    if (!products || products.length === 0) {
        productContainer.innerHTML = `
            <div class="empty-state">
                📭 Belum ada produk
                <p>Silakan tambah produk baru menggunakan form di atas</p>
            </div>
        `;
        return;
    }

    productContainer.innerHTML = products.map(product => `
        <div class="product-item" data-id="${product.id}">
            <div class="product-info">
                <div class="product-name">📦 ${escapeHtml(product.title)}</div>
                <div class="product-price">💰 Rp ${formatRupiah(product.price)}</div>
            </div>
            <div class="product-actions">
                <button class="btn-edit" onclick="editProduct(${product.id})">✏️ Edit</button>
                <button class="btn-delete" onclick="deleteProduct(${product.id})">🗑️ Hapus</button>
            </div>
        </div>
    `).join('');
}

// ==================== CRUD OPERATIONS ====================

// GET: Ambil semua produk
async function fetchProducts() {
    try {
        showLoading(true);
        
        const response = await fetch(API_BASE, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        products = data.products || [];
        renderProducts();
        updateProductCount();
        
    } catch (error) {
        console.error('Fetch error:', error);
        showError('Gagal memuat data dari server. Periksa koneksi internet Anda.');
        productContainer.innerHTML = '<div class="empty-state">❌ Gagal memuat produk</div>';
    } finally {
        showLoading(false);
    }
}

// POST: Tambah produk
async function addProduct(title, price) {
    try {
        const response = await fetch(`${API_BASE}/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                price: price,
                description: 'Produk baru',
                category: 'general'
            })
        });

        if (!response.ok) {
            throw new Error(`Gagal menambahkan: ${response.status}`);
        }

        const newProduct = await response.json();
        
        products.unshift({
            id: newProduct.id,
            title: newProduct.title,
            price: newProduct.price
        });
        
        renderProducts();
        updateProductCount();
        resetForm();
        showTemporaryMessage('✅ Produk berhasil ditambahkan!', 'success');
        
    } catch (error) {
        console.error('Add error:', error);
        showError('Gagal menambahkan produk. Silakan coba lagi.');
    }
}

// PUT: Update produk
async function updateProduct(id, title, price) {
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                price: price
            })
        });

        if (!response.ok) {
            throw new Error(`Gagal update: ${response.status}`);
        }

        const updatedProduct = await response.json();
        
        const index = products.findIndex(p => p.id == id);
        if (index !== -1) {
            products[index] = {
                ...products[index],
                title: updatedProduct.title,
                price: updatedProduct.price
            };
        }
        
        renderProducts();
        updateProductCount();
        resetForm();
        showTemporaryMessage('✅ Produk berhasil diupdate!', 'success');
        
    } catch (error) {
        console.error('Update error:', error);
        showError('Gagal mengupdate produk. Silakan coba lagi.');
    }
}

// DELETE: Hapus produk (dideklarasikan sebagai global supaya bisa dipanggil dari onclick)
window.deleteProduct = async function(id) {
    if (!confirm('⚠️ Yakin ingin menghapus produk ini? Aksi ini tidak bisa dibatalkan.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Gagal hapus: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.isDeleted === true) {
            products = products.filter(p => p.id != id);
            renderProducts();
            updateProductCount();
            showTemporaryMessage('🗑️ Produk berhasil dihapus!', 'success');
        } else {
            throw new Error('Server tidak mengkonfirmasi penghapusan');
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        showError('Gagal menghapus produk. Silakan coba lagi.');
    }
};

// Edit produk (isi form)
window.editProduct = function(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;

    editIdInput.value = product.id;
    namaInput.value = product.title;
    hargaInput.value = product.price;
    
    formTitle.innerHTML = '✏️ Edit Produk';
    submitBtn.innerHTML = '🔄 Update Produk';
    cancelEditBtn.style.display = 'block';
    
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
};

// ==================== EVENT LISTENERS ====================
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nama = namaInput.value.trim();
    const harga = parseInt(hargaInput.value);
    const editId = editIdInput.value;

    if (!nama) {
        showError('Nama produk tidak boleh kosong!');
        namaInput.focus();
        return;
    }

    if (isNaN(harga) || harga <= 0) {
        showError('Harga harus berupa angka positif!');
        hargaInput.focus();
        return;
    }

    if (editId) {
        await updateProduct(parseInt(editId), nama, harga);
    } else {
        await addProduct(nama, harga);
    }
});

cancelEditBtn.addEventListener('click', () => {
    resetForm();
});

// ==================== INIT ====================
fetchProducts();