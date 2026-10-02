/* =========================================================
   SPARKROOT — PREMIUM PRODUCT GALLERY
   SCRIPT.JS
   ========================================================= */

"use strict";


/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY = "sparkroot_products_v2";

let products = [];
let editingProductId = null;

let selectedImages = [];

let currentFilter = "All";

let viewerImages = [];
let viewerIndex = 0;

let toastTimer = null;


/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const productModal = $("#productModal");
const productForm = $("#productForm");

const productImagesInput = $("#productImages");
const imagePreview = $("#imagePreview");

const productName = $("#productName");
const productPrice = $("#productPrice");
const productStock = $("#productStock");
const productCategory = $("#productCategory");
const productSize = $("#productSize");
const productColor = $("#productColor");
const productDescription = $("#productDescription");

const modalTitle = $("#modalTitle");

const homeProductGrid = $("#homeProductGrid");
const galleryProductGrid = $("#galleryProductGrid");
const favoriteProductGrid = $("#favoriteProductGrid");

const homeEmptyState = $("#homeEmptyState");
const galleryEmptyState = $("#galleryEmptyState");
const favoriteEmptyState = $("#favoriteEmptyState");

const totalProducts = $("#totalProducts");
const totalFavorites = $("#totalFavorites");
const totalStock = $("#totalStock");

const searchInput = $("#searchInput");
const clearSearch = $("#clearSearch");

const mobileMenu = $("#mobileMenu");

const imageViewer = $("#imageViewer");
const viewerImage = $("#viewerImage");
const viewerCounter = $("#viewerCounter");

const detailsModal = $("#detailsModal");
const productDetailsContent = $("#productDetailsContent");

const toast = $("#toast");


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", init);


function init() {

    loadProducts();

    setupNavigation();

    setupMainButtons();

    setupProductForm();

    setupImageUpload();

    setupSearch();

    setupFilters();

    setupModalClosing();

    setupViewer();

    renderEverything();

}


/* =========================================================
   LOAD / SAVE
   ========================================================= */

function loadProducts() {

    try {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            products = [];
            return;
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            products = [];
            return;
        }

        products = parsed.map(normalizeProduct);

    } catch (error) {

        console.error("Could not load products:", error);

        products = [];

        showToast("Saved product data could not be loaded.");

    }

}


function saveProducts() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(products)
        );

        return true;

    } catch (error) {

        console.error("Could not save products:", error);

        showToast(
            "Storage is full. Try using smaller images."
        );

        return false;
    }

}


/* =========================================================
   NORMALIZE PRODUCT
   ========================================================= */

function normalizeProduct(product) {

    return {
        id: product.id || createId(),

        name: String(product.name || ""),

        price: Number(product.price) || 0,

        stock: Number.isInteger(Number(product.stock))
            ? Number(product.stock)
            : 0,

        category: String(product.category || "Other"),

        size: String(product.size || ""),

        color: String(product.color || ""),

        description: String(product.description || ""),

        images: Array.isArray(product.images)
            ? product.images.filter(Boolean)
            : [],

        favorite: Boolean(product.favorite),

        createdAt: product.createdAt || Date.now()
    };

}


/* =========================================================
   ID
   ========================================================= */

function createId() {

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 9)
    );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    $$("[data-page]").forEach((button) => {

        button.addEventListener("click", (event) => {

            event.preventDefault();

            const page = button.dataset.page;

            if (!page) return;

            showPage(page);

            if (mobileMenu) {
                mobileMenu.classList.remove("open");
            }

        });

    });


    if ($("#mobileMenuBtn")) {

        $("#mobileMenuBtn").addEventListener("click", () => {

            mobileMenu.classList.toggle("open");

        });

    }

}


function showPage(pageName) {

    const pages = {
        home: $("#homePage"),
        gallery: $("#galleryPage"),
        favorites: $("#favoritesPage")
    };


    Object.values(pages).forEach((page) => {

        if (page) {
            page.classList.remove("active-page");
        }

    });


    const targetPage = pages[pageName] || pages.home;

    targetPage.classList.add("active-page");


    $$(".nav-link").forEach((link) => {

        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );

    });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    renderEverything();

}


