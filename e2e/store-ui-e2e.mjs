import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const ROOT = process.cwd();

const sampleImage = 'data:image/svg+xml;base64,' + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#d946ef"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="36" fill="#fff">TISH</text></svg>'
).toString('base64');

const mockData = {
  tish_profile: {
    name: 'E2E User',
    username: 'e2e_user',
    email: 'e2e@example.com',
    googleId: 'e2e-001',
    bio: 'E2E smoke profile',
    verified: true,
    level: 2,
    xp: 40,
    maxXp: 100,
    tishara: 15,
    tags: ['UI/UX'],
    purchases: [],
    favorites: [],
    browsingHistory: [],
    reviews: [],
    discounts: [],
    tisharaHistory: [],
    achievements: [],
    nftCollection: [],
    referrals: { invited: 0, earned: 0, link: '', myCode: '', usedCodes: [], history: [] },
    stats: { purchases: 0, referrals: 0, spent: 0, rating: 0 },
    settings: { notifications: true, publicProfile: true, showHistory: true },
    region: 'RU'
  },
  tish_orders: [],
  tish_review_counts: {},
  tish_admin_products: [
    {
      id: 101,
      title: 'E2E Media Product',
      category: 'Дизайн',
      categorySlug: 'design',
      executor: 'QA Artist',
      executorRole: 'Designer',
      description: 'Product for E2E modal/media checks',
      gradient: 'linear-gradient(135deg,#8b5cf6,#d946ef)',
      priceRub: 12000,
      oldPriceRub: 15000,
      prepayPriceRub: 3000,
      priceUsd: 149,
      oldPriceUsd: 179,
      prepayPriceUsd: 39,
      active: true,
      media: [
        { url: sampleImage, type: 'image', name: 'cover' },
        { url: 'https://example.com/e2e-video.mp4', type: 'video', name: 'video' }
      ]
    },
    {
      id: 102,
      title: 'E2E Image Product',
      category: 'Веб / IT',
      categorySlug: 'web',
      executor: 'QA Dev',
      description: 'Second product',
      gradient: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
      priceRub: 9000,
      priceUsd: 109,
      active: true,
      media: [{ url: sampleImage, type: 'image', name: 'cover2' }]
    }
  ],
  tish_admin_notifications: [],
  tish_admin_notifs: [],
  tish_admin_log: [],
  tish_tishara_shop_products: []
};

function respondJson(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(body)
  });
}

