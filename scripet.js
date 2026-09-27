/* =========================================================
   SPARKROOT GALLERY
   Single Page Gallery + Favorites
========================================================= */


const DB_NAME = "SparkrootDB";
const DB_VERSION = 1;
const STORE_NAME = "posts";


let db = null;

let selectedFiles = [];

let currentViewerPost = null;
let currentViewerIndex = 0;


/* =========================================================
   ELEMENTS
========================================================= */

const imageInput =
    document.getElementById("imageInput");

const selectedPreview =
    document.getElementById("selectedPreview");

const postForm =
    document.getElementById("postForm");

const titleInput =
    document.getElementById("titleInput");

const captionInput =
    document.getElementById("captionInput");

const descriptionInput =
    document.getElementById("descriptionInput");

const savePostBtn =
    document.getElementById("savePostBtn");

const galleryGrid =
    document.getElementById("galleryGrid");

const favoritesGrid =
    document.getElementById("favoritesGrid");

const galleryEmpty =
    document.getElementById("galleryEmpty");

const favoritesEmpty =
    document.getElementById("favoritesEmpty");

const galleryCount =
    document.getElementById("galleryCount");

const favoritesCount =
    document.getElementById("favoritesCount");

const favoriteBadge =
    document.getElementById("favoriteBadge");

const gallerySection =
    document.getElementById("gallerySection");

const favoritesSection =
    document.getElementById("favoritesSection");

const galleryNavBtn =
    document.getElementById("galleryNavBtn");

const favoritesNavBtn =
    document.getElementById("favoritesNavBtn");

const viewer =
    document.getElementById("viewer");

const viewerImage =
    document.getElementById("viewerImage");

const viewerTitle =
    document.getElementById("viewerTitle");

const viewerCaption =
    document.getElementById("viewerCaption");

const viewerDescription =
    document.getElementById("viewerDescription");

const viewerCounter =
    document.getElementById("viewerCounter");

const viewerClose =
    document.getElementById("viewerClose");

const viewerPrev =
    document.getElementById("viewerPrev");

const viewerNext =
    document.getElementById("viewerNext");

const toast =
    document.getElementById("toast");


/* =========================================================
   OPEN DATABASE
========================================================= */

function openDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(DB_NAME, DB_VERSION);


        request.onupgradeneeded = function (event) {

            const database =
                event.target.result;


            if (!database.objectStoreNames.contains(STORE_NAME)) {

                database.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id"
                    }
                );

            }

        };


        request.onsuccess = function (event) {

            db = event.target.result;

            resolve(db);

        };


        request.onerror = function () {

            console.error(
                "IndexedDB error:",
                request.error
            );

            reject(request.error);

        };

    });

}


/* =========================================================
   GET ALL POSTS
========================================================= */

function getAllPosts() {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readonly"
            );


        const store =
            transaction.objectStore(
                STORE_NAME
            );


        const request =
            store.getAll();


        request.onsuccess = function () {

            const posts =
                request.result || [];


            posts.sort(
                (a, b) =>
                    b.createdAt - a.createdAt
            );


            resolve(posts);

        };


        request.onerror = function () {

            reject(request.error);

        };

    });

}


/* =========================================================
   SAVE POST
========================================================= */

function savePost(post) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                STORE_NAME
            );


        const request =
            store.put(post);


        request.onsuccess = function () {

            resolve();

        };


        request.onerror = function () {

            reject(request.error);

        };

    });

}


/* =========================================================
   DELETE POST
========================================================= */

function deletePost(id) {

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                STORE_NAME,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                STORE_NAME
            );


        const request =
            store.delete(id);


        request.onsuccess = function () {

            resolve();

        };


        request.onerror = function () {

            reject(request.error);

        };

    });

}


/* =========================================================
   FILE TO BLOB
========================================================= */