/* =========================================================
   MAIN BUTTONS
   ========================================================= */

function setupMainButtons() {


    const openGalleryBtn = $("#openGalleryBtn");

    if (openGalleryBtn) {

        openGalleryBtn.addEventListener("click", () => {

            showPage("gallery");

        });

    }


    const viewAllBtn = $("#viewAllBtn");

    if (viewAllBtn) {

        viewAllBtn.addEventListener("click", () => {

            showPage("gallery");

        });

    }


    const addButtons = [
        "#addProductBtn",
        "#galleryAddProductBtn",
        "#emptyAddProductBtn",
        "#galleryEmptyAddBtn"
    ];


    addButtons.forEach((selector) => {

        const button = $(selector);

        if (button) {

            button.addEventListener("click", () => {

                openAddProductModal();

            });

        }

    });


    const favoriteGoGalleryBtn =
        $("#favoriteGoGalleryBtn");

    if (favoriteGoGalleryBtn) {

        favoriteGoGalleryBtn.addEventListener(
            "click",
            () => showPage("gallery")
        );

    }

}


/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function openAddProductModal() {

    editingProductId = null;

    selectedImages = [];

    productForm.reset();

    if (productImagesInput) {
        productImagesInput.value = "";
    }

    modalTitle.textContent = "Add Product";

    renderImagePreview();

    openModal(productModal);

}


function openEditProductModal(id) {

    const product = products.find(
        (item) => item.id === id
    );

    if (!product) {
        showToast("Product not found.");
        return;
    }


    editingProductId = id;

    selectedImages = [...product.images];


    productName.value = product.name;
    productPrice.value = product.price;
    productStock.value = product.stock;
    productCategory.value = product.category;
    productSize.value = product.size;
    productColor.value = product.color;
    productDescription.value = product.description;


    if (productImagesInput) {
        productImagesInput.value = "";
    }


    modalTitle.textContent = "Edit Product";

    renderImagePreview();

    openModal(productModal);

}


function closeProductModal() {

    closeModal(productModal);

    editingProductId = null;

    selectedImages = [];

    productForm.reset();

    if (productImagesInput) {
        productImagesInput.value = "";
    }

    renderImagePreview();

}


/* =========================================================
   GENERIC MODAL
   ========================================================= */

function openModal(modal) {

    if (!modal) return;

    modal.classList.add("open");

    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

}


function closeModal(modal) {

    if (!modal) return;

    modal.classList.remove("open");

    modal.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".modal.open") &&
        !imageViewer.classList.contains("open")) {

        document.body.style.overflow = "";

    }

}


/* =========================================================
   MODAL CLOSING
   ========================================================= */

function setupModalClosing() {

    const closeProduct =
        $("#closeProductModal");

    if (closeProduct) {

        closeProduct.addEventListener(
            "click",
            closeProductModal
        );

    }


    const cancelProduct =
        $("#cancelProductBtn");

    if (cancelProduct) {

        cancelProduct.addEventListener(
            "click",
            closeProductModal
        );

    }


    $$("[data-close-modal]").forEach((element) => {

        element.addEventListener(
            "click",
            closeProductModal
        );

    });


    const closeDetails =
        $("#closeDetailsModal");

    if (closeDetails) {

        closeDetails.addEventListener(
            "click",
            closeDetailsModal
        );

    }


    $$("[data-close-details]").forEach((element) => {

        element.addEventListener(
            "click",
            closeDetailsModal
        );

    });


    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            closeProductModal();

            closeDetailsModal();

            closeImageViewer();

        }

    });

}


function closeDetailsModal() {

    closeModal(detailsModal);

}


/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

function setupImageUpload() {

    if (!productImagesInput) return;


    productImagesInput.addEventListener(
        "change",
        handleImageSelection
    );

}