function parseJsonSafe(raw, fallback = {}) {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

function buildAuthUser() {
  return {
    email: 'e2e@example.com',
    name: 'E2E User',
    googleId: 'e2e-001',
    picture: ''
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1536, height: 960 } });

  await context.addInitScript((seed) => {
    localStorage.clear();
    Object.entries(seed).forEach(([k, v]) => {
      localStorage.setItem(k, JSON.stringify(v));
    });
    localStorage.setItem('tish_auth', JSON.stringify({
      email: 'e2e@example.com',
      name: 'E2E User',
      googleId: 'e2e-001',
      avatar: null,
      loginTime: Date.now()
    }));
    localStorage.setItem('tish_api_token', 'e2e-token');
    localStorage.setItem('theme', 'dark');
  }, mockData);

  await context.route('**/api/analytics**', async (route) => {
    const method = route.request().method();
    if (method === 'POST' || method === 'DELETE') return respondJson(route, { success: true });
    return respondJson(route, { events: [], success: true });
  });

  await context.route('**/api/store/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const p = url.pathname;

    if (p === '/api/store/health') {
      return respondJson(route, {
        success: true,
        status: 'ok',
        time: new Date().toISOString(),
        dataKeys: Object.keys(mockData).length,
        authenticated: true,
        role: 'admin'
      });
    }

    if (p === '/api/store/auth/config') {
      return respondJson(route, { success: true, enabled: true, clientId: 'e2e-client', allowedDomain: '' });
    }

    if (p === '/api/store/auth/session') {
      return respondJson(route, {
        success: true,
        authenticated: true,
        admin: true,
        user: buildAuthUser(),
        tokenExpiresAt: Date.now() + 3600000
      });
    }

    if (p === '/api/store/auth/google') {
      return respondJson(route, {
        success: true,
        token: 'e2e-token',
        expiresAt: Date.now() + 3600000,
        user: buildAuthUser()
      });
    }

    if (p === '/api/store/auth/logout') {
      return respondJson(route, { success: true });
    }

    if (p === '/api/store/admin/check-auth') {
      return respondJson(route, { required: false });
    }

    if (p === '/api/store/admin/validate-session') {
      return respondJson(route, { success: true, valid: true, admin: true, passwordRequired: false });
    }

    if (p === '/api/store/admin/users') {
      return respondJson(route, { success: true, users: [] });
    }

    if (p === '/api/store/admin/analytics/events') {
      return respondJson(route, { success: true, events: [], total: 0 });
    }

    if (p === '/api/store/admin/support-chats') {
      return respondJson(route, { success: true, chats: [] });
    }

    if (p === '/api/store/review-counts') {
      return respondJson(route, { success: true, counts: mockData.tish_review_counts || {} });
    }

    if (p === '/api/store/orders') {
      if (method === 'GET') {
        return respondJson(route, { success: true, orders: Array.isArray(mockData.tish_orders) ? mockData.tish_orders : [] });
      }
      if (method === 'POST') {
        const body = parseJsonSafe(req.postData(), {});
        if (Array.isArray(body.orders)) mockData.tish_orders = body.orders;
        return respondJson(route, { success: true });
      }
    }

    if (p.startsWith('/api/store/data/')) {
      const key = decodeURIComponent(p.replace('/api/store/data/', ''));
      if (method === 'GET') {
        return respondJson(route, { success: true, key, value: Object.prototype.hasOwnProperty.call(mockData, key) ? mockData[key] : null });
      }
      if (method === 'POST') {
        const body = parseJsonSafe(req.postData(), {});
        const value = body.value !== undefined ? body.value : body.data;
        mockData[key] = value;
        return respondJson(route, { success: true, key });
      }
      if (method === 'DELETE') {
        delete mockData[key];
        return respondJson(route, { success: true, key });
      }
    }

    if (p === '/api/store/data') {
      return respondJson(route, { success: true, keys: Object.keys(mockData) });
    }

    if (p === '/api/store/sync') {
      if (method === 'POST') {
        const body = parseJsonSafe(req.postData(), {});
        if (body && body.data && typeof body.data === 'object') {
          Object.assign(mockData, body.data);
        }
        return respondJson(route, { success: true, saved: Object.keys(body.data || {}).length, errors: 0, denied: 0 });
      }
      return respondJson(route, { success: true, data: mockData, keys: Object.keys(mockData) });
    }

    if (p === '/api/store/analytics/track') {
      return respondJson(route, { success: true, event: { id: Date.now().toString(36) } });
    }

    return route.continue();
  });

  const page = await context.newPage();
  const report = {
    checks: {},
    details: {}
  };

  try {
    await page.goto(`${BASE_URL}/tish-store/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1600);
    await page.waitForFunction(() => (
      typeof App !== 'undefined'
      && typeof Profile !== 'undefined'
      && typeof Catalog !== 'undefined'
      && typeof Admin !== 'undefined'
    ), { timeout: 30000 });

    await page.evaluate(() => {
      const ov = document.getElementById('authOverlay');
      if (ov) {
        ov.classList.add('is-hidden');
        ov.style.display = 'none';
      }
    });

    report.details.mainSiteButton = {
      count: await page.locator('.navbar__home-link').count(),
      text: (await page.locator('.navbar__home-link span').first().textContent())?.trim() || '',
      href: await page.locator('.navbar__home-link').first().getAttribute('href'),
      hrefCountInPage: await page.locator('a[href="/index.html"]').count()
    };

    await page.evaluate(() => App.showPage('profile'));
    await page.waitForSelector('#page-profile.active', { timeout: 15000 });
    await page.waitForTimeout(900);

    const sectionSelectors = {
      orders: '#ordersList',
      favorites: '#profileFavoritesGrid',
      history: '#historyScroll',
      reviews: '#reviewsList',
      achievements: '#achievementsGrid',
      nft: '#nftCollectionGrid'
    };

    const sections = {};
    for (const [k, sel] of Object.entries(sectionSelectors)) {
      sections[k] = (await page.locator(sel).count()) > 0;
    }

    const ordersText = (await page.locator('#ordersList').innerText()).trim();
    const favText = (await page.locator('#profileFavoritesGrid').innerText()).trim();
    const nftText = (await page.locator('#nftCollectionGrid').innerText()).trim();

    const refCode = ((await page.locator('#myRefCodeDisplay').textContent()) || '').trim();
    const refEditBtnCount = await page.locator('#myRefCodeEditBtn').count();

    await page.evaluate(() => Profile.editMyRefCode());
    await page.waitForTimeout(450);
    const toastMessages = await page.locator('.toast__message').allTextContents();
    const refToast = toastMessages.length ? toastMessages[toastMessages.length - 1] : '';

    const accountCodes = await page.evaluate(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const mk = (gid, name, email) => ({
        name,
        username: name.toLowerCase(),
        email,
        googleId: gid,
        referrals: { invited: 0, earned: 0, link: '', myCode: '', usedCodes: [], history: [] },
        tags: [],
        purchases: [],
        favorites: [],
        browsingHistory: [],
        reviews: [],
        discounts: [],
        tisharaHistory: [],
        achievements: [],
        nftCollection: [],
        stats: { purchases: 0, referrals: 0, spent: 0, rating: 0 },
        settings: { notifications: true, publicProfile: true, showHistory: true }
      });

      const profileA = mk('acc-A', 'Alpha', 'alpha@demo.dev');
      localStorage.setItem('tish_profile', JSON.stringify(profileA));
      if (typeof Storage !== 'undefined' && typeof Storage.set === 'function') {
        Storage.set('tish_profile', profileA);
      }
      Profile.init();
      await wait(220);
      const codeA = (document.getElementById('myRefCodeDisplay')?.textContent || '').trim();

      const profileB = mk('acc-B', 'Beta', 'beta@demo.dev');
      localStorage.setItem('tish_profile', JSON.stringify(profileB));
      if (typeof Storage !== 'undefined' && typeof Storage.set === 'function') {
        Storage.set('tish_profile', profileB);
      }
      Profile.init();
      await wait(220);
      const codeB = (document.getElementById('myRefCodeDisplay')?.textContent || '').trim();

      return { codeA, codeB };
    });

    report.details.profile = {
      sections,
      ordersEmptyState: /Нет заказов/i.test(ordersText),
      favoritesEmptyState: /Пусто|В каталог/i.test(favText),
      nftEmptyState: /Нет NFT/i.test(nftText),
      referralCode: refCode,
      referralCodePattern: /^TISH-[A-Z0-9]{6,10}$/.test(refCode),
      referralEditButtonCount: refEditBtnCount,
      referralEditToast: refToast,
      accountCodes,
      accountCodesAreDifferent: !!accountCodes.codeA && !!accountCodes.codeB && accountCodes.codeA !== accountCodes.codeB
    };

    await page.evaluate(() => App.showPage('catalog'));
    await page.waitForSelector('#page-catalog.active', { timeout: 15000 });
    await page.waitForSelector('.product-card', { timeout: 15000 });

    const cardCount = await page.locator('.product-card').count();
    await page.locator('.product-card').first().click();
    await page.waitForSelector('#cm3Modal.open', { timeout: 10000 });
    const modalMediaCount = await page.locator('#cm3Gal img, #cm3Gal video').count();
    const modalThumbCount = await page.locator('#cm3Modal .cm3__th').count();
    await page.locator('#cm3Modal .cm3__x').click();

    report.details.catalog = {
      cardCount,
      modalOpened: true,
      modalMediaCount,
      modalThumbCount
    };

    await page.evaluate(() => App.showPage('admin'));
    await page.waitForSelector('#page-admin.active', { timeout: 15000 });
    await page.waitForSelector('.admin-sidebar__item[data-tab="products"]', { timeout: 15000 });
    await page.locator('.admin-sidebar__item[data-tab="products"]').click();
    await page.waitForSelector('#adminTabContent .admin-table tbody tr', { timeout: 15000 });

    const adminRows = await page.locator('#adminTabContent .admin-table tbody tr').count();
    await page.locator('#adminTabContent .admin-table tbody tr .admin-table-btn').first().click();
    await page.waitForSelector('#adminUniversalModal', { timeout: 10000 });
    const adminModalMedia = await page.locator('#adminUniversalModal #pe_mediaPreviews img, #adminUniversalModal #pe_mediaPreviews video').count();
    await page.evaluate(() => Admin.closeAdminModal());

    report.details.admin = {
      productsTabRows: adminRows,
      editorModalOpened: true,
      editorModalMediaItems: adminModalMedia
    };

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(120);
    const storeLogoColor = await page.$eval('.navbar__logo > span:last-child', (el) => getComputedStyle(el).color);

    const mainPage = await context.newPage();
    await mainPage.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await mainPage.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.setAttribute('data-theme', 'dark');
    });
    await mainPage.waitForTimeout(120);
    const rootLogoColor = await mainPage.$eval('.nav__logo span:last-child', (el) => getComputedStyle(el).color);
    await mainPage.close();

    report.details.theme = {
      storeLogoColor,
      rootLogoColor,
      storeLogoVisible: storeLogoColor !== 'rgba(0, 0, 0, 0)' && storeLogoColor !== 'transparent',
      rootLogoVisible: rootLogoColor !== 'rgba(0, 0, 0, 0)' && rootLogoColor !== 'transparent'
    };

    const storeServerExists = fs.existsSync(path.join(ROOT, 'tish-store', 'server.js'));
    const subPkg = fs.readFileSync(path.join(ROOT, 'tish-store', 'package.json'), 'utf8');
    const subAmv = fs.readFileSync(path.join(ROOT, 'tish-store', 'amvera.yaml'), 'utf8');
    const rootSrv = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

    report.details.architecture = {
      storeServerExists,
      packageUsesRootServer: /"start"\s*:\s*"node \..\/server\.js"/.test(subPkg) && /"dev"\s*:\s*"node \..\/server\.js"/.test(subPkg),
      amveraUsesRootServer: /scriptName:\s*\.\.\/server\.js/.test(subAmv) && /command:\s*node \.\.\/server\.js/.test(subAmv),
      amveraPersistenceMount: /persistenceMount:\s*\/app\/data/.test(subAmv),
      legacyMigrationEnabled: /function migrateLegacyStoreData\(/.test(rootSrv) && /migrateLegacyStoreData\(\);/.test(rootSrv)
    };

    report.checks = {
      profileSectionsAndEmptyStates: Object.values(report.details.profile.sections).every(Boolean)
        && report.details.profile.ordersEmptyState
        && report.details.profile.favoritesEmptyState
        && report.details.profile.nftEmptyState,

      referralCodeRandomAndLocked: report.details.profile.referralCodePattern
        && report.details.profile.referralEditButtonCount === 0
        && /не редактируется/i.test(report.details.profile.referralEditToast)
        && report.details.profile.accountCodesAreDifferent,

      adminProductsAndCatalogMedia: report.details.catalog.cardCount > 0
        && report.details.catalog.modalOpened
        && report.details.catalog.modalMediaCount > 0
        && report.details.admin.productsTabRows > 0
        && report.details.admin.editorModalOpened
        && report.details.admin.editorModalMediaItems > 0,

      darkThemeLogoReadable: report.details.theme.storeLogoVisible
        && report.details.theme.rootLogoVisible,

      mainSiteButtonMovedAndRedesigned: report.details.mainSiteButton.count === 1
        && /На сайт TISH TEAM/.test(report.details.mainSiteButton.text)
        && report.details.mainSiteButton.href === '/index.html'
        && report.details.mainSiteButton.hrefCountInPage === 1,

      amveraReadyPersistence: report.details.architecture.amveraUsesRootServer
        && report.details.architecture.amveraPersistenceMount
        && report.details.architecture.legacyMigrationEnabled,

      singleServerArchitecture: !report.details.architecture.storeServerExists
        && report.details.architecture.packageUsesRootServer
        && report.details.architecture.amveraUsesRootServer
    };

    report.summary = {
      total: Object.keys(report.checks).length,
      passed: Object.values(report.checks).filter(Boolean).length,
      failed: Object.entries(report.checks).filter(([, ok]) => !ok).map(([name]) => name)
    };

    console.log(JSON.stringify(report, null, 2));

    if (report.summary.failed.length) {
      process.exitCode = 2;
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

run().catch((err) => {
  console.error('[e2e] fatal:', err);
  process.exit(1);
});