function fileToBlob(file) {

    return new Promise((resolve, reject) => {

        const reader =
            new FileReader();


        reader.onload = function () {

            resolve(
                new Blob(
                    [reader.result],
                    {
                        type: file.type
                    }
                )
            );

        };


        reader.onerror = function () {

            reject(reader.error);

        };


        reader.readAsArrayBuffer(file);

    });

}


/* =========================================================
   BLOB TO URL
========================================================= */

function blobToURL(blob) {

    if (!blob) {
        return "";
    }

    return URL.createObjectURL(blob);

}


/* =========================================================
   IMAGE INPUT
========================================================= */

imageInput.addEventListener(
    "change",
    function (event) {

        const files =
            Array.from(
                event.target.files || []
            );


        if (!files.length) {
            return;
        }


        selectedFiles.push(...files);


        renderSelectedImages();


        postForm.classList.add("show");

    }
);


/* =========================================================
   RENDER SELECTED FILES
========================================================= */

function renderSelectedImages() {

    selectedPreview.innerHTML = "";


    selectedFiles.forEach(
        (file, index) => {

            const item =
                document.createElement("div");


            item.className =
                "selected-item";


            const img =
                document.createElement("img");


            const url =
                URL.createObjectURL(file);


            img.src = url;


            img.onload = function () {

                URL.revokeObjectURL(url);

            };


            const remove =
                document.createElement("button");


            remove.className =
                "remove-selected";


            remove.type =
                "button";


            remove.innerHTML =
                "×";


            remove.addEventListener(
                "click",
                function () {

                    selectedFiles.splice(
                        index,
                        1
                    );


                    renderSelectedImages();


                    if (
                        selectedFiles.length === 0
                    ) {

                        postForm.classList.remove(
                            "show"
                        );

                    }

                }
            );


            item.appendChild(img);

            item.appendChild(remove);

            selectedPreview.appendChild(item);

        }
    );

}


/* =========================================================
   SAVE NEW POST
========================================================= */

savePostBtn.addEventListener(
    "click",
    async function () {

        if (!selectedFiles.length) {

            showToast(
                "Please select at least one image."
            );

            return;

        }


        savePostBtn.disabled = true;

        savePostBtn.textContent =
            "Saving...";


        try {

            const images = [];


            for (
                const file of selectedFiles
            ) {

                const blob =
                    await fileToBlob(file);


                images.push({
                    blob: blob,
                    name: file.name,
                    type: file.type
                });

            }


            const post = {

                id:
                    Date.now() +
                    Math.floor(
                        Math.random() * 10000
                    ),

                images: images,

                title:
                    titleInput.value.trim() ||
                    "Untitled Post",

                caption:
                    captionInput.value.trim() ||
                    "",

                description:
                    descriptionInput.value.trim() ||
                    "",

                favorite: false,

                createdAt:
                    Date.now()

            };


            await savePost(post);


            /* Clear form */

            selectedFiles = [];

            imageInput.value = "";

            titleInput.value = "";

            captionInput.value = "";

            descriptionInput.value = "";

            selectedPreview.innerHTML = "";

            postForm.classList.remove("show");


            /* Immediately refresh */

            await renderGallery();

            await updateFavoriteCount();


            /* Switch to gallery */

            showGallery();


            showToast(
                "Image added to Gallery successfully!"
            );

        }

        catch (error) {

            console.error(
                "Save error:",
                error
            );


            showToast(
                "Image save nahi ho saki. Browser storage check karein."
            );

        }

        finally {

            savePostBtn.disabled = false;

            savePostBtn.textContent =
                "Add To Gallery";

        }

    }
);


/* =========================================================
   CREATE CARD
========================================================= */