async function handleImageSelection(event) {

    const files = Array.from(
        event.target.files || []
    );


    if (!files.length) return;


    const validFiles = files.filter((file) => {

        return file.type.startsWith("image/");

    });


    if (!validFiles.length) {

        showToast("Please select image files only.");

        productImagesInput.value = "";

        return;

    }


    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    const largeFiles = validFiles.filter(
        (file) => file.size > MAX_FILE_SIZE
    );


    if (largeFiles.length) {

        showToast(
            "Some images are larger than 5MB and were skipped."
        );

    }


    const usableFiles = validFiles.filter(
        (file) => file.size <= MAX_FILE_SIZE
    );


    if (!usableFiles.length) {

        productImagesInput.value = "";

        return;

    }


    showToast("Processing images...");


    try {

        for (const file of usableFiles) {

            const dataUrl = await readImageAsDataURL(file);

            const optimizedImage =
                await optimizeImage(dataUrl);

            selectedImages.push(optimizedImage);

        }

        renderImagePreview();

        showToast(
            `${usableFiles.length} image${
                usableFiles.length > 1 ? "s" : ""
            } added.`
        );

    } catch (error) {

        console.error(
            "Image processing failed:",
            error
        );

        showToast(
            "Could not process one or more images."
        );

    }


    /*
       Important:
       Resetting the file input allows the SAME image
       to be selected again later if needed.
    */

    productImagesInput.value = "";

}


/* =========================================================
   READ IMAGE
   ========================================================= */

function readImageAsDataURL(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();


        reader.onload = () => {

            resolve(reader.result);

        };


        reader.onerror = () => {

            reject(
                new Error("File could not be read.")
            );

        };


        reader.readAsDataURL(file);

    });

}


/* =========================================================
   OPTIMIZE IMAGE
   ========================================================= */

function optimizeImage(dataUrl) {

    return new Promise((resolve) => {

        const img = new Image();


        img.onload = () => {

            const MAX_WIDTH = 1600;
            const MAX_HEIGHT = 1600;

            let width = img.naturalWidth;
            let height = img.naturalHeight;


            if (
                width > MAX_WIDTH ||
                height > MAX_HEIGHT
            ) {

                const ratio = Math.min(
                    MAX_WIDTH / width,
                    MAX_HEIGHT / height
                );

                width = Math.round(width * ratio);
                height = Math.round(height * ratio);

            }


            const canvas =
                document.createElement("canvas");

            canvas.width = width;
            canvas.height = height;


            const context =
                canvas.getContext("2d");


            context.drawImage(
                img,
                0,
                0,
                width,
                height
            );


            /*
               JPEG greatly reduces localStorage usage.
            */

            resolve(
                canvas.toDataURL(
                    "image/jpeg",
                    0.88
                )
            );

        };


        img.onerror = () => {

            /*
               If optimization fails,
               keep original image.
            */

            resolve(dataUrl);

        };


        img.src = dataUrl;

    });

}


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

function renderImagePreview() {

    if (!imagePreview) return;


    imagePreview.innerHTML = "";


    selectedImages.forEach((image, index) => {

        const item =
            document.createElement("div");

        item.className = "preview-item";


        const img =
            document.createElement("img");

        img.src = image;

        img.alt = `Product image ${index + 1}`;

        img.loading = "lazy";


        const remove =
            document.createElement("button");

        remove.type = "button";

        remove.className = "preview-remove";

        remove.textContent = "×";

        remove.setAttribute(
            "aria-label",
            "Remove image"
        );


        remove.addEventListener("click", () => {

            selectedImages.splice(index, 1);

            renderImagePreview();

        });


        item.appendChild(img);

        item.appendChild(remove);

        imagePreview.appendChild(item);

    });

}


/* =========================================================
   PRODUCT FORM
   ========================================================= */

function setupProductForm() {

    if (!productForm) return;


    productForm.addEventListener(
        "submit",
        handleProductSubmit
    );

}


