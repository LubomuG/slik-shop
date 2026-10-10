$(function () {

    const API_URL = '/api/products';
    const PARTNERS_API_URL = '/api/partners';
    const FEEDBACK_API_URL = '/api/feedback';

    function normalizeProduct(p) {
        return {
            id: p.id,
            title: p.name || '',
            description: p.description || '',
            price: parseFloat(p.price) || 0,
            image: p.photo || './img/bigWhiteShoe.png',
            inStock: p.inStock !== false
        };
    }

    function normalizePartner(p) {
        return {
            id: p.id,
            name: p.name || '',
            photo: p.photo || '',
            status: p.status || 'active'
        };
    }

    function normalizeFeedback(f) {
        return {
            id: f.id,
            name: f.name || 'Анонім',
            rating: parseInt(f.rating, 10) || 5,
            text: f.text || ''
        };
    }

    const TREND_NAMES = [
        { name: 'Running canvas shoes', price: 2999 },
        { name: 'Running casual shoes', price: 2999 },
        { name: 'Casual nike shoes', price: 2999 },
        { name: 'Sport running shoes', price: 2999 },
        { name: 'Trail hiking shoes', price: 2999 },
        { name: 'Street style shoes', price: 2999 }
    ];

    let allProducts = [];
    let cart = [];

    let catalogPage = 0;
    let catalogPageSize = 6;

    let reviewsData = [];
    let reviewsPage = 0;
    let reviewsPerPage = 2;

    const $burgerBtn = $('#burgerBtn');
    const $mobileNav = $('#mobileNav');

    $burgerBtn.on('click', function () {
        $mobileNav.toggleClass('is-open');
    });

    $mobileNav.on('click', '.mobile-nav__link', function () {
        $mobileNav.removeClass('is-open');
    });

    const $cartBtn = $('#cartBtn');
    const $cartOverlay = $('#cartOverlay');
    const $cartPopup = $('#cartPopup');
    const $cartClose = $('#cartClose');
    const $cartItemsWrap = $('#cartItems');
    const $cartCountEl = $('#cartCount');
    const $cartTotalEl = $('#cartTotal');

    function openCart() {
        $cartOverlay.addClass('is-open');
        $cartPopup.addClass('is-open');
    }

    function closeCart() {
        $cartOverlay.removeClass('is-open');
        $cartPopup.removeClass('is-open');
    }

    $cartBtn.on('click', openCart);
    $cartClose.on('click', closeCart);
    $cartOverlay.on('click', closeCart);

    function addToCart(product) {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push(Object.assign({}, product, { qty: 1 }));
        }
        renderCart();
        openCart();
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        renderCart();
    }

    function renderCart() {
        const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
        $cartCountEl.text(totalCount);

        if (cart.length === 0) {
            $cartItemsWrap.html('<p class="cart-empty">Кошик порожній</p>');
            $cartTotalEl.text('$0.00');
            return;
        }

        let total = 0;
        const html = cart.map((item, index) => {
            total += item.price * item.qty;
            const qtyLabel = item.qty > 1 ? ` x${item.qty}` : '';
            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="cart-item__info">
                        <p class="cart-item__name">${item.title}${qtyLabel}</p>
                        <p class="cart-item__price">$${item.price.toFixed(2)}</p>
                    </div>
                    <button class="cart-item__remove" data-index="${index}">&times;</button>
                </div>
            `;
        }).join('');

        $cartItemsWrap.html(html);
        $cartTotalEl.text('$' + total.toFixed(2));

        $cartItemsWrap.find('.cart-item__remove').on('click', function () {
            removeFromCart(Number($(this).data('index')));
        });
    }

    function renderBrands(partners) {
        const activeLogos = (partners || [])
            .filter(p => p.status === 'active' && p.photo)
            .map(p => ({ src: p.photo, name: p.name || '' }));

        if (!activeLogos.length) {
            $('.brands').hide();
            return;
        }

        $('.brands').show();
        const doubled = activeLogos.concat(activeLogos);
        const html = doubled.map(logo => `
            <div class="brand-item">
                <img class="brand-logo" src="${logo.src}" alt="${logo.name}">
                <span class="brand-name">${logo.name}</span>
            </div>
        `).join('');
        $('#brandsTrack').html(html);
    }

    function pickRandom(arr, count) {
        const copy = arr.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy.slice(0, count);
    }

    function renderTrending() {
        const images = pickRandom(allProducts, TREND_NAMES.length);
        const html = TREND_NAMES.map((item, i) => {
            const img = images[i] ? images[i].image : './img/bigWhiteShoe.png';
            return `
                <div class="trend-card">
                    <img src="${img}" alt="${item.name}">
                    <p class="trend-card__name">${item.name}</p>
                    <div class="trend-card__row">
                        <span>Rs. ${item.price.toFixed(2)}</span>
                        <span class="mini-arrow">&#8599;</span>
                    </div>
                </div>
            `;
        }).join('');
        $('#trendingTrack').html(html);
    }

    const TREND_SCROLL_STEP = 260;

    $('#trendPrev').on('click', function () {
        $('#trendingTrack').animate({ scrollLeft: '-=' + TREND_SCROLL_STEP }, 300);
    });
    $('#trendNext').on('click', function () {
        $('#trendingTrack').animate({ scrollLeft: '+=' + TREND_SCROLL_STEP }, 300);
    });

    function renderPromoThumbs() {
        const images = pickRandom(allProducts, 3);
        const html = images.map((p, i) => {
            const activeClass = i === 0 ? ' promo__thumb--active' : '';
            return `<img src="${p.image}" alt="thumb ${i + 1}" class="promo__thumb${activeClass}">`;
        }).join('');
        $('#promoThumbs').html(html);
        buildPromoDots();
    }

    let promoIndex = 0;

    function buildPromoDots() {
        const $thumbs = $('#promoThumbs .promo__thumb');
        const $dotsWrap = $('#promoDots');
        $dotsWrap.empty();

        $thumbs.each(function (i) {
            const $dot = $('<span class="dot"></span>');
            if (i === 0) $dot.addClass('dot--active');
            $dot.on('click', () => setPromoIndex(i));
            $dotsWrap.append($dot);
        });

        $thumbs.on('click', function () {
            setPromoIndex($thumbs.index(this));
        });
    }

    function setPromoIndex(i) {
        promoIndex = i;
        const $thumbs = $('#promoThumbs .promo__thumb');
        const $dots = $('#promoDots .dot');

        $thumbs.removeClass('promo__thumb--active').eq(i).addClass('promo__thumb--active');
        $dots.removeClass('dot--active').eq(i).addClass('dot--active');
    }

    $('#promoPrev').on('click', function () {
        const count = $('#promoThumbs .promo__thumb').length;
        if (!count) return;
        setPromoIndex((promoIndex - 1 + count) % count);
    });
    $('#promoNext').on('click', function () {
        const count = $('#promoThumbs .promo__thumb').length;
        if (!count) return;
        setPromoIndex((promoIndex + 1) % count);
    });

    const filterButtons = $('.filter-btn');
    filterButtons.on('click', function () {
        filterButtons.removeClass('filter-btn--active');
        $(this).addClass('filter-btn--active');
    });

    function getCatalogPageSize() {
        const width = $(window).width();
        if (width <= 480) return 2;
        if (width <= 860) return 4;
        return 6;
    }

    function renderCatalogPage() {
        const $grid = $('#catalogGrid');
        const start = catalogPage * catalogPageSize;
        const pageItems = allProducts.slice(start, start + catalogPageSize);

        const html = pageItems.map(product => `
            <div class="product-card">
                <span class="product-card__badge">NEW</span>
                <img src="${product.image}" alt="${product.title}">
                <p class="product-card__name">${product.title}</p>
                <div class="product-card__row">
                    <span class="product-card__price">$${product.price.toFixed(2)}</span>
                    <button class="buy-btn" data-id="${product.id}">&#8599;</button>
                </div>
            </div>
        `).join('');

        $grid.html(html);

        $grid.find('.buy-btn').on('click', function () {
            const productId = String($(this).data('id'));
            const product = allProducts.find(p => p.id === productId);
            addToCart(product);
        });

        buildCatalogDots();
    }

    function buildCatalogDots() {
        const totalPages = Math.max(1, Math.ceil(allProducts.length / catalogPageSize));
        const $dotsWrap = $('#catalogDots');
        $dotsWrap.empty();

        for (let i = 0; i < totalPages; i++) {
            const $dot = $('<span class="dot"></span>');
            if (i === catalogPage) $dot.addClass('dot--active');
            $dot.on('click', () => goToCatalogPage(i));
            $dotsWrap.append($dot);
        }
    }

    function goToCatalogPage(page) {
        const totalPages = Math.max(1, Math.ceil(allProducts.length / catalogPageSize));
        catalogPage = Math.min(Math.max(page, 0), totalPages - 1);
        renderCatalogPage();
    }

    $('#catalogPrev').on('click', function () {
        goToCatalogPage(catalogPage - 1);
    });
    $('#catalogNext').on('click', function () {
        goToCatalogPage(catalogPage + 1);
    });

    function randomRgbColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function randomAvatarGradient() {
        const colorOne = randomRgbColor();
        const colorTwo = randomRgbColor();
        return `linear-gradient(135deg, ${colorOne}, ${colorTwo})`;
    }

    function starsHtml(rating) {
        let html = '';
        for (let i = 0; i < 5; i++) {
            html += i < rating ? '★' : '<span class="star-half">★</span>';
        }
        return html;
    }

    function getReviewsPerPage() {
        return $(window).width() <= 860 ? 1 : 2;
    }

    function renderReviewsPage() {
        const $grid = $('#reviewsGrid');

        if (!reviewsData.length) {
            $grid.html('<p class="cart-empty">Відгуків поки немає. Будьте першими!</p>');
            $('#reviewDots').empty();
            return;
        }

        const start = reviewsPage * reviewsPerPage;
        const pageItems = reviewsData.slice(start, start + reviewsPerPage);

        const html = pageItems.map(review => `
            <div class="review-card">
                <div class="review-card__avatar" style="background: ${randomAvatarGradient()}">${review.name.charAt(0).toUpperCase()}</div>
                <div class="review-card__body">
                    <h4>${review.name}</h4>
                    <div class="stars">${starsHtml(review.rating)}</div>
                    <p>${review.text}</p>
                </div>
            </div>
        `).join('');

        $grid.html(html);
        buildReviewDots();
    }

    function buildReviewDots() {
        const totalPages = Math.max(1, Math.ceil(reviewsData.length / reviewsPerPage));
        const $dotsWrap = $('#reviewDots');
        $dotsWrap.empty();

        for (let i = 0; i < totalPages; i++) {
            const $dot = $('<span class="dot"></span>');
            if (i === reviewsPage) $dot.addClass('dot--active');
            $dot.on('click', () => goToReviewsPage(i));
            $dotsWrap.append($dot);
        }
    }

    function goToReviewsPage(page) {
        const totalPages = Math.max(1, Math.ceil(reviewsData.length / reviewsPerPage));
        reviewsPage = Math.min(Math.max(page, 0), totalPages - 1);
        renderReviewsPage();
    }

    $('#reviewPrev').on('click', function () {
        goToReviewsPage(reviewsPage - 1);
    });
    $('#reviewNext').on('click', function () {
        goToReviewsPage(reviewsPage + 1);
    });

    let selectedRating = 5;
    const $reviewStars = $('#reviewStars').children();

    function paintStars(value) {
        $reviewStars.each(function () {
            const starValue = Number($(this).data('value'));
            $(this).toggleClass('is-active', starValue <= value);
        });
    }

    paintStars(selectedRating);

    $reviewStars.on('click', function () {
        selectedRating = Number($(this).data('value'));
        paintStars(selectedRating);
    });

    const $reviewForm = $('#reviewForm');
    const $reviewNote = $('#reviewNote');

    $reviewForm.on('submit', function (e) {
        e.preventDefault();

        const name = $('#reviewName').val().trim();
        const text = $('#reviewText').val().trim();

        if (!text) {
            $reviewNote.text('Напиши текст відгуку.');
            return;
        }

        $reviewNote.text('Надсилання...');

        $.ajax({
            url: FEEDBACK_API_URL,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ name: name, rating: selectedRating, text: text })
        })
            .done(function (created) {
                reviewsData.unshift(normalizeFeedback(created));
                reviewsPage = 0;
                renderReviewsPage();
                $reviewForm.trigger('reset');
                selectedRating = 5;
                paintStars(selectedRating);
                $reviewNote.text('Дякуємо за відгук!');
            })
            .fail(function () {
                $reviewNote.text('Не вдалося надіслати відгук. Спробуй ще раз.');
            });
    });

    let resizeTimer = null;
    $(window).on('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            const newCatalogPageSize = getCatalogPageSize();
            if (newCatalogPageSize !== catalogPageSize) {
                catalogPageSize = newCatalogPageSize;
                catalogPage = 0;
                renderCatalogPage();
            }

            const newReviewsPerPage = getReviewsPerPage();
            if (newReviewsPerPage !== reviewsPerPage) {
                reviewsPerPage = newReviewsPerPage;
                reviewsPage = 0;
                renderReviewsPage();
            }
        }, 200);
    });

    const $loadingText = $('#loadingText');

    $.when(
        $.getJSON(API_URL),
        $.getJSON(PARTNERS_API_URL),
        $.getJSON(FEEDBACK_API_URL)
    )
        .done(function (productsResponse, partnersResponse, feedbackResponse) {
            const products = productsResponse[0];
            const partners = partnersResponse[0];
            const feedback = feedbackResponse[0];

            allProducts = products.map(normalizeProduct).filter(p => p.inStock);
            $loadingText.remove();

            renderBrands(partners.map(normalizePartner));
            renderTrending();
            renderPromoThumbs();

            catalogPageSize = getCatalogPageSize();
            renderCatalogPage();

            reviewsPerPage = getReviewsPerPage();
            reviewsData = feedback.map(normalizeFeedback);
            renderReviewsPage();
        })
        .fail(function () {
            $loadingText.text('Не вдалося завантажити товари. Перевір інтернет-з’єднання.');
            renderBrands([]);
        });

    const $checkoutForm = $('#checkoutForm');
    const $checkoutNote = $('#checkoutNote');
    const $checkoutSubmit = $('#checkoutSubmit');

    $checkoutForm.on('submit', function (e) {
        e.preventDefault();

        if (cart.length === 0) {
            $checkoutNote.text('Кошик порожній.');
            return;
        }

        const customerName = $('#checkoutName').val().trim();
        const phone = $('#checkoutPhone').val().trim();
        const address = $('#checkoutAddress').val().trim();

        if (!customerName || !phone) {
            $checkoutNote.text("Вкажи ім'я та телефон.");
            return;
        }

        const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        const itemsText = cart.map(item => item.qty > 1 ? `${item.title} x${item.qty}` : item.title).join(', ');

        const orderData = {
            customerName: customerName,
            phone: phone,
            address: address,
            items: itemsText,
            total: total.toFixed(2),
            status: 'new'
        };

        $checkoutSubmit.prop('disabled', true);
        $checkoutNote.text('Оформлення замовлення...');

        $.ajax({
            url: '/api/orders',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(orderData)
        })
            .done(function () {
                cart = [];
                renderCart();
                $checkoutForm.trigger('reset');
                $checkoutNote.text('Замовлення оформлено! Ми звʼяжемось з тобою.');
            })
            .fail(function () {
                $checkoutNote.text('Не вдалося оформити замовлення. Спробуй ще раз.');
            })
            .always(function () {
                $checkoutSubmit.prop('disabled', false);
            });
    });

    const $subscribeForm = $('#subscribeForm');
    const $subscribeNote = $('#subscribeNote');

    $subscribeForm.on('submit', function (e) {
        e.preventDefault();
        const email = $subscribeForm.find('input[type="email"]').val().trim();
        if (!email) return;

        $subscribeNote.text('Зачекай...');

        $.ajax({
            url: '/api/emails',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: email })
        })
            .done(function () {
                $subscribeNote.text('Дякуємо за підписку!');
                $subscribeForm.trigger('reset');
            })
            .fail(function () {
                $subscribeNote.text('Не вдалося підписатись. Спробуй ще раз.');
            });
    });

});