async function createCard(post) {

    const card =
        document.createElement("article");


    card.className =
        "gallery-card";


    /* Image wrapper */

    const imageWrap =
        document.createElement("div");


    imageWrap.className =
        "card-image-wrap";


    /* Main image */

    const image =
        document.createElement("img");


    if (
        post.images &&
        post.images.length
    ) {

        image.src =
            blobToURL(
                post.images[0].blob
            );

    }


    image.alt =
        post.title || "Sparkroot image";


    imageWrap.appendChild(image);


    /* Multiple image badge */

    if (
        post.images &&
        post.images.length > 1
    ) {

        const count =
            document.createElement("div");


        count.className =
            "image-count";


        count.textContent =
            `📷 ${post.images.length}`;


        imageWrap.appendChild(count);

    }


    /* Favorite button */

    const favoriteButton =
        document.createElement("button");


    favoriteButton.className =
        "favorite-button";


    if (post.favorite) {

        favoriteButton.classList.add(
            "active"
        );

    }


    favoriteButton.innerHTML =
        post.favorite
            ? "♥"
            : "♡";


    favoriteButton.title =
        "Favorite";


    favoriteButton.addEventListener(
        "click",
        async function (event) {

            event.stopPropagation();


            post.favorite =
                !post.favorite;


            try {

                await savePost(post);


                await renderGallery();

                await renderFavorites();

                await updateFavoriteCount();


            }

            catch (error) {

                console.error(error);

            }

        }
    );


    imageWrap.appendChild(
        favoriteButton
    );


    /* Open viewer */

    imageWrap.addEventListener(
        "click",
        function () {

            openViewer(post);

        }
    );


    card.appendChild(
        imageWrap
    );


    /* Card information */

    const info =
        document.createElement("div");


    info.className =
        "card-info";


    const title =
        document.createElement("div");


    title.className =
        "card-title";


    title.textContent =
        post.title || "Untitled Post";


    const caption =
        document.createElement("div");


    caption.className =
        "card-caption";


    caption.textContent =
        post.caption ||
        "No caption";


    info.appendChild(title);

    info.appendChild(caption);


    /* Actions */

    const actions =
        document.createElement("div");


    actions.className =
        "card-actions";


    /* View button */

    const viewButton =
        document.createElement("button");


    viewButton.className =
        "card-action";


    viewButton.textContent =
        "View";


    viewButton.addEventListener(
        "click",
        function () {

            openViewer(post);

        }
    );


    /* Download */

    const downloadButton =
        document.createElement("button");


    downloadButton.className =
        "card-action";


    downloadButton.textContent =
        "Download";


    downloadButton.addEventListener(
        "click",
        function () {

            downloadPost(post);

        }
    );


    /* Delete */

    const deleteButton =
        document.createElement("button");


    deleteButton.className =
        "card-action delete";


    deleteButton.textContent =
        "Delete";


    deleteButton.addEventListener(
        "click",
        async function () {

            const confirmed =
                confirm(
                    "Delete this post?"
                );


            if (!confirmed) {
                return;
            }


            try {

                await deletePost(
                    post.id
                );


                await renderGallery();

                await renderFavorites();

                await updateFavoriteCount();


                showToast(
                    "Post deleted."
                );

            }

            catch (error) {

                console.error(error);

                showToast(
                    "Could not delete post."
                );

            }

        }
    );


    actions.appendChild(viewButton);

    actions.appendChild(downloadButton);

    actions.appendChild(deleteButton);


    info.appendChild(actions);

    card.appendChild(info);


    return card;

}


/* =========================================================
   RENDER GALLERY
========================================================= */

async function renderGallery() {

    if (!db) {
        return;
    }


    galleryGrid.innerHTML = "";


    const posts =
        await getAllPosts();


    let totalImages = 0;


    posts.forEach(
        post => {

            totalImages +=
                post.images
                    ? post.images.length
                    : 0;

        }
    );


    galleryCount.textContent =
        `${totalImages} ${
            totalImages === 1
                ? "image"
                : "images"
        }`;


    if (!posts.length) {

        galleryEmpty.style.display =
            "block";

        return;

    }


    galleryEmpty.style.display =
        "none";


    for (
        const post of posts
    ) {

        const card =
            await createCard(post);


        galleryGrid.appendChild(card);

    }

}