function handleProductSubmit(event) {

    event.preventDefault();


    const name =
        productName.value.trim();

    const price =
        Number(productPrice.value);

    const stock =
        Number(productStock.value);

    const category =
        productCategory.value;

    const size =
        productSize.value.trim();

    const color =
        productColor.value.trim();

    const description =
        productDescription.value.trim();


    /* ---------------- VALIDATION ---------------- */

    if (!name) {

        showToast("Please enter product name.");

        productName.focus();

        return;

    }


    if (
        !Number.isFinite(price) ||
        price < 0
    ) {

        showToast("Please enter a valid price.");

        productPrice.focus();

        return;

    }


    if (
        !Number.isInteger(stock) ||
        stock < 0
    ) {

        showToast(
            "Stock must be a whole number."
        );

        productStock.focus();

        return;

    }


    if (!category) {

        showToast("Please select a category.");

        productCategory.focus();

        return;

    }


    if (
        selectedImages.length === 0 &&
        !editingProductId
    ) {

        showToast(
            "Please upload at least one image."
        );

        return;

    }


    /* ---------------- EDIT ---------------- */

    if (editingProductId) {

        const index = products.findIndex(
            (item) => item.id === editingProductId
        );


        if (index === -1) {

            showToast("Product could not be found.");

            return;

        }


        products[index] = {

            ...products[index],

            name,
            price,
            stock,
            category,
            size,
            color,
            description,

            images: [...selectedImages]

        };


        if (!saveProducts()) {
            return;
        }


        closeProductModal();

        renderEverything();

        showToast("Product updated successfully.");

        return;

    }


    /* ---------------- NEW PRODUCT ---------------- */

    const newProduct = {

        id: createId(),

        name,

        price,

        stock,

        category,

        size,

        color,

        description,

        images: [...selectedImages],

        favorite: false,

        createdAt: Date.now()

    };


    products.unshift(newProduct);


    if (!saveProducts()) {

        products.shift();

        return;

    }


    closeProductModal();

    renderEverything();

    showPage("gallery");

    showToast("Product added successfully.");

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    if (!searchInput) return;


    searchInput.addEventListener(
        "input",
        handleSearch
    );


    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            () => {

                searchInput.value = "";

                handleSearch();

                searchInput.focus();

            }
        );

    }

}


function handleSearch() {

    const value =
        searchInput.value.trim();

    if (clearSearch) {

        clearSearch.classList.toggle(
            "visible",
            value.length > 0
        );

    }


    if (value.length > 0) {

        showPage("gallery");

    }


    renderEverything();

}


/* =========================================================
   FILTERS
   ========================================================= */