/* =========================================================
   RENDER FAVORITES
========================================================= */

async function renderFavorites() {

    if (!db) {
        return;
    }


    favoritesGrid.innerHTML = "";


    const posts =
        await getAllPosts();


    const favorites =
        posts.filter(
            post => post.favorite
        );


    let totalImages = 0;


    favorites.forEach(
        post => {

            totalImages +=
                post.images
                    ? post.images.length
                    : 0;

        }
    );


    favoritesCount.textContent =
        `${totalImages} ${
            totalImages === 1
                ? "image"
                : "images"
        }`;


    if (!favorites.length) {

        favoritesEmpty.style.display =
            "block";

        return;

    }


    favoritesEmpty.style.display =
        "none";


    for (
        const post of favorites
    ) {

        const card =
            await createCard(post);


        favoritesGrid.appendChild(card);

    }

}


/* =========================================================
   UPDATE FAVORITE COUNT
========================================================= */

async function updateFavoriteCount() {

    const posts =
        await getAllPosts();


    const count =
        posts.filter(
            post => post.favorite
        ).length;


    favoriteBadge.textContent =
        count;

}


/* =========================================================
   NAVIGATION
========================================================= */

galleryNavBtn.addEventListener(
    "click",
    function () {

        showGallery();

    }
);


favoritesNavBtn.addEventListener(
    "click",
    function () {

        showFavorites();

    }
);