function setupFilters() {

    $$(".filter-btn").forEach((button) => {

        button.addEventListener("click", () => {

            currentFilter =
                button.dataset.filter || "All";


            $$(".filter-btn").forEach((item) => {

                item.classList.toggle(
                    "active",
                    item === button
                );

            });


            renderGallery();

        });

    });


    $$(".category-card").forEach((button) => {

        button.addEventListener("click", () => {

            currentFilter =
                button.dataset.category || "All";


            showPage("gallery");


            $$(".filter-btn").forEach((item) => {

                item.classList.toggle(
                    "active",
                    item.dataset.filter === currentFilter
                );

            });


            renderGallery();

        });

    });

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderEverything() {

    renderStats();

    renderHome();

    renderGallery();

    renderFavorites();

}


/* =========================================================
   STATS
   ========================================================= */

function renderStats() {

    const favoriteCount =
        products.filter(
            (product) => product.favorite
        ).length;


    const stockTotal =
        products.reduce(
            (total, product) =>
                total + Number(product.stock || 0),
            0
        );


    if (totalProducts) {
        totalProducts.textContent =
            products.length;
    }


    if (totalFavorites) {
        totalFavorites.textContent =
            favoriteCount;
    }


    if (totalStock) {
        totalStock.textContent =
            stockTotal;
    }

}


/* =========================================================
   HOME
   ========================================================= */

function renderHome() {

    if (!homeProductGrid) return;


    const latestProducts = [...products]

        .sort(
            (a, b) =>
                Number(b.createdAt) -
                Number(a.createdAt)
        )

        .slice(0, 8);


    homeProductGrid.innerHTML = "";


    latestProducts.forEach((product) => {

        homeProductGrid.appendChild(
            createProductCard(product)
        );

    });


    toggleEmptyState(
        homeEmptyState,
        latestProducts.length === 0
    );

}


/* =========================================================
   GALLERY
   ========================================================= */

function renderGallery() {

    if (!galleryProductGrid) return;


    const searchTerm =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";


    let filtered = [...products];


    /* CATEGORY */

    if (currentFilter !== "All") {

        filtered = filtered.filter(
            (product) =>
                product.category === currentFilter
        );

    }


    /* SEARCH */

    if (searchTerm) {

        filtered = filtered.filter(
            (product) =>
                product.name
                    .toLowerCase()
                    .includes(searchTerm)
        );

    }


    galleryProductGrid.innerHTML = "";


    filtered.forEach((product) => {

        galleryProductGrid.appendChild(
            createProductCard(product)
        );

    });


    toggleEmptyState(
        galleryEmptyState,
        filtered.length === 0
    );

}


/* =========================================================
   FAVORITES
   ========================================================= */

function renderFavorites() {

    if (!favoriteProductGrid) return;


    const favorites = products.filter(
        (product) => product.favorite
    );


    favoriteProductGrid.innerHTML = "";


    favorites.forEach((product) => {

        favoriteProductGrid.appendChild(
            createProductCard(product)
        );

    });


    toggleEmptyState(
        favoriteEmptyState,
        favorites.length === 0
    );

}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function toggleEmptyState(element, show) {

    if (!element) return;

    element.classList.toggle(
        "visible",
        show
    );

}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

function createProductCard(product) {

    const card =
        document.createElement("article");

    card.className = "product-card";


    /* ---------------- IMAGE AREA ---------------- */

    const imageWrap =
        document.createElement("div");

    imageWrap.className =
        "product-image-wrap";


    const image =
        document.createElement("img");

    image.className =
        "product-image";

    image.alt =
        product.name || "Product";

    image.loading = "lazy";


    const firstImage =
        product.images?.[0];


    if (firstImage) {

        image.src = firstImage;

    } else {

        image.src = createPlaceholderImage();

    }


    image.addEventListener("click", () => {

        if (product.images.length) {

            openImageViewer(
                product.images,
                0
            );

        } else {

            openDetailsModal(product.id);

        }

    });


    /* ---------------- CATEGORY ---------------- */

    const category =
        document.createElement("span");

    category.className =
        "product-category";

    category.textContent =
        product.category || "Other";


    /* ---------------- FAVORITE ---------------- */

    const favorite =
        document.createElement("button");

    favorite.type = "button";

    favorite.className =
        "favorite-btn";

    favorite.classList.toggle(
        "is-favorite",
        product.favorite
    );

    favorite.innerHTML =
        product.favorite ? "♥" : "♡";

    favorite.setAttribute(
        "aria-label",
        product.favorite
            ? "Remove from favorites"
            : "Add to favorites"
    );


    favorite.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            toggleFavorite(product.id);

        }
    );


    imageWrap.appendChild(image);

    imageWrap.appendChild(category);

    imageWrap.appendChild(favorite);


    /* ---------------- INFO ---------------- */

    const info =
        document.createElement("div");

    info.className =
        "product-info";


    const title =
        document.createElement("h3");

    title.className =
        "product-title";

    title.textContent =
        product.name || "Unnamed Product";


    const description =
        document.createElement("p");

    description.className =
        "product-description";

    description.textContent =
        product.description ||
        "No product description available.";


    const meta =
        document.createElement("div");

    meta.className =
        "product-meta";


    const price =
        document.createElement("strong");

    price.className =
        "product-price";

    price.textContent =
        formatPrice(product.price);


    const stock =
        document.createElement("span");

    stock.className =
        "product-stock";

    stock.textContent =
        `Stock: ${product.stock}`;


    meta.appendChild(price);

    meta.appendChild(stock);


    /* ---------------- ACTIONS ---------------- */

    const actions =
        document.createElement("div");

    actions.className =
        "product-actions";


    const viewButton =
        createActionButton(
            "View",
            () => openDetailsModal(product.id)
        );


    const editButton =
        createActionButton(
            "Edit",
            () => openEditProductModal(product.id)
        );


    const deleteButton =
        createActionButton(
            "Delete",
            () => deleteProduct(product.id)
        );


    deleteButton.classList.add("delete");


    actions.appendChild(viewButton);

    actions.appendChild(editButton);

    actions.appendChild(deleteButton);


    info.appendChild(title);

    info.appendChild(description);

    info.appendChild(meta);

    info.appendChild(actions);


    card.appendChild(imageWrap);

    card.appendChild(info);


    return card;

}


/* =========================================================
   ACTION BUTTON
   ========================================================= */

function createActionButton(text, callback) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "product-action";

    button.textContent = text;


    button.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            callback();

        }
    );


    return button;

}


/* =========================================================
   FAVORITE
   ========================================================= */

function toggleFavorite(id) {

    const product =
        products.find(
            (item) => item.id === id
        );


    if (!product) return;


    product.favorite =
        !product.favorite;


    if (!saveProducts()) {

        product.favorite =
            !product.favorite;

        return;

    }


    renderEverything();


    showToast(
        product.favorite
            ? "Added to favorites."
            : "Removed from favorites."
    );

}


/* =========================================================
   DELETE
   ========================================================= */

function deleteProduct(id) {

    const product =
        products.find(
            (item) => item.id === id
        );


    if (!product) return;


    const confirmed =
        window.confirm(
            `Delete "${product.name}"?`
        );


    if (!confirmed) return;


    const oldProducts =
        [...products];


    products =
        products.filter(
            (item) => item.id !== id
        );


    if (!saveProducts()) {

        products = oldProducts;

        return;

    }


    renderEverything();

    showToast("Product deleted.");

}


/* =========================================================
   DETAILS MODAL
   ========================================================= */

function openDetailsModal(id) {

    const product =
        products.find(
            (item) => item.id === id
        );


    if (!product) {

        showToast("Product not found.");

        return;

    }


    productDetailsContent.innerHTML = "";


    const wrapper =
        document.createElement("div");

    wrapper.className =
        "details-content";


    /* IMAGE */

    const image =
        document.createElement("img");

    image.className =
        "details-image";

    image.alt =
        product.name;


    if (product.images.length) {

        image.src =
            product.images[0];


        image.addEventListener(
            "click",
            () => openImageViewer(
                product.images,
                0
            )
        );


        image.style.cursor = "zoom-in";

    } else {

        image.src =
            createPlaceholderImage();

    }


    /* INFO */

    const info =
        document.createElement("div");

    info.className =
        "details-info";


    const title =
        document.createElement("h2");

    title.textContent =
        product.name;


    const price =
        document.createElement("div");

    price.className =
        "details-price";

    price.textContent =
        formatPrice(product.price);


    const list =
        document.createElement("div");

    list.className =
        "details-list";


    addDetailItem(
        list,
        "Category",
        product.category
    );


    addDetailItem(
        list,
        "Stock",
        String(product.stock)
    );


    addDetailItem(
        list,
        "Size",
        product.size || "Not specified"
    );


    addDetailItem(
        list,
        "Color",
        product.color || "Not specified"
    );


    const description =
        document.createElement("p");

    description.className =
        "details-description";

    description.textContent =
        product.description ||
        "No description available.";


    info.appendChild(title);

    info.appendChild(price);

    info.appendChild(list);

    info.appendChild(description);


    wrapper.appendChild(image);

    wrapper.appendChild(info);


    productDetailsContent.appendChild(
        wrapper
    );


    openModal(detailsModal);

}