function showGallery() {

    gallerySection.classList.add(
        "active-section"
    );


    favoritesSection.classList.remove(
        "active-section"
    );


    galleryNavBtn.classList.add(
        "active"
    );


    favoritesNavBtn.classList.remove(
        "active"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function showFavorites() {

    favoritesSection.classList.add(
        "active-section"
    );


    gallerySection.classList.remove(
        "active-section"
    );


    favoritesNavBtn.classList.add(
        "active"
    );


    galleryNavBtn.classList.remove(
        "active"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   VIEWER
========================================================= */

function openViewer(post) {

    if (
        !post.images ||
        !post.images.length
    ) {
        return;
    }


    currentViewerPost =
        post;


    currentViewerIndex =
        0;


    viewer.classList.add(
        "show"
    );


    document.body.style.overflow =
        "hidden";


    updateViewer();

}


function updateViewer() {

    if (
        !currentViewerPost ||
        !currentViewerPost.images.length
    ) {
        return;
    }


    const imageData =
        currentViewerPost.images[
            currentViewerIndex
        ];


    viewerImage.src =
        blobToURL(
            imageData.blob
        );


    viewerTitle.textContent =
        currentViewerPost.title ||
        "";


    viewerCaption.textContent =
        currentViewerPost.caption ||
        "";


    viewerDescription.textContent =
        currentViewerPost.description ||
        "";


    viewerCounter.textContent =
        `${currentViewerIndex + 1} / ${
            currentViewerPost.images.length
        }`;


    if (
        currentViewerPost.images.length <= 1
    ) {

        viewerPrev.style.display =
            "none";

        viewerNext.style.display =
            "none";

    }

    else {

        viewerPrev.style.display =
            "flex";

        viewerNext.style.display =
            "flex";

    }

}


/* =========================================================
   NEXT IMAGE
========================================================= */

viewerNext.addEventListener(
    "click",
    function () {

        if (!currentViewerPost) {
            return;
        }


        currentViewerIndex++;


        if (
            currentViewerIndex >=
            currentViewerPost.images.length
        ) {

            currentViewerIndex = 0;

        }


        updateViewer();

    }
);


/* =========================================================
   PREVIOUS IMAGE
========================================================= */

viewerPrev.addEventListener(
    "click",
    function () {

        if (!currentViewerPost) {
            return;
        }


        currentViewerIndex--;


        if (currentViewerIndex < 0) {

            currentViewerIndex =
                currentViewerPost.images.length - 1;

        }


        updateViewer();

    }
);


/* =========================================================
   CLOSE VIEWER
========================================================= */

viewerClose.addEventListener(
    "click",
    closeViewer
);


viewer.addEventListener(
    "click",
    function (event) {

        if (
            event.target.classList.contains(
                "viewer-overlay"
            )
        ) {

            closeViewer();

        }

    }
);


function closeViewer() {

    viewer.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";


    viewerImage.src =
        "";


    currentViewerPost =
        null;

}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            !viewer.classList.contains(
                "show"
            )
        ) {
            return;
        }


        if (
            event.key === "Escape"
        ) {

            closeViewer();

        }


        if (
            event.key === "ArrowRight"
        ) {

            viewerNext.click();

        }


        if (
            event.key === "ArrowLeft"
        ) {

            viewerPrev.click();

        }

    }
);


/* =========================================================
   DOWNLOAD
========================================================= */

async function downloadPost(post) {

    if (
        !post.images ||
        !post.images.length
    ) {

        showToast(
            "No image available."
        );

        return;

    }


    const choice =
        prompt(
            "Download option:\n\n" +
            "1 = Image(s)\n" +
            "2 = Caption\n" +
            "3 = Image(s) + Caption"
        );


    if (!choice) {
        return;
    }


    if (
        choice === "1" ||
        choice === "3"
    ) {

        for (
            let i = 0;
            i < post.images.length;
            i++
        ) {

            const imageData =
                post.images[i];


            const url =
                URL.createObjectURL(
                    imageData.blob
                );


            const link =
                document.createElement("a");


            link.href =
                url;


            const extension =
                getExtension(
                    imageData.name ||
                    imageData.type
                );


            link.download =
                `${safeFileName(
                    post.title
                )}-${i + 1}.${extension}`;


            document.body.appendChild(link);


            link.click();


            link.remove();


            setTimeout(
                () => URL.revokeObjectURL(url),
                1000
            );


            await sleep(150);

        }

    }


    if (
        choice === "2" ||
        choice === "3"
    ) {

        const text =
            [
                `Title: ${
                    post.title || ""
                }`,

                `Caption: ${
                    post.caption || ""
                }`,

                "",

                `Description: ${
                    post.description || ""
                }`
            ].join("\n");


        const blob =
            new Blob(
                [text],
                {
                    type: "text/plain"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href =
            url;


        link.download =
            `${safeFileName(
                post.title
            )}-caption.txt`;


        document.body.appendChild(link);


        link.click();


        link.remove();


        setTimeout(
            () => URL.revokeObjectURL(url),
            1000
        );

    }


    showToast(
        "Download started."
    );

}


/* =========================================================
   HELPERS
========================================================= */

function safeFileName(name) {

    return (
        name ||
        "sparkroot-image"
    )
        .replace(
            /[^a-z0-9-_]/gi,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        )
        .toLowerCase();

}


function getExtension(value) {

    if (!value) {
        return "jpg";
    }


    if (
        value.includes("/")
    ) {

        const type =
            value.split("/")[1];


        if (
            type === "jpeg"
        ) {
            return "jpg";
        }


        return type || "jpg";

    }


    if (
        value.includes(".")
    ) {

        return value
            .split(".")
            .pop()
            .toLowerCase();

    }


    return "jpg";

}


function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer;


function showToast(message) {

    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =========================================================
   START APP
========================================================= */

async function startApp() {

    try {

        await openDatabase();


        await renderGallery();

        await renderFavorites();

        await updateFavoriteCount();


        showGallery();

    }

    catch (error) {

        console.error(
            "Application startup error:",
            error
        );


        showToast(
            "Gallery start nahi ho saki. Browser mein IndexedDB enable karein."
        );

    }

}


startApp();