function addDetailItem(parent, label, value) {

    const item =
        document.createElement("div");

    item.className =
        "detail-item";


    const labelElement =
        document.createElement("span");

    labelElement.textContent =
        label;


    const valueElement =
        document.createElement("strong");

    valueElement.textContent =
        value;


    item.appendChild(labelElement);

    item.appendChild(valueElement);

    parent.appendChild(item);

}


/* =========================================================
   IMAGE VIEWER
   ========================================================= */

function setupViewer() {

    if (!imageViewer) return;


    const closeButton =
        $("#viewerClose");

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeImageViewer
        );

    }


    const previous =
        $("#viewerPrev");

    if (previous) {

        previous.addEventListener(
            "click",
            showPreviousImage
        );

    }


    const next =
        $("#viewerNext");

    if (next) {

        next.addEventListener(
            "click",
            showNextImage
        );

    }


    imageViewer.addEventListener(
        "click",
        (event) => {

            if (
                event.target === imageViewer
            ) {

                closeImageViewer();

            }

        }
    );


    document.addEventListener(
        "keydown",
        (event) => {

            if (
                !imageViewer.classList.contains("open")
            ) {
                return;
            }


            if (event.key === "ArrowLeft") {

                showPreviousImage();

            }


            if (event.key === "ArrowRight") {

                showNextImage();

            }

        }
    );

}


function openImageViewer(images, startIndex = 0) {

    if (!Array.isArray(images) ||
        images.length === 0) {

        return;

    }


    viewerImages = images;

    viewerIndex =
        Math.max(
            0,
            Math.min(
                startIndex,
                images.length - 1
            )
        );


    updateViewer();


    imageViewer.classList.add("open");

    imageViewer.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";

}


function updateViewer() {

    if (!viewerImages.length) return;


    viewerImage.src =
        viewerImages[viewerIndex];


    viewerCounter.textContent =
        `${viewerIndex + 1} / ${viewerImages.length}`;


    const previous =
        $("#viewerPrev");

    const next =
        $("#viewerNext");


    const multiple =
        viewerImages.length > 1;


    if (previous) {

        previous.style.display =
            multiple ? "flex" : "none";

    }


    if (next) {

        next.style.display =
            multiple ? "flex" : "none";

    }

}


function showPreviousImage() {

    if (viewerImages.length <= 1) return;


    viewerIndex =
        (
            viewerIndex -
            1 +
            viewerImages.length
        ) %
        viewerImages.length;


    updateViewer();

}


function showNextImage() {

    if (viewerImages.length <= 1) return;


    viewerIndex =
        (
            viewerIndex +
            1
        ) %
        viewerImages.length;


    updateViewer();

}


function closeImageViewer() {

    if (!imageViewer) return;


    imageViewer.classList.remove("open");

    imageViewer.setAttribute(
        "aria-hidden",
        "true"
    );


    viewerImage.src = "";

    viewerImages = [];

    viewerIndex = 0;


    if (!document.querySelector(".modal.open")) {

        document.body.style.overflow = "";

    }

}


/* =========================================================
   PRICE
   ========================================================= */

function formatPrice(value) {

    const number =
        Number(value) || 0;


    return (
        "Rs. " +
        number.toLocaleString(
            "en-PK",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )
    );

}


/* =========================================================
   PLACEHOLDER IMAGE
   ========================================================= */

function createPlaceholderImage() {

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="800"
            height="600"
            viewBox="0 0 800 600"
        >
            <rect
                width="800"
                height="600"
                fill="#111111"
            />

            <circle
                cx="400"
                cy="260"
                r="100"
                fill="#1d1d1d"
            />

            <text
                x="400"
                y="420"
                text-anchor="middle"
                fill="#777777"
                font-family="Arial"
                font-size="28"
            >
                SparkRoot
            </text>
        </svg>
    `;


    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

    if (!toast) return;


    clearTimeout(toastTimer);


    toast.textContent =
        message;


    toast.classList.add("show");


    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2600);

}