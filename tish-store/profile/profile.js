/* =====================================================
   TISH STORE — PROFILE MODULE v5 (NFT Support)
   Compatible with clean index.html + cart.js
   by Tish Team
   ===================================================== */

const Profile = (() => {
    // ===== DEFAULTS =====
    const DEFAULT_USER = {
        name:'',username:'',bio:'',avatar:null,verified:false,
        level:1,xp:0,maxXp:100,tishara:0,
        tags:[],accentColor:'#8b5cf6',profileTheme:'default',bannerStyle:'gradient-1',
        purchases:[],favorites:[],browsingHistory:[],reviews:[],
        referrals:{invited:0,earned:0,link:'',myCode:'',usedCodes:[],history:[]},
        tisharaHistory:[],discounts:[],tisharaShopPurchases:[],
        stats:{purchases:0,referrals:0,spent:0,rating:0},
        settings:{notifications:true,publicProfile:true,showHistory:true},
        joinDate:null,achievements:[],
        // === NEW: NFT ===
        nftCollection: [],
        nftProfileSettings: {
            headerNfts: [],       // до 6 NFT id на шапке
            nicknameNft: null,    // id NFT миниатюры рядом с ником
            headerBgColor: null,  // цвет шапки от NFT
            headerBgSticker: null,// стикер на фон шапки
            textColor: null       // цвет текста от NFT
        },
        region: null
    };

    const DEMO_USER = {
        name:'Александр Волков',username:'alex_design',
        bio:'UI/UX энтузиаст. 5 лет в мире дизайна.',
        avatar:null,verified:true,
        level:7,xp:720,maxXp:1000,tishara:150,
        tags:['UI/UX','Figma','Брендинг','Web','Mobile','3D'],
        accentColor:'#8b5cf6',profileTheme:'default',bannerStyle:'gradient-1',
        purchases:[
            {id:1,name:'Nebula UI Kit',price:49,date:'2024-12-12',category:'UI Kit',author:'CosmicDesign',gradient:'linear-gradient(135deg,#8b5cf6,#d946ef)',downloaded:true,reviewed:true},
            {id:3,name:'Stellar Icons',price:19,date:'2024-12-08',category:'Иконки',author:'IconVerse',gradient:'linear-gradient(135deg,#f97316,#ec4899)',downloaded:false,reviewed:true},
            {id:4,name:'Cosmic Illustrations',price:39,date:'2024-12-01',category:'Иллюстрации',author:'ArtSpace',gradient:'linear-gradient(135deg,#a855f7,#3b82f6)',downloaded:true,reviewed:true},
            {id:7,name:'Quantum Mobile Kit',price:55,date:'2024-11-25',category:'UI Kit',author:'MobileFirst',gradient:'linear-gradient(135deg,#22d3ee,#a855f7)',downloaded:true,reviewed:false},
            {id:5,name:'Void Brand Kit',price:59,date:'2024-11-18',category:'Брендинг',author:'BrandMaster',gradient:'linear-gradient(135deg,#1e1b4b,#7c3aed)',downloaded:false,reviewed:false}
        ],
        favorites:[],
        browsingHistory:[
            {id:1,name:'Nebula UI Kit',time:'2 часа назад',gradient:'linear-gradient(135deg,#8b5cf6,#d946ef)'},
            {id:7,name:'Quantum Mobile Kit',time:'Вчера',gradient:'linear-gradient(135deg,#22d3ee,#a855f7)'}
        ],
        reviews:[
            {id:1,productId:1,product:'Nebula UI Kit',rating:5,text:'Потрясающий набор!',date:'2024-12-12'},
            {id:2,productId:3,product:'Stellar Icons',rating:4,text:'Отличные иконки.',date:'2024-12-09'}
        ],
        referrals:{invited:12,earned:380,link:'',myCode:'',usedCodes:[],
            history:[{name:'Мария К.',action:'присоединилась',bonus:50,date:'2024-12-10'},{name:'Дмитрий Л.',action:'купил товар',bonus:80,date:'2024-12-08'}]},
        tisharaHistory:[
            {type:'Покупка',label:'Покупка',value:15,date:'2024-12-12'},
            {type:'Отзыв',label:'Отзыв',value:5,date:'2024-12-09'}
        ],
        discounts:[{id:1,name:'Скидка 5%',percent:5,source:'Администратор',active:true,code:'GIFT5'}],
        tisharaShopPurchases:[],
        stats:{purchases:5,referrals:12,spent:221,rating:4.9},
        settings:{notifications:true,publicProfile:true,showHistory:true},
        joinDate:'2024-06-15',
        achievements:['first_purchase','first_review','ui_hunter','profile_complete'],
        // === DEMO NFT COLLECTION ===
        nftCollection: [
            {
                id: 'nft_001',
                name: 'Cosmic Dragon',
                rarity: 'legendary',
                price: 299,
                color: '#f97316',
                sticker: '🐉',
                animation: 'cosmic-dragon',
                animationType: 'css',
                dropDate: '2024-12-15',
                caseSource: 'Cosmic Case',
                image: null
            },
            {
                id: 'nft_002',
                name: 'Neon Phoenix',
                rarity: 'epic',
                price: 149,
                color: '#ec4899',
                sticker: '🔥',
                animation: 'neon-phoenix',
                animationType: 'css',
                dropDate: '2024-12-10',
                caseSource: 'Fire Case',
                image: null
            },
            {
                id: 'nft_003',
                name: 'Crystal Wolf',
                rarity: 'rare',
                price: 79,
                color: '#3b82f6',
                sticker: '🐺',
                animation: 'crystal-wolf',
                animationType: 'css',
                dropDate: '2024-12-08',
                caseSource: 'Ice Case',
                image: null
            },
            {
                id: 'nft_004',
                name: 'Shadow Cat',
                rarity: 'common',
                price: 25,
                color: '#8b5cf6',
                sticker: '🐱',
                animation: 'shadow-cat',
                animationType: 'css',
                dropDate: '2024-12-05',
                caseSource: 'Basic Case',
                image: null
            },
            {
                id: 'nft_005',
                name: 'Aurora Serpent',
                rarity: 'mythic',
                price: 500,
                color: '#22d3ee',
                sticker: '🐍',
                animation: 'aurora-serpent',
                animationType: 'css',
                dropDate: '2024-12-01',
                caseSource: 'Mythic Case',
                image: null
            }
        ],
        nftProfileSettings: {
            headerNfts: [],
            nicknameNft: null,
            headerBgColor: null,
            headerBgSticker: null,
            textColor: null
        },
        region: null
    };

    // === NFT RARITY CONFIG ===
    const NFT_RARITIES = {
        common:    { name: 'Обычный',     color: '#9ca3af', gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)', glow: 'rgba(156,163,175,0.3)' },
        rare:      { name: 'Редкий',      color: '#3b82f6', gradient: 'linear-gradient(135deg, #2563eb, #60a5fa)', glow: 'rgba(59,130,246,0.4)' },
        epic:      { name: 'Эпический',   color: '#a855f7', gradient: 'linear-gradient(135deg, #9333ea, #c084fc)', glow: 'rgba(168,85,247,0.4)' },
        legendary: { name: 'Легендарный',  color: '#f97316', gradient: 'linear-gradient(135deg, #ea580c, #fb923c)', glow: 'rgba(249,115,22,0.5)' },
        mythic:    { name: 'Мифический',   color: '#ef4444', gradient: 'linear-gradient(135deg, #dc2626, #f87171, #fbbf24)', glow: 'rgba(239,68,68,0.5)' }
    };

    // Все остальные константы (ALL_ACHIEVEMENTS, BANNER_STYLES, ACCENT_COLORS и т.д.) 
    // остаются БЕЗ ИЗМЕНЕНИЙ — копируем как были

    const ALL_ACHIEVEMENTS = [
        {id:'first_purchase',name:'Первая покупка',icon:'shopping-bag',description:'Совершите покупку',xp:20,tishara:10,condition:u=>u.stats.purchases>=1},
        {id:'ten_purchases',name:'10 покупок',icon:'shopping-cart',description:'Купите 10 товаров',xp:50,tishara:25,condition:u=>u.stats.purchases>=10},
        {id:'collector',name:'Коллекционер',icon:'folder',description:'10 товаров в избранном',xp:15,tishara:5,condition:u=>(u.favorites||[]).length>=10},
        {id:'loyal_customer',name:'Постоянный клиент',icon:'repeat',description:'7 дней подряд',xp:30,tishara:15,condition:()=>false},
        {id:'ui_hunter',name:'UI Hunter',icon:'monitor',description:'Купите 3 UI Kit',xp:25,tishara:10,condition:u=>u.purchases.filter(p=>p.category==='UI Kit').length>=3},
        {id:'first_review',name:'Первый отзыв',icon:'message-circle',description:'Оставьте отзыв',xp:15,tishara:5,condition:u=>u.reviews.length>=1},
        {id:'motion_explorer',name:'Motion Explorer',icon:'play',description:'3 Motion-дизайна',xp:25,tishara:10,condition:u=>u.purchases.filter(p=>p.category==='Motion').length>=3},
        {id:'fifty_favorites',name:'50 в избранном',icon:'heart',description:'50 в избранное',xp:20,tishara:10,condition:u=>(u.favorites||[]).length>=50},
        {id:'veteran',name:'Ветеран',icon:'award',description:'1 год на платформе',xp:100,tishara:50,rare:true,condition:u=>{if(!u.joinDate)return false;return(Date.now()-new Date(u.joinDate).getTime())>=365*24*60*60*1000;}},
        {id:'professional',name:'Профессионал',icon:'zap',description:'Уровень 10',xp:75,tishara:40,rare:true,condition:u=>u.level>=10},
        {id:'community_friend',name:'Друг сообщества',icon:'users',description:'20 друзей',xp:60,tishara:30,condition:u=>(u.referrals?u.referrals.invited:0)>=20},
        {id:'expert_reviewer',name:'Знаток',icon:'book-open',description:'20 отзывов',xp:50,tishara:25,condition:u=>u.reviews.length>=20},
        {id:'profile_complete',name:'Полный профиль',icon:'user-check',description:'Заполните профиль',xp:20,tishara:10,condition:u=>!!(u.name&&u.username&&u.bio&&u.tags&&u.tags.length>0)},
        {id:'big_spender',name:'Ценитель',icon:'credit-card',description:'Потратьте 500 в выбранной валюте',xp:40,tishara:20,condition:u=>u.stats.spent>=500},
        {id:'icon_lover',name:'Иконки',icon:'grid',description:'3 набора иконок',xp:25,tishara:10,condition:u=>u.purchases.filter(p=>p.category==='Иконки').length>=3},
        {id:'night_owl',name:'Сова',icon:'moon',description:'После полуночи',xp:10,tishara:5,condition:()=>{const h=new Date().getHours();return h>=0&&h<5;}},
        // NEW: NFT achievement
        {id:'first_nft',name:'Первый NFT',icon:'gift',description:'Получите первый NFT',xp:25,tishara:15,condition:u=>(u.nftCollection||[]).length>=1}
    ];

    const BANNER_STYLES = [
        {id:'gradient-1',name:'Космос',gradient:'linear-gradient(-45deg,#7c3aed,#a855f7,#d946ef,#ec4899,#8b5cf6,#6d28d9,#c084fc,#e879f9)'},
        {id:'gradient-2',name:'Океан',gradient:'linear-gradient(-45deg,#0ea5e9,#06b6d4,#14b8a6,#0d9488,#0891b2,#0e7490,#22d3ee,#67e8f9)'},
        {id:'gradient-3',name:'Закат',gradient:'linear-gradient(-45deg,#f97316,#ef4444,#ec4899,#f43f5e,#fb923c,#e11d48,#f472b6,#fbbf24)'},
        {id:'gradient-4',name:'Лес',gradient:'linear-gradient(-45deg,#16a34a,#22c55e,#10b981,#059669,#34d399,#15803d,#86efac,#4ade80)'},
        {id:'gradient-5',name:'Ночь',gradient:'linear-gradient(-45deg,#1e1b4b,#312e81,#3730a3,#4338ca,#1e3a5f,#0f172a,#4f46e5,#6366f1)'},
        {id:'gradient-6',name:'Золото',gradient:'linear-gradient(-45deg,#f59e0b,#d97706,#b45309,#fbbf24,#f59e0b,#92400e,#fcd34d,#fde68a)'},
        {id:'gradient-7',name:'Аврора',gradient:'linear-gradient(-45deg,#06b6d4,#8b5cf6,#d946ef,#22d3ee,#a855f7,#ec4899,#14b8a6,#c084fc)'},
        {id:'gradient-8',name:'Серый',gradient:'linear-gradient(-45deg,#64748b,#94a3b8,#cbd5e1,#475569,#6b7280,#9ca3af,#d1d5db,#e5e7eb)'}
    ];

    const ACCENT_COLORS = [
        {color:'#8b5cf6',name:'Фиолетовый'},{color:'#3b82f6',name:'Синий'},
        {color:'#06b6d4',name:'Голубой'},{color:'#22c55e',name:'Зелёный'},
        {color:'#eab308',name:'Жёлтый'},{color:'#f97316',name:'Оранжевый'},
        {color:'#ef4444',name:'Красный'},{color:'#ec4899',name:'Розовый'}
    ];

    const LEVEL_NAMES = ['Новичок','Исследователь','Коллекционер','Энтузиаст','Знаток','Мастер','Эксперт','Профессионал','Ветеран','Легенда'];
    const LEVEL_REWARDS = [
        {level:1,name:'Новичок',reward:'Доступ к платформе'},
        {level:2,name:'Исследователь',reward:'+20 TISHARA'},
        {level:3,name:'Коллекционер',reward:'Скидка 3%'},
        {level:4,name:'Энтузиаст',reward:'+50 TISHARA'},
        {level:5,name:'Знаток',reward:'Скидка 5%'},
        {level:6,name:'Мастер',reward:'+100 TISHARA'},
        {level:7,name:'Эксперт',reward:'Скидка 7%'},
        {level:8,name:'Профессионал',reward:'+200 TISHARA'},
        {level:9,name:'Ветеран',reward:'Скидка 10%'},
        {level:10,name:'Легенда',reward:'+500 TISHARA'}
    ];

    const AVAILABLE_TAGS = ['UI/UX','Figma','Sketch','Adobe XD','Брендинг','Web','Mobile','3D','Motion','Иконки','Иллюстрации','Dashboard','Landing','E-commerce','Dark UI'];

    const TISHARA_SHOP_KEY = 'tish_tishara_shop_products';
    const DEFAULT_TISHARA_SHOP = [
        {id:'d3',name:'Скидка 3%',percent:3,cost:100,icon:'tag',description:'Персональный промокод',active:true},
        {id:'d5',name:'Скидка 5%',percent:5,cost:150,icon:'tag',description:'Персональный промокод',active:true},
        {id:'d7',name:'Скидка 7%',percent:7,cost:200,icon:'zap',description:'Персональный промокод',active:true}
    ];

    let userData = null;
    let activeModal = null;
    let _pendingReviewOrderId = null;
    let _pendingReviewProductName = null;
    let _profileBindingsDone = false;
    let _catalogModalPatched = false;
    const LIST_PAGE_SIZE = 5;
    const listPageState = {
        orders: 1,
        favorites: 1,
        reviews: 1,
        nft: 1
    };
    const ADAPTIVE_FX_CONFIG = {
        sampleFrames: 90,
        lowFps: 48,
        recoverFps: 56,
        slowFrameMs: 26,
        highSlowRatio: 0.32,
        recoverSlowRatio: 0.18,
        cooldownFrames: 150
    };
    const adaptiveFxState = {
        raf: 0,
        lastTs: 0,
        sampleCount: 0,
        sampleDt: 0,
        slowFrames: 0,
        isLow: false,
        running: false,
        cooldown: 0,
        lowDeviceHint: false
    };

    // ===== ICONS =====
    const I = {
        'shopping-bag':'<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
        'shopping-cart':'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
        'star':'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        'users':'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        'message-circle':'<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
        'heart':'<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
        'clock':'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        'grid':'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
        'lock':'<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        'folder':'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
        'repeat':'<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
        'monitor':'<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
        'play':'<polygon points="5 3 19 12 5 21 5 3"/>',
        'award':'<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
        'zap':'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        'book-open':'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
        'download':'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
        'external-link':'<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
        'check':'<polyline points="20 6 9 17 4 12"/>',
        'camera':'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
        'user':'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        'user-check':'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
        'credit-card':'<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
        'moon':'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
        'palette':'<circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c.55 0 1-.45 1-1 0-.28-.11-.5-.28-.67-.18-.2-.28-.43-.28-.73 0-.55.45-1 1-1h1.73c3.14 0 5.69-2.55 5.69-5.69C22.14 5.96 17.63 2 12 2z"/>',
        'trash':'<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        'eye':'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
        'tag':'<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
        'gift':'<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
        'x':'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        'search':'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
        'edit':'<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
        'globe':'<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
        'percent':'<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
        // NEW NFT icons
        'hexagon':'<polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/>',
        'diamond':'<rect x="12" y="1" width="15.56" height="15.56" rx="2" transform="rotate(45 12 1)"/>',
        'swap':'<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>',
        'dollar-sign':'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'
    };
    function ic(n){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${I[n]||I.star}</svg>`;}

    // ===== STORAGE =====
    function extractArray(value, fallback = []) {
        if (Array.isArray(value)) return value;
        if (value && typeof value === 'object') {
            const candidates = ['value', 'data', 'items', 'orders', 'products', 'list', 'rows'];
            for (const key of candidates) {
                if (Array.isArray(value[key])) return value[key];
            }
        }
        return fallback;
    }

    function readStoredValue(key, fallback = null) {
        try {
            if (typeof Storage !== 'undefined' && typeof Storage.get === 'function') {
                const cached = Storage.get(key, null);
                if (cached !== null && cached !== undefined) return cached;
            }
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch(e) {
            return fallback;
        }
    }

    function readStoredArray(key) {
        return extractArray(readStoredValue(key, []), []);
    }

    function buildReferralCodeSeed() {
        return String(
            userData?.googleId ||
            userData?.email ||
            userData?.username ||
            userData?.joinDate ||
            Date.now()
        );
    }

    function save() {
        try {
            localStorage.setItem('tish_profile', JSON.stringify(userData));
            // Server sync (current session key)
            if (typeof Storage !== 'undefined' && Storage.set) {
                Storage.set('tish_profile', userData);
                // Also save per-user key for multi-account support
                if (userData.googleId) {
                    Storage.set('tish_profile_' + userData.googleId, userData);
                }
            }
        } catch(e) {}
    }
    function load(){
        const rawProfile = readStoredValue('tish_profile', null);
        const safeProfile = rawProfile && typeof rawProfile === 'object' ? rawProfile : {};
        userData = { ...DEFAULT_USER, ...safeProfile };

        const referralsRaw = userData.referrals && typeof userData.referrals === 'object' ? userData.referrals : {};
        userData.referrals = {
            invited: Number(referralsRaw.invited || 0),
            earned: Number(referralsRaw.earned || 0),
            link: String(referralsRaw.link || ''),
            myCode: String(referralsRaw.myCode || '').trim().toUpperCase(),
            usedCodes: extractArray(referralsRaw.usedCodes, []).map((code) => String(code || '').trim().toUpperCase()).filter(Boolean),
            history: extractArray(referralsRaw.history, [])
        };

        userData.tags = extractArray(userData.tags, []);
        userData.purchases = extractArray(userData.purchases, []);
        userData.favorites = extractArray(userData.favorites, []);
        userData.browsingHistory = extractArray(userData.browsingHistory, []);
        userData.reviews = extractArray(userData.reviews, []);
        userData.tisharaHistory = extractArray(userData.tisharaHistory, []);
        userData.discounts = extractArray(userData.discounts, []);
        userData.tisharaShopPurchases = extractArray(userData.tisharaShopPurchases, []);
        userData.achievements = extractArray(userData.achievements, []);
        userData.nftCollection = extractArray(userData.nftCollection, []);

        userData.stats = {
            ...DEFAULT_USER.stats,
            ...(userData.stats && typeof userData.stats === 'object' ? userData.stats : {})
        };
        userData.settings = {
            ...DEFAULT_USER.settings,
            ...(userData.settings && typeof userData.settings === 'object' ? userData.settings : {})
        };
        userData.nftProfileSettings = {
            ...DEFAULT_USER.nftProfileSettings,
            ...(userData.nftProfileSettings && typeof userData.nftProfileSettings === 'object' ? userData.nftProfileSettings : {})
        };
        userData.nftProfileSettings.headerNfts = extractArray(userData.nftProfileSettings.headerNfts, []);

        if (!userData.joinDate) userData.joinDate = new Date().toISOString();
        if (!userData.referrals.myCode || !/^TISH-[A-Z0-9]{6,10}$/.test(userData.referrals.myCode)) {
            userData.referrals.myCode = genCode(buildReferralCodeSeed());
        }
        userData.region = normalizeRegion(userData.region);
        userData.referrals.link = 'tish.store/ref/' + userData.referrals.myCode;
        save();
    }
    function genCode(seed){
        const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let state=0;
        const src=String(seed||'')+Date.now().toString(36)+Math.random().toString(36).slice(2);
        for(let i=0;i<src.length;i++)state=((state*31)+src.charCodeAt(i))>>>0;
        let r='TISH-';
        for(let i=0;i<6;i++){
            state=((state*1664525)+1013904223)>>>0;
            r+=chars[state%chars.length];
        }
        return r;
    }
    function normalizeRegion(region){const r=String(region||'').trim().toUpperCase();return r==='RU'||r==='OTHER'?r:null;}
    function isNewUser(){return!userData.name;}
    function isSetupDone(){return!!(userData.name&&userData.avatar&&userData.bio&&userData.tags&&userData.tags.length>0);}
    function getLvl(l){return LEVEL_NAMES[Math.min(l-1,LEVEL_NAMES.length-1)]||'Новичок';}
    function fmtDate(d){if(!d)return'';const dt=new Date(d);const m=['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];return`${dt.getDate()} ${m[dt.getMonth()]} ${dt.getFullYear()}`;}
    function getPreferredCurrencyCode(){return normalizeRegion(userData?.region)==='RU'?'RUB':'USD';}
    function getCurrencySymbol(code){return code==='RUB'?'₽':'$';}
    function formatUserMoney(v,withCode=false){const code=getPreferredCurrencyCode();const n=Math.max(0,Math.round(Number(v||0)));const s=String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');return withCode?`${getCurrencySymbol(code)}${s} ${code}`:`${getCurrencySymbol(code)}${s}`;}
    function getAchievementDescription(a){if(!a)return'';if(a.id==='big_spender')return`Потратьте ${formatUserMoney(500)}`;return a.description||'';}

    function getMonthKey(date = new Date()) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }

    function getMonthlyShopPurchase(monthKey = getMonthKey()) {
        const purchases = Array.isArray(userData?.tisharaShopPurchases) ? userData.tisharaShopPurchases : [];
        return purchases.find((p) => p && p.monthKey === monthKey) || null;
    }

    function getMonthlyLimitResetDate(monthKey = getMonthKey()) {
        const [yearRaw, monthRaw] = String(monthKey || '').split('-');
        const year = parseInt(yearRaw, 10);
        const month = parseInt(monthRaw, 10);
        if (!Number.isFinite(year) || !Number.isFinite(month)) return new Date();
        return new Date(year, month, 1);
    }

    function normalizeShopItem(raw, index) {
        const percent = parseInt(raw?.percent, 10);
        const cost = parseInt(raw?.cost, 10);
        if (!Number.isFinite(percent) || percent <= 0 || !Number.isFinite(cost) || cost <= 0) return null;
        const fallbackId = `shop_${index + 1}_${percent}_${cost}`;
        const name = String(raw?.name || `Скидка ${percent}%`).trim() || `Скидка ${percent}%`;
        const description = String(raw?.description || 'Персональный промокод').trim() || 'Персональный промокод';
        return {
            id: String(raw?.id || fallbackId),
            name,
            percent,
            cost,
            icon: String(raw?.icon || 'tag'),
            description,
            active: raw?.active !== false
        };
    }

    function getTisharaShopProducts() {
        let items = null;
        try {
            if (typeof Storage !== 'undefined' && Storage.get) {
                items = Storage.get(TISHARA_SHOP_KEY, null);
            }
            if (!Array.isArray(items)) {
                const raw = localStorage.getItem(TISHARA_SHOP_KEY);
                items = raw ? JSON.parse(raw) : null;
            }
        } catch(e) {
            items = null;
        }

        const src = Array.isArray(items) && items.length > 0 ? items : DEFAULT_TISHARA_SHOP;
        const normalized = src.map(normalizeShopItem).filter(Boolean);
        return normalized.length > 0
            ? normalized
            : DEFAULT_TISHARA_SHOP.map((item) => ({ ...item }));
    }

    function getPersonalCodePrefix() {
        const base = String(userData?.googleId || userData?.username || userData?.email || userData?.joinDate || 'USER')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');
        return (base.slice(-6) || 'USER00').padStart(6, 'X');
    }

    function generatePersonalDiscountCode(item) {
        const percentPart = String(Math.max(0, parseInt(item?.percent, 10) || 0)).padStart(2, '0');
        const monthPart = getMonthKey().replace('-', '');
        const ownerPart = getPersonalCodePrefix();
        const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
        return `TSH${percentPart}-${ownerPart}-${monthPart}-${randomPart}`;
    }

    function paginateItems(items, listKey) {
        const safeItems = Array.isArray(items) ? items : [];
        const totalItems = safeItems.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / LIST_PAGE_SIZE));
        const currentPage = Math.min(Math.max(listPageState[listKey] || 1, 1), totalPages);
        listPageState[listKey] = currentPage;
        const start = (currentPage - 1) * LIST_PAGE_SIZE;
        return {
            items: safeItems.slice(start, start + LIST_PAGE_SIZE),
            page: currentPage,
            totalPages,
            totalItems
        };
    }

    function renderListPagination(listKey, page, totalPages, totalItems) {
        if (totalItems <= LIST_PAGE_SIZE) return '';
        const from = (page - 1) * LIST_PAGE_SIZE + 1;
        const to = Math.min(totalItems, page * LIST_PAGE_SIZE);
        const prevPage = page - 1;
        const nextPage = page + 1;
        return `
            <div class="profile-pagination" role="navigation" aria-label="Пагинация списка">
                <span class="profile-pagination__info">${from}-${to} из ${totalItems}</span>
                <div class="profile-pagination__controls">
                    <button class="profile-pagination__btn" ${page===1?'disabled':''} onclick="Profile.setListPage('${listKey}', ${prevPage})">Назад</button>
                    <span class="profile-pagination__page">${page} / ${totalPages}</span>
                    <button class="profile-pagination__btn" ${page===totalPages?'disabled':''} onclick="Profile.setListPage('${listKey}', ${nextPage})">Вперёд</button>
                </div>
            </div>`;
    }

    function setListPage(listKey, pageNumber) {
        if (!Object.prototype.hasOwnProperty.call(listPageState, listKey)) return;
        const parsed = parseInt(pageNumber, 10);
        listPageState[listKey] = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
        if (listKey === 'orders') { renderOrders(); return; }
        if (listKey === 'favorites') { renderFavs(); return; }
        if (listKey === 'reviews') { renderReviews(); return; }
        if (listKey === 'nft') { renderNftCollection(); }
    }

    function addXP(a){userData.xp+=a;while(userData.xp>=userData.maxXp){userData.xp-=userData.maxXp;userData.level++;userData.maxXp=Math.floor(userData.maxXp*1.5);App.showToast(`🎉 Уровень ${userData.level} — ${getLvl(userData.level)}!`,'success',5000);}save();}
    function addTishara(a,r){userData.tishara+=a;userData.tisharaHistory.unshift({type:r,label:r,value:a,date:new Date().toISOString().split('T')[0]});if(userData.tisharaHistory.length>50)userData.tisharaHistory=userData.tisharaHistory.slice(0,50);save();}
    function checkAch(){ALL_ACHIEVEMENTS.forEach(a=>{if(!userData.achievements.includes(a.id)&&a.condition(userData)){userData.achievements.push(a.id);addXP(a.xp);addTishara(a.tishara,a.name);App.showToast(`🏆 ${a.name}! +${a.xp} XP`,'success',4000);}});save();}

    // ===== AVATAR SYNC =====
    function syncAvatar(){
        const avatarSrc=String(userData?.avatar||'').trim();
        const hasAvatar=!!avatarSrc&&avatarSrc!=='null'&&avatarSrc!=='undefined';
        [document.querySelector('#navAvatar'),document.querySelector('.sidebar__user-avatar')].forEach(c=>{
            if(!c)return;
            const old=c.querySelector('img.global-avatar');
            const icon=c.querySelector('svg');
            if(hasAvatar){
                if(old){
                    old.src=avatarSrc;
                }else{
                    const img=document.createElement('img');
                    img.src=avatarSrc;
                    img.className='global-avatar';
                    img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%;position:absolute;inset:0;z-index:2;';
                    img.onerror=()=>{img.remove();if(icon)icon.style.opacity='1';};
                    c.style.position='relative';
                    c.appendChild(img);
                }
                if(icon)icon.style.opacity='0';
            }else{
                if(old)old.remove();
                if(icon)icon.style.opacity='1';
            }
        });
        const sn=document.getElementById('sidebarUserName');if(sn)sn.textContent=userData.name||'Пользователь';
        const sr=document.getElementById('sidebarUserRole');if(sr)sr.textContent=`Ур. ${userData.level} • ${getLvl(userData.level)}`;
    }

    function syncFavs(){
        if(typeof App==='undefined'||!App.getFavorites)return;
        const appFavs=App.getFavorites();
        const prods=typeof Catalog!=='undefined'&&Catalog.getProducts?Catalog.getProducts():[];
        const nf=[];appFavs.forEach(id=>{const p=prods.find(x=>x.id===id);if(p)nf.push({id:p.id,name:p.title,price:p.price,gradient:p.gradient,alert:p.badge==='sale'?'sale':null,alertText:p.badge==='sale'?'Скидка':null});});
        userData.favorites=nf;save();
    }

    function trackView(pid){
        if(!userData)return;const prods=typeof Catalog!=='undefined'&&Catalog.getProducts?Catalog.getProducts():[];
        const p=prods.find(x=>x.id===pid);if(!p)return;
        userData.browsingHistory=userData.browsingHistory.filter(h=>h.id!==pid);
        userData.browsingHistory.unshift({id:pid,name:p.title,time:'Только что',gradient:p.gradient});
        if(userData.browsingHistory.length>20)userData.browsingHistory=userData.browsingHistory.slice(0,20);save();
    }

    // ===== MODALS =====
    function openModal(id){const m=document.getElementById(id);if(!m)return;m.classList.add('is-open');document.body.style.overflow='hidden';activeModal=id;setTimeout(()=>{const inp=m.querySelector('input:not([type=hidden]),textarea');if(inp)inp.focus();},300);}
    function closeModal(id){const m=document.getElementById(id||activeModal);if(!m)return;m.classList.remove('is-open');document.body.style.overflow='';activeModal=null;}
    function closeAllModals(){document.querySelectorAll('.profile-modal.is-open').forEach(m=>m.classList.remove('is-open'));document.body.style.overflow='';activeModal=null;}

    // ===== EDIT PROFILE =====
    function openEditProfile(){document.getElementById('editName').value=userData.name||'';document.getElementById('editUsername').value=userData.username||'';document.getElementById('editBio').value=userData.bio||'';renderTagSel();openModal('editProfileModal');}
    function saveEditProfile(){
        const n=document.getElementById('editName').value.trim(),
            u=document.getElementById('editUsername').value.trim().replace('@',''),
            b=document.getElementById('editBio').value.trim();
        
        if(!n){App.showToast('Введите имя','warning');return;}
        
        userData.name=n;
        userData.username=u;
        userData.bio=b;
        
        const t=[];
        document.querySelectorAll('#tagSelector .profile-tag-option.selected')
            .forEach(x=>t.push(x.dataset.tag));
        userData.tags=t;
        
        save();
        checkAch();
        renderAll();
        closeModal('editProfileModal');
        App.showToast('Профиль обновлён! ✨','success');

        // ✅ Dispatch события для синхронизации с другими модулями
        document.dispatchEvent(new CustomEvent('profileUpdated', {
            detail: { profile: userData }
        }));
    }
    function renderTagSel(){const c=document.getElementById('tagSelector');if(!c)return;c.innerHTML=AVAILABLE_TAGS.map(t=>`<button type="button" class="profile-tag-option ${(userData.tags||[]).includes(t)?'selected':''}" data-tag="${t}" onclick="Profile.toggleTag(this)">${t}</button>`).join('');}
    function toggleTag(el){el.classList.toggle('selected');}

    // ===== AVATAR =====
    function openAvatarUpload(){const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=e=>{const f=e.target.files[0];if(!f)return;if(f.size>5*1024*1024){App.showToast('Макс 5МБ','error');return;}const r=new FileReader();r.onload=ev=>{userData.avatar=ev.target.result;save();renderAll();syncAvatar();App.showToast('Аватар обновлён! 📸','success');};r.readAsDataURL(f);};inp.click();}

    // ===== BANNER =====
    function openBannerModal(){renderBannerOpts();openModal('bannerModal');}
    function renderBannerOpts(){const c=document.getElementById('bannerOptions');if(!c)return;c.innerHTML=BANNER_STYLES.map(b=>`<div class="banner-option ${userData.bannerStyle===b.id?'active':''}" onclick="Profile.selectBanner('${b.id}')" data-banner-id="${b.id}"><div class="banner-option__preview" style="background:${b.gradient};background-size:400% 400%"></div><div class="banner-option__name">${b.name}</div></div>`).join('');}
    function selectBanner(id){userData.bannerStyle=id;save();document.querySelectorAll('.banner-option').forEach(b=>b.classList.remove('active'));document.querySelector(`[data-banner-id="${id}"]`)?.classList.add('active');applyBanner();App.showToast('Обложка обновлена!','success');}
    function applyBanner(){const bg=document.querySelector('.profile-banner-bg');if(!bg)return;const s=BANNER_STYLES.find(b=>b.id===userData.bannerStyle);if(s){bg.style.background=s.gradient;bg.style.backgroundSize='400% 400%';}}

    // ===== CUSTOMIZATION =====
    function openCustomizationModal(){renderAccents();renderThemes();openModal('customizationModal');}
    function renderAccents(){const c=document.getElementById('accentColorPicker');if(!c)return;c.innerHTML=ACCENT_COLORS.map(a=>`<button class="accent-color-btn ${userData.accentColor===a.color?'active':''}" style="background:${a.color}" data-tooltip="${a.name}" onclick="Profile.selectAccent('${a.color}')">${userData.accentColor===a.color?ic('check'):''}</button>`).join('');}
    function selectAccent(color){userData.accentColor=color;save();renderAccents();applyAccent();App.showToast('Акцент обновлён!','success');}
    function applyAccent(){
        document.querySelectorAll('#page-profile .profile-stat__value').forEach(el=>el.style.color=userData.accentColor);
        document.querySelectorAll('#page-profile .profile-tag').forEach(el=>{el.style.color=userData.accentColor;el.style.borderColor=userData.accentColor+'22';el.style.background=userData.accentColor+'11';});
        const h=document.querySelector('.profile-avatar-halo');if(h)h.style.background=`conic-gradient(from 0deg,transparent 0%,${userData.accentColor}66 25%,transparent 50%,${userData.accentColor}66 75%,transparent 100%)`;
    }
    function renderThemes(){
        const TH=[{id:'default',name:'Стандарт',bg:'#fff'},{id:'warm',name:'Тёплый',bg:'#fffbeb'},{id:'ocean',name:'Океан',bg:'#f0f9ff'},{id:'dark',name:'Тёмный',bg:'#1e1b4b'}];
        const c=document.getElementById('themeOptions');if(!c)return;c.innerHTML=TH.map(t=>`<div class="theme-option ${userData.profileTheme===t.id?'active':''}" onclick="Profile.selectTheme('${t.id}')"><div class="theme-option__preview" style="background:${t.bg};border:1px solid #e5e7eb"></div><div class="theme-option__name">${t.name}</div></div>`).join('');
    }
    function selectTheme(id){userData.profileTheme=id;save();renderThemes();applyTheme();App.showToast('Тема обновлена!','success');}
    function applyTheme(){const p=document.querySelector('.profile-page');if(!p)return;p.classList.remove('theme-default','theme-warm','theme-ocean','theme-dark');p.classList.add('theme-'+(userData.profileTheme||'default'));}

    // ===== LEVELS =====
    function openLevelsModal(){const c=document.getElementById('levelsListContainer');if(!c)return;c.innerHTML=LEVEL_REWARDS.map(l=>`<div class="level-row ${l.level===userData.level?'current':''} ${l.level<userData.level?'completed':''} ${l.level>userData.level?'locked':''}"><div class="level-row__num">${l.level}</div><div class="level-row__info"><div class="level-row__name">${l.name}</div><div class="level-row__reward">${l.reward}</div></div><div class="level-row__status">${l.level<userData.level?'✅':l.level===userData.level?'← Вы':'🔒'}</div></div>`).join('');openModal('levelsModal');}

    // ===== REVIEWS =====
    function _idEq(a, b) {
        return String(a ?? '') === String(b ?? '');
    }

    function _ensureUserDataReady() {
        if (!userData || typeof userData !== 'object') {
            load();
        }
        userData.purchases = extractArray(userData.purchases, []);
        userData.reviews = extractArray(userData.reviews, []);
        userData.achievements = extractArray(userData.achievements, []);
        userData.tisharaHistory = extractArray(userData.tisharaHistory, []);
        userData.browsingHistory = extractArray(userData.browsingHistory, []);
        userData.favorites = extractArray(userData.favorites, []);
        userData.nftCollection = extractArray(userData.nftCollection, []);
        return userData;
    }

    function openWriteReview(pid, productName, orderId) {
        _ensureUserDataReady();

        const orders = readStoredArray('tish_orders');

        if (orderId) {
            const linked = orders.find(o => _idEq(o.id, orderId));
            if (!linked) {
                App.showToast('Заказ для отзыва не найден', 'warning');
                return;
            }
            if (linked.status !== 'completed') {
                App.showToast('Оставить отзыв можно только после полной оплаты и завершения заказа', 'warning');
                return;
            }
        }

        if (!orderId && pid && pid !== 'null' && pid !== '') {
            const related = orders.filter(o => _idEq(o.productId, pid));
            if (related.length > 0 && !related.some(o => o.status === 'completed')) {
                App.showToast('Нельзя оставить отзыв до завершения заказа', 'warning');
                return;
            }
        }

        _pendingReviewOrderId = orderId || null;
        _pendingReviewProductName = productName || null;

        let p = null;
        if (pid && pid !== 'null' && pid !== '') {
            p = userData.purchases.find(x => _idEq(x.id, pid));
        }
        const name = p ? p.name : (productName || 'Товар');
        const actualPid = p ? p.id : (pid || orderId || Date.now().toString());

        document.getElementById('reviewProductName').textContent = name;
        document.getElementById('reviewProductId').value = String(actualPid);
        document.getElementById('reviewText').value = '';
        document.getElementById('reviewRatingValue').value = 5;
        document.querySelectorAll('#reviewStars .review-star').forEach((s,i) =>
            s.classList.toggle('active', i < 5));
        openModal('reviewModal');
    }
    function setReviewRating(r){document.getElementById('reviewRatingValue').value=r;document.querySelectorAll('#reviewStars .review-star').forEach((s,i)=>s.classList.toggle('active',i<r));}
    async function submitReview(){
        _ensureUserDataReady();
        const pidRaw = document.getElementById('reviewProductId').value;
        const pid = (pidRaw !== undefined && pidRaw !== null) ? String(pidRaw).trim() : '';
        const rating=parseInt(document.getElementById('reviewRatingValue').value);
        const text=document.getElementById('reviewText').value.trim();
        if(!text){App.showToast('Напишите отзыв','warning');return;}
        const p=userData.purchases.find(x=>_idEq(x.id,pid));

        let orders = readStoredArray('tish_orders');
        const linkedOrder = _pendingReviewOrderId ? orders.find(o => _idEq(o.id, _pendingReviewOrderId)) : null;
        const relatedOrders = linkedOrder ? [linkedOrder] : orders.filter(o => _idEq(o.productId, pid));
        const hasCompletedOrder = relatedOrders.some(o => o.status === 'completed');

        if (linkedOrder && linkedOrder.status !== 'completed') {
            App.showToast('Отзыв можно оставить только после завершения заказа', 'warning');
            return;
        }
        if (!linkedOrder && relatedOrders.length > 0 && !hasCompletedOrder) {
            App.showToast('Сначала завершите заказ, затем оставляйте отзыв', 'warning');
            return;
        }
        if (!linkedOrder && relatedOrders.length === 0 && !p) {
            App.showToast('Нельзя оставить отзыв без оплаченного заказа', 'warning');
            return;
        }

        const normalizedRating = Number.isNaN(rating) ? 5 : Math.max(1, Math.min(5, rating));
        const authorName = String(userData.name || userData.username || userData.email || '').trim() || 'Пользователь';
        const authorLogin = String(userData.username || '').trim();
        const authorEmail = String(userData.email || '').trim();
        const authorGoogleId = String(userData.googleId || '').trim();
        
        // Review goes to pending moderation - NOT published immediately
        userData.reviews.unshift({
            id: Date.now(),
            productId: pid || null,
            product: p ? p.name : (_pendingReviewProductName || ''),
            orderId: _pendingReviewOrderId || null,
            userName: authorName,
            userLogin: authorLogin,
            userEmail: authorEmail,
            userGoogleId: authorGoogleId,
            rating: normalizedRating,
            text,
            date: new Date().toISOString().split('T')[0],
            status: 'pending_moderation' // NEW: pending | approved | rejected
        });
        
        if(p) p.reviewed = true;
        addXP(15);
        addTishara(5,'Отзыв');
        save();
        checkAch();
        renderReviews();
        renderOrders();
        closeModal('reviewModal');
        // Синхронизация reviewed-флага заказа
        try {
            if (_pendingReviewOrderId) {
                const orders = readStoredArray('tish_orders');
                let changed = false;
                orders.forEach((o) => {
                    if (_idEq(o.id, _pendingReviewOrderId) && o.status === 'completed' && !o.reviewed) {
                        o.reviewed = true;
                        changed = true;
                    }
                });
                if (changed) {
                    localStorage.setItem('tish_orders', JSON.stringify(orders));
                    if (typeof Storage !== 'undefined' && Storage.set) Storage.set('tish_orders', orders);
                }
            }
            save();
        } catch(e) {}

        if (typeof ReviewCounts !== 'undefined' && typeof ReviewCounts.onReviewStatusChanged === 'function') {
            ReviewCounts.onReviewStatusChanged();
        }
        if (typeof Catalog !== 'undefined' && typeof Catalog.renderCatalog === 'function') {
            Catalog.renderCatalog();
        }

        // Обновить чат, чтобы кнопка "Оставить отзыв" сменилась на "Спасибо за отзыв"
        if (typeof Chat !== 'undefined' && Chat.refreshActiveChat) {
            try { Chat.refreshActiveChat(); } catch(e) {}
        }

        _pendingReviewOrderId = null;
        _pendingReviewProductName = null;

        // Гарантируем немедленную отправку на сервер
        if (typeof Storage !== 'undefined' && Storage.forceSync) {
            try { await Storage.forceSync(); } catch(e) {}
        }

        App.showToast('Отзыв отправлен на модерацию! Администратор проверит его.', 'info', 5000);
    }

    // ===== TISHARA =====
    function openSpendTishara(){renderShop();openModal('tisharaSpendModal');}
    function renderShop(){
        const c=document.getElementById('tisharaShopItems');if(!c)return;
        const items=getTisharaShopProducts().filter(it=>it.active!==false);
        if(items.length===0){
            c.innerHTML=`<div class="profile-empty"><div class="profile-empty__icon">${ic('gift')}</div><div class="profile-empty__title">Пока нет товаров</div><div class="profile-empty__desc">Администратор скоро добавит предложения в магазин TISHARA</div></div>`;
            return;
        }

        const monthKey=getMonthKey();
        const monthlyPurchase=getMonthlyShopPurchase(monthKey);
        const isMonthLocked=!!monthlyPurchase;
        const nextDate=fmtDate(getMonthlyLimitResetDate(monthKey));
        const lockNotice=isMonthLocked
            ?`<div style="padding:10px 12px;margin-bottom:10px;border-radius:12px;background:rgba(249,115,22,0.12);border:1px solid rgba(249,115,22,0.28);font-size:0.78rem;color:#f97316;line-height:1.45">Лимит: 1 покупка в месяц уже использована. Следующая покупка будет доступна ${nextDate}.</div>`
            :'';

        c.innerHTML=lockNotice+items.map(it=>{
            const notEnough=userData.tishara<it.cost;
            const disabled=isMonthLocked||notEnough;
            const btnLabel=isMonthLocked?'Лимит':(notEnough?'Мало':'Купить');
            const desc=`${it.description||'Персональный промокод'} - 1 раз в месяц`;
            return`<div class="tishara-shop-item ${disabled?'locked':''}"><div class="tishara-shop-item__icon">${ic(it.icon)}</div><div class="tishara-shop-item__info"><div class="tishara-shop-item__name">${it.name}</div><div class="tishara-shop-item__desc">${desc}</div></div><div class="tishara-shop-item__cost">${it.cost} ✦</div><button class="tishara-shop-item__btn ${disabled?'disabled':''}" onclick="Profile.buyDiscount('${it.id}')" ${disabled?'disabled':''}>${btnLabel}</button></div>`;
        }).join('');
    }
    function buyDiscount(sid){
        const it=getTisharaShopProducts().find(x=>String(x.id)===String(sid)&&x.active!==false);
        if(!it){App.showToast('Товар недоступен','warning');return;}

        const monthKey=getMonthKey();
        if(getMonthlyShopPurchase(monthKey)){
            const nextDate=fmtDate(getMonthlyLimitResetDate(monthKey));
            App.showToast(`Лимит исчерпан. Следующая покупка: ${nextDate}`,'warning',4500);
            renderShop();
            return;
        }

        if(userData.tishara<it.cost){App.showToast('Недостаточно TISHARA','warning');return;}

        userData.tishara-=it.cost;
        const code=generatePersonalDiscountCode(it);
        const purchaseDate=new Date().toISOString().split('T')[0];
        const issuedFor=String(userData.googleId||userData.email||userData.username||'local');

        userData.discounts.push({
            id:Date.now(),
            name:it.name,
            percent:it.percent,
            source:'TISHARA',
            active:true,
            code,
            personal:true,
            issuedFor,
            issuedMonth:monthKey,
            shopItemId:it.id
        });

        userData.tisharaShopPurchases.unshift({
            id:Date.now()+1,
            shopItemId:it.id,
            monthKey,
            percent:it.percent,
            cost:it.cost,
            code,
            date:purchaseDate
        });
        if(userData.tisharaShopPurchases.length>36)userData.tisharaShopPurchases=userData.tisharaShopPurchases.slice(0,36);

        userData.tisharaHistory.unshift({type:'spend',label:it.name,value:-it.cost,date:new Date().toISOString().split('T')[0]});
        save();renderShop();renderAll();App.showToast(`${it.name} оформлена! Код: ${code}`,'success',6500);
    }
    function openTisharaHistory(){
        const c=document.getElementById('tisharaHistoryList');if(!c)return;
        c.innerHTML=userData.tisharaHistory.length===0?'<div class="profile-empty"><div class="profile-empty__title">Пусто</div></div>':
        userData.tisharaHistory.map(it=>`<div class="tishara-history-item"><div class="tishara-history-item__label">${it.label}</div><div class="tishara-history-item__date">${fmtDate(it.date)}</div><div class="tishara-history-item__value ${it.value>0?'positive':'negative'}">${it.value>0?'+':''}${it.value} ✦</div></div>`).join('');
        openModal('tisharaHistoryModal');
    }

    // ===== GIFTS =====
    function openGiftsModal(){
        const c=document.getElementById('giftsListContainer');if(!c)return;
        const g=userData.discounts||[];
        if(g.length===0){
            c.innerHTML=`<div class="profile-empty"><div class="profile-empty__icon">${ic('gift')}</div><div class="profile-empty__title">Нет подарков</div><div class="profile-empty__desc">Обменяйте TISHARA на скидки!</div><button class="btn btn-primary btn-sm" onclick="Profile.closeModal('giftsModal');Profile.openSpendTishara()">Магазин TISHARA</button></div>`;
        } else {
            c.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">${g.map(d=>{
                const isActive=d.active;
                const gradients=['linear-gradient(135deg,#8b5cf6,#d946ef)','linear-gradient(135deg,#3b82f6,#06b6d4)','linear-gradient(135deg,#f97316,#ec4899)','linear-gradient(135deg,#22c55e,#14b8a6)'];
                const grad=gradients[Math.abs(((d.id||0)%gradients.length))];
                return`<div style="background:var(--color-bg-card);border-radius:16px;border:1px solid ${isActive?'rgba(139,92,246,0.15)':'rgba(255,255,255,0.05)'};overflow:hidden;opacity:${isActive?'1':'0.5'};transition:all 0.3s">
                    <div style="height:6px;background:${isActive?grad:'var(--color-bg-muted)'}"></div>
                    <div style="padding:16px">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                            <div style="width:44px;height:44px;border-radius:12px;background:${isActive?grad:'var(--color-bg-muted)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                                <span style="font-size:1.1rem;${isActive?'':'filter:grayscale(1)'}">${d.percent?'%':'🎁'}</span>
                            </div>
                            <div style="flex:1;min-width:0">
                                <div style="font-weight:700;font-size:0.9rem;margin-bottom:2px">${d.name}</div>
                                <div style="font-size:0.72rem;color:var(--color-muted)">От: ${d.source||'TISH STORE'}</div>
                            </div>
                            <div style="padding:4px 10px;border-radius:20px;font-size:0.65rem;font-weight:700;background:${isActive?'rgba(34,197,94,0.1)':'rgba(255,255,255,0.05)'};color:${isActive?'#22c55e':'var(--color-muted)'}">${isActive?'Активна':'Использован'}</div>
                        </div>
                        ${d.code?`<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(139,92,246,0.05);border-radius:10px;border:1px dashed rgba(139,92,246,0.15)">
                            <span style="font-family:var(--font-mono);font-size:0.82rem;font-weight:700;letter-spacing:0.05em;flex:1">${d.code}</span>
                            ${isActive?`<button onclick="event.stopPropagation();App.copyToClipboard('${d.code}')" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--purple-500)">${ic('copy')}</button>`:''}
                        </div>`:''}
                    </div>
                </div>`;
            }).join('')}</div>`;
        }
        openModal('giftsModal');
    }

    // ===== REFERRAL =====
    function applyRefCode(){
        const inp=document.getElementById('referralCodeInput');if(!inp)return;
        const code=inp.value.trim().toUpperCase().replace(/[^A-Z0-9\-]/g,'');
        if(!code||code.length<4){App.showToast('Введите код (мин. 4 символа)','warning');return;}
        if(!userData.referrals)userData.referrals={invited:0,earned:0,link:'',myCode:'',usedCodes:[],history:[]};
        if(!userData.referrals.usedCodes)userData.referrals.usedCodes=[];
        if(code===userData.referrals.myCode){App.showToast('Нельзя использовать свой код','error');return;}
        if(userData.referrals.usedCodes.includes(code)){App.showToast('Этот код уже использован','warning');return;}
        userData.referrals.usedCodes.push(code);addTishara(30,'Код: '+code);addXP(20);inp.value='';save();renderAll();
        App.showToast('Код применён! +30 TISHARA ✦','success');
    }
    function editMyRefCode(){
        App.showToast('Реферальный код назначается автоматически и не редактируется', 'info');
    }
    function copyRefLink(){const inp=document.querySelector('#page-profile .referral-link-input');if(inp)App.copyToClipboard(inp.value);}

    // ===== SETTINGS =====
    function openSettings(t){switch(t){case'edit':openEditProfile();break;case'security':App.showToast('В разработке 🔒','info');break;case'notifications':openNotifSet();break;case'customization':openCustomizationModal();break;case'logout':if(typeof Auth!=='undefined'&&Auth.logout){Auth.logout();}break;}}
    function openNotifSet(){document.getElementById('notifPurchases').checked=userData.settings.notifications;document.getElementById('notifPublicProfile').checked=userData.settings.publicProfile;document.getElementById('notifShowHistory').checked=userData.settings.showHistory;openModal('notificationSettingsModal');}
    function saveNotifSettings(){userData.settings.notifications=document.getElementById('notifPurchases').checked;userData.settings.publicProfile=document.getElementById('notifPublicProfile').checked;userData.settings.showHistory=document.getElementById('notifShowHistory').checked;save();closeModal('notificationSettingsModal');App.showToast('Сохранено ✅','success');}
    function resetProfile(){openModal('confirmResetModal');}
    function confirmReset(){userData={...DEFAULT_USER,joinDate:new Date().toISOString()};userData.referrals.myCode=genCode();userData.referrals.link='tish.store/ref/'+userData.referrals.myCode;save();closeAllModals();renderAll();syncAvatar();App.showToast('Профиль сброшен','info');}

    // ===== ACTIONS =====
    function downloadPurchase(id){const p=userData.purchases.find(x=>x.id===id);if(p){p.downloaded=true;save();App.showToast(`Скачивание "${p.name}"... 📥`,'success');}}
    function openPurchase(id){if(typeof Catalog!=='undefined'&&Catalog.openModal)Catalog.openModal(id);else App.showToast('Открытие...','info');}
    function removeFav(id){userData.favorites=(userData.favorites||[]).filter(f=>f.id!==id);if(typeof App!=='undefined'&&App.state&&App.state.favorites)App.state.favorites.delete(id);save();renderFavs();App.showToast('Убрано','info');}
    function clearHistory(){userData.browsingHistory=[];save();renderHistory();App.showToast('Очищено','info');}

    // =====================================================
    // NEW: NFT SYSTEM
    // =====================================================
    
    function getNftById(nftId) {
        return (userData.nftCollection || []).find(n => n.id === nftId);
    }

    function getRarityInfo(rarity) {
        return NFT_RARITIES[rarity] || NFT_RARITIES.common;
    }

    // Generate NFT animation HTML (CSS-based animated card)
    function renderNftAnimation(nft, size = 'medium') {
        const r = getRarityInfo(nft.rarity);
        const sizes = {
            tiny: { w: 32, h: 32, fontSize: '0.6rem', stickerSize: '16px' },
            small: { w: 60, h: 60, fontSize: '0.7rem', stickerSize: '24px' },
            medium: { w: 120, h: 140, fontSize: '0.85rem', stickerSize: '40px' },
            large: { w: 200, h: 240, fontSize: '1.1rem', stickerSize: '60px' }
        };
        const s = sizes[size] || sizes.medium;
        
        return `
            <div class="nft-animation nft-animation--${size} nft-rarity--${nft.rarity}" 
                 style="width:${s.w}px;height:${s.h}px;--nft-color:${nft.color};--nft-glow:${r.glow}">
                <div class="nft-animation__bg" style="background:${r.gradient}"></div>
                <div class="nft-animation__particles">
                    ${Array.from({length: size === 'large' ? 12 : 6}, () => '<div class="nft-particle"></div>').join('')}
                </div>
                <div class="nft-animation__sticker" style="font-size:${s.stickerSize}">${nft.sticker || '✨'}</div>
                <div class="nft-animation__ring"></div>
                ${nft.rarity === 'legendary' || nft.rarity === 'mythic' ? '<div class="nft-animation__shine"></div>' : ''}
            </div>
        `;
    }

    // Render NFT collection in profile
    function renderNftCollection() {
        const c = document.getElementById('nftCollectionGrid');
        if (!c) return;
        
        const nfts = userData.nftCollection || [];
        
        if (nfts.length === 0) {
            c.innerHTML = `
                <div class="profile-empty" style="grid-column:1/-1">
                    <div class="profile-empty__icon">${ic('hexagon')}</div>
                    <div class="profile-empty__title">Нет NFT</div>
                    <div class="profile-empty__desc">Откройте кейсы в NFT-магазине, чтобы получить уникальные NFT!</div>
                    <button class="btn btn-primary btn-sm" onclick="App.showToast('NFT-магазин скоро откроется! 🎮','info')">
                        NFT Магазин (скоро)
                    </button>
                </div>`;
            return;
        }

        const paged = paginateItems(nfts, 'nft');
        
        c.innerHTML = paged.items.map((nft, i) => {
            const r = getRarityInfo(nft.rarity);
            const safeNftId = escapeAttr(String(nft.id || ''));
            return `
                <div class="nft-card p-reveal p-reveal-delay-${Math.min(i + 1, 12)}" 
                     onclick="Profile.openNftDetail('${safeNftId}')"
                     style="--nft-color:${nft.color}">
                    <div class="nft-card__rarity-indicator" style="background:${r.gradient}"></div>
                    <div class="nft-card__preview">
                        ${renderNftAnimation(nft, 'medium')}
                    </div>
                    <div class="nft-card__info">
                        <div class="nft-card__name">${nft.name}</div>
                        <div class="nft-card__meta">
                            <span class="nft-card__rarity" style="color:${r.color}">${r.name}</span>
                            <span class="nft-card__price">${formatUserMoney(nft.price)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('') + renderListPagination('nft', paged.page, paged.totalPages, paged.totalItems);
        
        obs();
    }

    // Open NFT detail modal
    function openNftDetail(nftId) {
        const nft = getNftById(nftId);
        if (!nft) return;
        
        const r = getRarityInfo(nft.rarity);
        const c = document.getElementById('nftDetailContent');
        if (!c) return;
        
        c.innerHTML = `
            <div class="nft-detail">
                <div class="nft-detail__animation">
                    ${renderNftAnimation(nft, 'large')}
                </div>
                
                <div class="nft-detail__info">
                    <h3 class="nft-detail__name">${nft.name}</h3>
                    
                    <div class="nft-detail__meta-grid">
                        <div class="nft-detail__meta-item">
                            <span class="nft-detail__meta-label">Цена</span>
                            <span class="nft-detail__meta-value" style="color:${r.color}">${formatUserMoney(nft.price)}</span>
                        </div>
                        <div class="nft-detail__meta-item">
                            <span class="nft-detail__meta-label">Редкость</span>
                            <span class="nft-detail__meta-value">
                                <span class="nft-rarity-badge" style="background:${r.gradient};color:white;padding:2px 10px;border-radius:20px;font-size:0.75rem">${r.name}</span>
                            </span>
                        </div>
                        <div class="nft-detail__meta-item">
                            <span class="nft-detail__meta-label">Дата получения</span>
                            <span class="nft-detail__meta-value">${fmtDate(nft.dropDate)}</span>
                        </div>
                        <div class="nft-detail__meta-item">
                            <span class="nft-detail__meta-label">Источник</span>
                            <span class="nft-detail__meta-value">${nft.caseSource || 'Кейс'}</span>
                        </div>
                        <div class="nft-detail__meta-item">
                            <span class="nft-detail__meta-label">Цвет</span>
                            <span class="nft-detail__meta-value">
                                <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${nft.color};vertical-align:middle;margin-right:4px"></span>
                                ${nft.color}
                            </span>
                        </div>
                        <div class="nft-detail__meta-item">
                            <span class="nft-detail__meta-label">Стикер</span>
                            <span class="nft-detail__meta-value" style="font-size:1.4rem">${nft.sticker || '—'}</span>
                        </div>
                    </div>
                    
                    <div class="nft-detail__actions">
                        <button class="btn btn-primary btn-sm nft-detail__btn" onclick="Profile.nftSellStub()">
                            ${ic('dollar-sign')} Выставить на продажу
                        </button>
                        <button class="btn btn-secondary btn-sm nft-detail__btn" onclick="Profile.nftTradeStub()">
                            ${ic('swap')} Обмен
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        openModal('nftDetailModal');
    }

    // Stub functions for sell/trade
    function nftSellStub() {
        App.showToast('🔜 Маркетплейс NFT скоро будет доступен!', 'info', 4000);
    }

    function nftTradeStub() {
        App.showToast('🔜 Обмен NFT между пользователями скоро будет доступен!', 'info', 4000);
    }

    // Add NFT to collection (called from case opening)
    function addNft(nft) {
        if (!userData.nftCollection) userData.nftCollection = [];
        userData.nftCollection.push({
            ...nft,
            id: nft.id || 'nft_' + Date.now(),
            dropDate: nft.dropDate || new Date().toISOString().split('T')[0]
        });
        save();
        checkAch();
        renderNftCollection();
        App.showToast(`🎉 Новый NFT: ${nft.name}!`, 'success', 4000);
    }

    // Get user's NFT collection
    function getNftCollection() {
        return userData.nftCollection || [];
    }


        // =====================================================
    // NFT PROFILE CUSTOMIZATION
    // =====================================================

    // Temp state for customization modal
    let nftCustomTemp = null;

    function openNftCustomizationModal() {
        const nfts = userData.nftCollection || [];
        if (nfts.length === 0) {
            App.showToast('У вас нет NFT для кастомизации. Откройте кейсы!', 'info');
            return;
        }

        // Clone current settings
        nftCustomTemp = JSON.parse(JSON.stringify(userData.nftProfileSettings || {
            headerNfts: [], nicknameNft: null, headerBgColor: null,
            headerBgSticker: null, textColor: null
        }));

        renderNftCustomizationContent();
        openModal('nftCustomizationModal');
    }

    function renderNftCustomizationContent() {
        const c = document.getElementById('nftCustomizationContent');
        if (!c) return;
        const nfts = userData.nftCollection || [];

        c.innerHTML = `
            <!-- Section 1: Header color from NFT -->
            <div class="nft-custom-section">
                <h4 class="nft-custom-section__title">🎨 Цвет шапки от NFT</h4>
                <p class="nft-custom-section__desc">Выберите NFT, цвет которого станет цветом шапки профиля</p>
                <div class="nft-custom-options">
                    <div class="nft-custom-option ${!nftCustomTemp.headerBgColor ? 'active' : ''}"
                         onclick="Profile.setNftCustom('headerBgColor', null)">
                        <div class="nft-custom-option__preview" style="background:linear-gradient(135deg,#7c3aed,#d946ef)"></div>
                        <span>По умолчанию</span>
                    </div>
                    ${nfts.map(nft => `
                        <div class="nft-custom-option ${nftCustomTemp.headerBgColor === nft.color ? 'active' : ''}"
                             onclick="Profile.setNftCustom('headerBgColor', '${nft.color}')">
                            <div class="nft-custom-option__preview" style="background:${nft.color}"></div>
                            <span>${nft.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Section 2: Text color from NFT -->
            <div class="nft-custom-section">
                <h4 class="nft-custom-section__title">✏️ Цвет текста имени</h4>
                <p class="nft-custom-section__desc">Цвет вашего никнейма на основе NFT</p>
                <div class="nft-custom-options">
                    <div class="nft-custom-option ${!nftCustomTemp.textColor ? 'active' : ''}"
                         onclick="Profile.setNftCustom('textColor', null)">
                        <div class="nft-custom-option__preview" style="background:var(--color-text, #fff)"></div>
                        <span>По умолчанию</span>
                    </div>
                    ${nfts.map(nft => `
                        <div class="nft-custom-option ${nftCustomTemp.textColor === nft.color ? 'active' : ''}"
                             onclick="Profile.setNftCustom('textColor', '${nft.color}')">
                            <div class="nft-custom-option__preview" style="background:${nft.color}"></div>
                            <span>${nft.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Section 3: Sticker on banner background -->
            <div class="nft-custom-section">
                <h4 class="nft-custom-section__title">🖼️ Стикер на фон шапки</h4>
                <p class="nft-custom-section__desc">Стикер с NFT будет отображаться на заднем фоне шапки</p>
                <div class="nft-custom-options">
                    <div class="nft-custom-option ${!nftCustomTemp.headerBgSticker ? 'active' : ''}"
                         onclick="Profile.setNftCustom('headerBgSticker', null)">
                        <div class="nft-custom-option__preview nft-custom-option__preview--emoji">❌</div>
                        <span>Без стикера</span>
                    </div>
                    ${nfts.filter(n => n.sticker).map(nft => `
                        <div class="nft-custom-option ${nftCustomTemp.headerBgSticker === nft.sticker ? 'active' : ''}"
                             onclick="Profile.setNftCustom('headerBgSticker', '${nft.sticker}')">
                            <div class="nft-custom-option__preview nft-custom-option__preview--emoji">${nft.sticker}</div>
                            <span>${nft.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Section 4: Mini NFT next to nickname -->
            <div class="nft-custom-section">
                <h4 class="nft-custom-section__title">✨ NFT рядом с ником</h4>
                <p class="nft-custom-section__desc">Миниатюрная анимация NFT рядом с вашим именем</p>
                <div class="nft-custom-options">
                    <div class="nft-custom-option ${!nftCustomTemp.nicknameNft ? 'active' : ''}"
                         onclick="Profile.setNftCustom('nicknameNft', null)">
                        <div class="nft-custom-option__preview nft-custom-option__preview--emoji">❌</div>
                        <span>Без NFT</span>
                    </div>
                    ${nfts.map(nft => `
                        <div class="nft-custom-option ${nftCustomTemp.nicknameNft === nft.id ? 'active' : ''}"
                             onclick="Profile.setNftCustom('nicknameNft', '${nft.id}')">
                            <div class="nft-custom-option__preview nft-custom-option__preview--emoji">${nft.sticker || '✨'}</div>
                            <span>${nft.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Section 5: NFTs on banner (up to 6) -->
            <div class="nft-custom-section">
                <h4 class="nft-custom-section__title">🖥️ NFT на шапке (до 6)</h4>
                <p class="nft-custom-section__desc">Выберите NFT для отображения на шапке профиля с анимацией</p>
                <div class="nft-custom-options nft-custom-options--multi">
                    ${nfts.map(nft => {
                        const selected = (nftCustomTemp.headerNfts || []).includes(nft.id);
                        return `
                            <div class="nft-custom-option nft-custom-option--checkbox ${selected ? 'active' : ''}"
                                 onclick="Profile.toggleNftOnHeader('${nft.id}')">
                                <div class="nft-custom-option__check">${selected ? ic('check') : ''}</div>
                                <div class="nft-custom-option__preview nft-custom-option__preview--emoji">${nft.sticker || '✨'}</div>
                                <span>${nft.name}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="nft-custom-section__hint">
                    Выбрано: ${(nftCustomTemp.headerNfts || []).length} / 6
                </div>
            </div>
        `;
    }

    function setNftCustom(key, value) {
        if (!nftCustomTemp) return;
        nftCustomTemp[key] = value;
        renderNftCustomizationContent();
    }

    function toggleNftOnHeader(nftId) {
        if (!nftCustomTemp) return;
        if (!nftCustomTemp.headerNfts) nftCustomTemp.headerNfts = [];

        const idx = nftCustomTemp.headerNfts.indexOf(nftId);
        if (idx > -1) {
            nftCustomTemp.headerNfts.splice(idx, 1);
        } else {
            if (nftCustomTemp.headerNfts.length >= 6) {
                App.showToast('Максимум 6 NFT на шапке!', 'warning');
                return;
            }
            nftCustomTemp.headerNfts.push(nftId);
        }
        renderNftCustomizationContent();
    }

    function saveNftCustomization() {
        if (!nftCustomTemp) return;
        userData.nftProfileSettings = { ...nftCustomTemp };
        save();
        applyNftCustomization();
        closeModal('nftCustomizationModal');
        nftCustomTemp = null;
        App.showToast('NFT стиль профиля обновлён! ✨', 'success');
    }

    function applyNftCustomization() {
        const settings = userData.nftProfileSettings;
        if (!settings) return;

        const header = document.getElementById('profileHeaderBlock');
        if (!header) return;

        // 1. Header background color
        const bannerBg = header.querySelector('.profile-banner-bg');
        if (bannerBg && settings.headerBgColor) {
            bannerBg.style.background = `linear-gradient(-45deg, ${settings.headerBgColor}, ${adjustColor(settings.headerBgColor, -30)}, ${adjustColor(settings.headerBgColor, 30)}, ${settings.headerBgColor})`;
            bannerBg.style.backgroundSize = '400% 400%';
            header.classList.add('nft-color-applied');
        } else if (bannerBg && !settings.headerBgColor) {
            header.classList.remove('nft-color-applied');
            applyBanner(); // restore default
        }

        // 2. Text color
        const nameEl = header.querySelector('.profile-name');
        if (nameEl) {
            nameEl.style.color = settings.textColor || '';
        }

        // 3. Sticker overlay
        const stickerOverlay = document.getElementById('bannerStickerOverlay');
        if (stickerOverlay) {
            stickerOverlay.textContent = settings.headerBgSticker || '';
            stickerOverlay.style.display = settings.headerBgSticker ? '' : 'none';
        }

        // 4. Mini NFT next to nickname
        const miniContainer = document.getElementById('nicknameNftMini');
        if (miniContainer) {
            if (settings.nicknameNft) {
                const nft = getNftById(settings.nicknameNft);
                if (nft) {
                    miniContainer.innerHTML = renderNftAnimation(nft, 'tiny');
                } else {
                    miniContainer.innerHTML = '';
                }
            } else {
                miniContainer.innerHTML = '';
            }
        }

        // 5. NFTs on banner
        const slotsContainer = document.getElementById('bannerNftSlots');
        if (slotsContainer) {
            const headerNfts = settings.headerNfts || [];
            if (headerNfts.length === 0) {
                slotsContainer.innerHTML = '';
            } else {
                slotsContainer.innerHTML = headerNfts.map(nftId => {
                    const nft = getNftById(nftId);
                    if (!nft) return '';
                    return `<div class="profile-banner__nft-slot filled">${renderNftAnimation(nft, 'tiny')}</div>`;
                }).join('');
            }
        }
    }

    // Helper: adjust hex color brightness
    function adjustColor(hex, amount) {
        hex = hex.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    }
    // =====================================================
    // REGION
    // =====================================================

    // Добавить в DEFAULT_USER:
    // region: null,   // 'RU' | 'OTHER' | null

    // Добавить в DEMO_USER:
    // region: null,

    // Добавить функцию выбора региона:
    function openRegionModal() {
        const currentRegion = normalizeRegion(userData.region);
        
        const content = document.getElementById('regionModalContent');
        if (!content) {
            // Создаём модалку динамически
            const modal = document.createElement('div');
            modal.id = 'regionModal';
            modal.className = 'profile-modal';
            modal.innerHTML = `
                <div class="profile-modal__backdrop" onclick="Profile.closeModal('regionModal')"></div>
                <div class="profile-modal__container" style="max-width:440px">
                    <div class="profile-modal__header">
                        <h3>Выберите регион</h3>
                        <button class="profile-modal__close" onclick="Profile.closeModal('regionModal')">
                            ${ic('x')}
                        </button>
                    </div>
                    <div class="profile-modal__body" id="regionModalContent"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        const c = document.getElementById('regionModalContent');
        if (!c) return;
        
        c.innerHTML = `
            <p class="profile-region-modal__hint">
                Регион определяет валюту цен. Для России — рубли (₽), для остальных стран — доллары ($).
            </p>
            <div class="profile-region-choice-list">
                <button type="button" class="profile-region-choice ${currentRegion === 'RU' ? 'is-active' : ''}"
                        onclick="Profile.setRegion('RU')">
                    <span class="profile-region-choice__code">RUB</span>
                    <span class="profile-region-choice__text">
                        <span class="profile-region-choice__title">Россия</span>
                        <span class="profile-region-choice__desc">Цены в рублях (₽)</span>
                    </span>
                    ${currentRegion === 'RU' ? '<span class="profile-region-choice__check">✓</span>' : ''}
                </button>
                <button type="button" class="profile-region-choice ${currentRegion === 'OTHER' ? 'is-active' : ''}"
                        onclick="Profile.setRegion('OTHER')">
                    <span class="profile-region-choice__code">USD</span>
                    <span class="profile-region-choice__text">
                        <span class="profile-region-choice__title">Международный</span>
                        <span class="profile-region-choice__desc">Цены в долларах ($)</span>
                    </span>
                    ${currentRegion === 'OTHER' ? '<span class="profile-region-choice__check">✓</span>' : ''}
                </button>
            </div>
            ${!currentRegion ? `
            <div class="profile-region-modal__warn">
                Без выбора региона вы не сможете оформить заказ
            </div>` : ''}
        `;
        
        openModal('regionModal');
    }

    function setRegion(region) {
        userData.region = normalizeRegion(region);
        save();
        closeModal('regionModal');
        renderAll();
        // Обновить каталог чтобы цены пересчитались
        if (typeof Catalog !== 'undefined' && Catalog.renderCatalog) Catalog.renderCatalog();
        App.showToast(userData.region === 'RU' ? 'Регион: Россия (₽)' : 'Регион: Международный ($)', 'success');
    }

    function updateRegionIndicator() {
        const regionEl = document.getElementById('profileRegionIndicator');
        if (!regionEl) return;
        const reg = normalizeRegion(userData.region);

        if (!reg) {
            regionEl.innerHTML = '<button type="button" class="profile-region-pill profile-region-pill--warning" onclick="Profile.openRegionModal()">Выберите регион</button>';
            return;
        }

        const code = reg === 'RU' ? 'RUB' : 'USD';
        const label = reg === 'RU' ? 'Россия' : 'Международный';
        regionEl.innerHTML = `
            <button type="button" class="profile-region-pill" onclick="Profile.openRegionModal()">
                <span class="profile-region-pill__code">${code}</span>
                <span class="profile-region-pill__label">${label}</span>
                <span class="profile-region-pill__edit">изменить</span>
            </button>
        `;
    }
    // =====================================================
    // RENDERERS
    // =====================================================
    function renderHeader(){
        const av=document.querySelector('#page-profile .profile-avatar');
        if(av)av.innerHTML=userData.avatar?`<img src="${userData.avatar}" alt=""><div class="profile-avatar__ring"></div><div class="profile-avatar__ring profile-avatar__ring--reverse"></div><div class="profile-avatar__edit" onclick="Profile.openAvatarUpload()">${ic('camera')}</div>`:`${ic('user')}<div class="profile-avatar__ring"></div><div class="profile-avatar__ring profile-avatar__ring--reverse"></div><div class="profile-avatar__edit" onclick="Profile.openAvatarUpload()">${ic('camera')}</div>`;
        const nm=document.querySelector('#page-profile .profile-name');if(nm)nm.textContent=userData.name||'Новый пользователь';
        const un=document.querySelector('#page-profile .profile-username');if(un)un.textContent=userData.username?`@${userData.username}`:'';
        const bi=document.querySelector('#page-profile .profile-bio');if(bi)bi.textContent=userData.bio||'Нажмите «Редактировать»';
        const lb=document.querySelector('#page-profile .profile-level-badge');if(lb)lb.textContent=`Ур. ${userData.level} — ${getLvl(userData.level)}`;
        const vr=document.querySelector('#page-profile .profile-verified');if(vr)vr.style.display=userData.verified?'':'none';
        const ab=document.querySelector('#page-profile .profile-admin-badge');if(ab)ab.style.display=localStorage.getItem('tish_admin_auth')==='true'?'inline-block':'none';
        const tg=document.querySelector('#page-profile .profile-tags');
        if(tg)tg.innerHTML=(userData.tags||[]).length>0?(userData.tags||[]).map(t=>`<span class="profile-tag">${t}</span>`).join(''):'<span class="profile-tag" style="opacity:0.5;cursor:pointer" onclick="Profile.openEditProfile()">+ Интересы</span>';
        const sr=document.querySelector('#page-profile .profile-stats-row');
        if(sr)sr.innerHTML=`<div class="profile-stat"><span class="profile-stat__value">${userData.stats.purchases}</span><span class="profile-stat__label">Заказов</span></div><div class="profile-stat"><span class="profile-stat__value">${userData.referrals?.invited||0}</span><span class="profile-stat__label">Друзей</span></div><div class="profile-stat"><span class="profile-stat__value">${formatUserMoney(userData.stats.spent)}</span><span class="profile-stat__label">Потрачено</span></div><div class="profile-stat"><span class="profile-stat__value">${(userData.nftCollection||[]).length}</span><span class="profile-stat__label">NFT</span></div>`;
        updateRegionIndicator();

        applyBanner();applyAccent();applyTheme();syncAvatar();applyNftCustomization();
        }

    function renderSetup(){
        const main=document.querySelector('#page-profile .profile-main');if(!main)return;
        const old=main.querySelector('.profile-setup-prompt');if(old)old.remove();
        if(isSetupDone())return;
        const steps=[{done:!!userData.name,l:'Имя'},{done:!!userData.avatar,l:'Аватар'},{done:!!userData.bio,l:'О себе'},{done:(userData.tags||[]).length>0,l:'Интересы'}];
        const d=document.createElement('div');d.className='profile-setup-prompt profile-card p-reveal';
        d.innerHTML=`<div class="setup-prompt__header"><div class="setup-prompt__icon">${ic('user')}</div><div><h3 class="setup-prompt__title">Добро пожаловать! 🎉</h3><p class="setup-prompt__desc">Настройте профиль → +20 TISHARA</p></div></div><div class="setup-prompt__steps">${steps.map((s,i)=>`<div class="setup-step ${s.done?'done':''}"><div class="setup-step__dot">${s.done?ic('check'):(i+1)}</div><span>${s.l}</span></div>`).join('')}</div><button class="btn btn-primary btn-sm" onclick="Profile.openEditProfile()" style="margin-top:16px">${ic('edit')} Настроить</button>`;
        main.insertBefore(d,main.firstChild);
    }

    function renderOrders(){
        const c=document.getElementById('ordersList');if(!c)return;
        const catalogProducts = typeof Catalog !== 'undefined' && Catalog.getProducts ? Catalog.getProducts() : [];
        const catalogById = new Map(catalogProducts.map((p) => [String(p.id), p]));
        const resolveOrderImage = (order) => {
            if (!order) return null;
            if (order.productImage) return String(order.productImage);
            const product = catalogById.get(String(order.productId ?? ''));
            if (!product || !Array.isArray(product.media)) return null;
            const firstImage = product.media.find((m) => m && m.type === 'image' && m.url);
            return firstImage ? String(firstImage.url) : null;
        };
        const hasReviewForOrder = (order, reviews) => {
            if (!order || order.status !== 'completed') return false;
            return (reviews || []).some((r) =>
                (r.status !== 'rejected') && (
                    (r.orderId && _idEq(r.orderId, order.id)) ||
                    (r.productId && order.productId && _idEq(r.productId, order.productId)) ||
                    (r.productId && _idEq(r.productId, order.id)) ||
                    (r.product && order.productName && r.product === order.productName)
                )
            );
        };

        // ── FIX: Синхронизация reviewed-флага ──
        try {
            const orders = readStoredArray('tish_orders');
            const reviews = extractArray(userData.reviews, []);
            let changed = false;
            orders.forEach(o => {
                if (o.status === 'completed') {
                    const hasReview = hasReviewForOrder(o, reviews);
                    if (hasReview && !o.reviewed) {
                        o.reviewed = true;
                        changed = true;
                    }
                } else if (o.reviewed) {
                    // Защита от старых некорректных данных: отзыв не может быть у незавершенного заказа.
                    o.reviewed = false;
                    changed = true;
                }
            });
            if (changed) {
                localStorage.setItem('tish_orders', JSON.stringify(orders));
                if (typeof Storage !== 'undefined' && Storage.set) Storage.set('tish_orders', orders);
            }
        } catch(e) {}
        const orders = readStoredArray('tish_orders');
        const cntEl=document.getElementById('ordersCount');
        if(cntEl)cntEl.textContent=orders.length?`${orders.length}`:'';
        if(orders.length===0){
            c.innerHTML=`<div class="profile-empty"><div class="profile-empty__icon">${ic('shopping-cart')}</div><div class="profile-empty__title">Нет заказов</div><button class="btn btn-primary btn-sm" onclick="App.showPage('catalog')">В каталог</button></div>`;
            return;
        }
        const SL={
            'pending_prepayment':'Ожидает предоплату',
            'prepayment_verification':'Предоплата на проверке',
            'prepaid':'Предоплачен',
            'in_progress':'В работе',
            'invoice_sent':'Выставлен счёт',
            'payment_verification':'Оплата на проверке',
            'paid':'Оплачен',
            'completed':'Завершён'
        };

        const sortedOrders = orders.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        const paged = paginateItems(sortedOrders, 'orders');
        c.innerHTML=`<div class="order-list">${paged.items.map(o=>{
            const hasReview = hasReviewForOrder(o, userData.reviews || []);
            const canReview = o.status === 'completed' && !hasReview;
            const safeProductId = escapeAttr(String(o.productId ?? ''));
            const safeProductName = escapeAttr(o.productName || '');
            const safeOrderId = escapeAttr(String(o.id || ''));
            const image = resolveOrderImage(o);
            const safeImage = image ? escapeAttr(image) : '';
            const orderNameHtml = `${o.isUrgent ? '<span class="order-item__urgent-badge">⚡ Срочно</span> ' : ''}${o.productName || 'Товар'}`;

            return `<div class="order-item" onclick="${o.status==='pending_prepayment'?`Cart.payPrepayment('${safeOrderId}')`:o.chatId?`App.showPage('chat')`:''}" >
                <div class="order-item__icon" style="${image ? '' : `background:${o.productGradient||'linear-gradient(135deg,#8b5cf6,#d946ef)'}`} ">
                    ${image
                        ? `<img src="${safeImage}" alt="${safeProductName || 'Товар'}" loading="lazy">`
                        : '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>'
                    }
                </div>
                <div class="order-item__info">
                    <div class="order-item__name">${orderNameHtml}</div>
                    <div class="order-item__id">${o.id} - ${fmtDate(o.createdAt)}</div>
                    ${o.status === 'pending_prepayment' ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();Cart.payPrepayment('${safeOrderId}')" style="margin-top:6px;font-size:0.72rem;padding:5px 12px;">Оплатить предоплату</button>` : ''}
                    ${canReview ? `<button class="btn btn-ghost btn-sm order-review-btn" onclick="event.stopPropagation();Profile.openWriteReview('${safeProductId}','${safeProductName}','${safeOrderId}')" style="margin-top:6px;font-size:0.72rem;padding:4px 12px;">${ic('star')} Оставить отзыв</button>` : ''}
                    ${hasReview ? '<span style="font-size:0.68rem;color:#22c55e;margin-top:4px;display:inline-flex;align-items:center;gap:4px;">'+ic('check')+' Отзыв оставлен</span>' : ''}
                </div>
                <span class="order-item__status order-status--${o.status}">${SL[o.status]||o.status}</span>
            </div>`;
        }).join('')}</div>${renderListPagination('orders', paged.page, paged.totalPages, paged.totalItems)}`;
        // SVG fix
        setTimeout(() => {
            document.querySelectorAll('.order-item svg').forEach(svg => {
                const parent = svg.parentElement;
                if (parent && !parent.classList.contains('order-item__icon') &&
                    !svg.getAttribute('width') && !svg.style.width) {
                    svg.style.width = '14px';
                    svg.style.height = '14px';
                }
            });
        }, 50);
    }
    
    function escapeAttr(str) {
        return String(str || '')
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\r/g, ' ')
            .replace(/\n/g, ' ')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function renderFavs(){
        syncFavs();const c=document.getElementById('profileFavoritesGrid');if(!c)return;
        const f=extractArray(userData.favorites, []);
        if(f.length===0){c.innerHTML=`<div class="profile-empty" style="grid-column:1/-1"><div class="profile-empty__icon">${ic('heart')}</div><div class="profile-empty__title">Пусто</div><button class="btn btn-primary btn-sm" onclick="App.showPage('catalog')">В каталог</button></div>`;return;}
        const paged = paginateItems(f, 'favorites');
        c.innerHTML=paged.items.map((it,i)=>`<div class="profile-fav-card p-reveal p-reveal-delay-${Math.min(i+1,12)}" onclick="Profile.openPurchase(${it.id})">${it.alert?`<span class="profile-fav-card__alert profile-fav-card__alert--${it.alert}">${it.alertText}</span>`:''}<button class="profile-fav-card__remove" onclick="event.stopPropagation();Profile.removeFav(${it.id})">${ic('x')}</button><div class="profile-fav-card__preview" style="background:${it.gradient}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg></div><div class="profile-fav-card__name">${it.name}</div><div class="profile-fav-card__price">${formatUserMoney(it.price)}</div></div>`).join('') + renderListPagination('favorites', paged.page, paged.totalPages, paged.totalItems);
        obs();
    }

    function renderHistory(){
        const c=document.getElementById('historyScroll');if(!c)return;
        const history=extractArray(userData.browsingHistory, []);
        if(history.length===0){c.innerHTML=`<div class="profile-empty" style="width:100%"><div class="profile-empty__icon">${ic('eye')}</div><div class="profile-empty__title">Нет истории</div></div>`;return;}
        c.innerHTML=history.map(it=>`<div class="history-item" onclick="Profile.openPurchase(${it.id})"><div class="history-item__preview" style="background:${it.gradient}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg></div><div class="history-item__name">${it.name}</div><div class="history-item__time">${it.time}</div></div>`).join('');
    }

    function renderRecs(){
        const c=document.getElementById('recommendationsScroll');if(!c)return;
        const cp=extractArray(typeof Catalog!=='undefined'&&Catalog.getProducts?Catalog.getProducts():[], []);
        const owned=new Set(extractArray(userData.purchases, []).map(p=>p.id));
        const available=cp.filter(p=>!owned.has(p.id));
        if(available.length===0){c.innerHTML='<div style="padding:20px;text-align:center;color:var(--color-muted)">Всё куплено! 🎉</div>';return;}
        
        // Get cart items for smarter recommendations
        const cartItems=typeof Cart!=='undefined'&&Cart.getItems?Cart.getItems():[];
        const cartCategories=new Set(cartItems.map(ci=>ci.category).filter(Boolean));
        const cartPriceAvg=cartItems.length>0?cartItems.reduce((s,ci)=>s+(ci.price||0),0)/cartItems.length:0;
        
        // Score each available product
        const scored=available.map(p=>{
            let score=0;
            // Category match with cart
            if(cartCategories.has(p.category))score+=10;
            // Similar price range to cart average
            if(cartPriceAvg>0&&Math.abs(p.price-cartPriceAvg)<cartPriceAvg*0.5)score+=5;
            // Has a badge (popular/new/etc)
            if(p.badge)score+=3;
            // Add randomness to keep it fresh
            score+=Math.random()*2;
            return{...p,score};
        });
        scored.sort((a,b)=>b.score-a.score);
        const recs=scored.slice(0,6);
        
        c.innerHTML=recs.map(r=>{
            const reason=cartCategories.has(r.category)?'Похоже на корзину':(r.badge?r.badge.toUpperCase():'Для вас');
            return`<div class="recommend-card" onclick="Profile.openPurchase(${r.id})"><div class="recommend-card__preview" style="background:${r.gradient}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg><span class="recommend-card__reason">${reason}</span></div><div class="recommend-card__info"><div class="recommend-card__name">${r.title}</div><div class="recommend-card__price">${formatUserMoney(r.price)}</div></div></div>`;
        }).join('');
    }

    function renderReviews(){
        const c=document.getElementById('reviewsList');if(!c)return;
        const reviews=extractArray(userData.reviews, []);
        if(reviews.length===0){
            c.innerHTML=`<div class="profile-empty">
                <div class="profile-empty__icon">${ic('star')}</div>
                <div class="profile-empty__title">Нет отзывов</div>
                <div class="profile-empty__desc">Купите товар и оставьте свой первый отзыв</div>
            </div>`;
            return;
        }
        
        const statusLabels = {
            'pending_moderation': { text: 'На модерации', color: '#f59e0b', icon: 'clock' },
            'approved': { text: 'Опубликован', color: '#22c55e', icon: 'check' },
            'rejected': { text: 'Отклонён', color: '#ef4444', icon: 'x' }
        };
        
        const paged = paginateItems(reviews, 'reviews');
        const _escTxt = (s) => typeof Security !== 'undefined' && Security.sanitizeInput ? Security.sanitizeInput(s || '') : String(s || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        c.innerHTML = `<div style="font-size:0.75rem;color:var(--color-muted);margin-bottom:10px;opacity:0.7">Ваши отзывы (${reviews.length})</div>` +
            paged.items.map((r,i)=>{
                const stars=Array.from({length:5},(_,j)=>`<svg viewBox="0 0 24 24" class="${j<r.rating?'':'empty'}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`).join('');
                
                // Get status info
                const status = r.status || 'approved'; // old reviews default to approved
                const statusInfo = statusLabels[status] || statusLabels.approved;
                
                return`<div class="review-item p-reveal p-reveal-delay-${Math.min(i+1,12)} ${status === 'rejected' ? 'review-item--rejected' : ''}">
                    <div class="review-item__header">
                        <span class="review-item__product">${_escTxt(r.product)}</span>
                        <div class="review-item__stars">${stars}</div>
                    </div>
                    <p class="review-item__text">"${_escTxt(r.text)}"</p>
                    <div class="review-item__footer">
                        <span class="review-item__date">${fmtDate(r.date)}</span>
                        <span class="review-item__status" style="
                            display:inline-flex;
                            align-items:center;
                            gap:4px;
                            padding:2px 10px;
                            border-radius:20px;
                            font-size:0.68rem;
                            font-weight:700;
                            color:${statusInfo.color};
                            background:${statusInfo.color}15;
                            border:1px solid ${statusInfo.color}25;
                        ">
                            ${ic(statusInfo.icon)}
                            ${statusInfo.text}
                        </span>
                    </div>
                </div>`;
            }).join('') + renderListPagination('reviews', paged.page, paged.totalPages, paged.totalItems);
        obs();
    }

    function getAchProgress(a) {
        const achievements = extractArray(userData.achievements, []);
        const u = achievements.includes(a.id);
        if (u) return { pct: 100, text: 'Выполнено' };
        let pct = 0, text = '';
        if (a.id==='ten_purchases') { const c=userData.stats.purchases; pct=Math.min(100,(c/10)*100); text=`${c}/10`; }
        else if (a.id==='fifty_favorites') { const c=(userData.favorites||[]).length; pct=Math.min(100,(c/50)*100); text=`${c}/50`; }
        else if (a.id==='community_friend') { const c=userData.referrals?.invited||0; pct=Math.min(100,(c/20)*100); text=`${c}/20`; }
        else if (a.id==='expert_reviewer') { const c=userData.reviews.length; pct=Math.min(100,(c/20)*100); text=`${c}/20`; }
        else if (a.id==='big_spender') { const c=userData.stats.spent; pct=Math.min(100,(c/500)*100); text=`${formatUserMoney(c)} / ${formatUserMoney(500)}`; }
        else if (a.id==='first_purchase') { pct=userData.stats.purchases>=1?100:0; text=pct?'✓':'0/1'; }
        else if (a.id==='first_review') { pct=userData.reviews.length>=1?100:0; text=pct?'✓':'0/1'; }
        else if (a.id==='first_nft') { const c=(userData.nftCollection||[]).length; pct=c>=1?100:0; text=pct?'✓':'0/1'; }
        else if (a.id==='profile_complete') { const checks=[userData.name,userData.avatar,userData.bio,(userData.tags||[]).length>0]; const d=checks.filter(Boolean).length; pct=(d/4)*100; text=`${d}/4`; }
        else if (a.id==='ui_hunter') { const c=userData.purchases.filter(p=>p.category==='UI Kit').length; pct=Math.min(100,(c/3)*100); text=`${c}/3`; }
        else if (a.id==='icon_lover') { const c=userData.purchases.filter(p=>p.category==='Иконки').length; pct=Math.min(100,(c/3)*100); text=`${c}/3`; }
        else if (a.id==='motion_explorer') { const c=userData.purchases.filter(p=>p.category==='Motion').length; pct=Math.min(100,(c/3)*100); text=`${c}/3`; }
        return { pct: Math.round(pct), text };
    }

    function renderAch(){
        const c=document.getElementById('achievementsGrid');if(!c)return;
        const achievements = extractArray(userData.achievements, []);
        const unlocked = achievements.length;
        const total = ALL_ACHIEVEMENTS.length;
        
        c.innerHTML=ALL_ACHIEVEMENTS.map((a,i)=>{
            const u=achievements.includes(a.id);
            const r = getRarityForAch(a);
            const prog = getAchProgress(a);
            return`<div class="achievement ${u?'achievement--unlocked':'achievement--locked'} ${a.rare&&u?'achievement--rare':''} p-reveal p-reveal-delay-${Math.min(i+1,12)}" onclick="Profile.openAchDetail('${a.id}')" style="cursor:pointer" data-tooltip="${getAchievementDescription(a)}">
                ${a.rare?'<span class="achievement__rare-badge">⭐</span>':''}
                <div class="achievement__icon">${ic(a.icon)}</div>
                <span class="achievement__name">${a.name}</span>
                ${u ? `<span class="achievement__check">✓</span>` : `
                    <div class="achievement__progress"><div class="achievement__progress-bar" style="width:${prog.pct}%"></div></div>
                    <span class="achievement__progress-text">${prog.text}</span>
                `}
                <span class="achievement__reward">${u?'':'+'} ${a.xp} XP · ${a.tishara} ✦</span>
            </div>`;
        }).join('');
        
        const cnt=document.querySelector('[data-achievements-count]');
        if(cnt)cnt.textContent=`${unlocked} / ${total}`;
        obs();
    }
    
    function getRarityForAch(a) {
        if(a.rare) return 'rare';
        if(a.xp >= 50) return 'epic';
        return 'common';
    }

    function openAchDetail(achId){
        const a=ALL_ACHIEVEMENTS.find(x=>x.id===achId);if(!a)return;
        const achievements = extractArray(userData.achievements, []);
        const unlocked=achievements.includes(a.id);
        let progress=unlocked?100:0;
        let progressText = '';
        
        if(!unlocked){
            if(a.id==='ten_purchases'){
                const cur = userData.stats.purchases;
                progress=Math.min(100,(cur/10)*100);
                progressText = `${cur} / 10 покупок`;
            }
            else if(a.id==='fifty_favorites'){
                const cur = (userData.favorites||[]).length;
                progress=Math.min(100,(cur/50)*100);
                progressText = `${cur} / 50 в избранном`;
            }
            else if(a.id==='community_friend'){
                const cur = userData.referrals?.invited||0;
                progress=Math.min(100,(cur/20)*100);
                progressText = `${cur} / 20 друзей`;
            }
            else if(a.id==='expert_reviewer'){
                const cur = userData.reviews.length;
                progress=Math.min(100,(cur/20)*100);
                progressText = `${cur} / 20 отзывов`;
            }
            else if(a.id==='big_spender'){
                const cur = userData.stats.spent;
                progress=Math.min(100,(cur/500)*100);
                progressText = `${formatUserMoney(cur)} / ${formatUserMoney(500)}`;
            }
            else if(a.id==='first_purchase'){
                progress=userData.stats.purchases>=1?100:0;
                progressText = userData.stats.purchases>=1?'Выполнено':'Нужна 1 покупка';
            }
            else if(a.id==='first_review'){
                progress=userData.reviews.length>=1?100:0;
                progressText = userData.reviews.length>=1?'Выполнено':'Нужен 1 отзыв';
            }
            else if(a.id==='first_nft'){
                const cur = (userData.nftCollection||[]).length;
                progress=cur>=1?100:0;
                progressText = cur>=1?'Выполнено':'Нужен 1 NFT';
            }
            else if(a.id==='profile_complete'){
                const checks = [userData.name,userData.avatar,userData.bio,(userData.tags||[]).length>0];
                const done = checks.filter(Boolean).length;
                progress=(done/4)*100;
                progressText = `${done} / 4 пунктов`;
            }
            else if(a.id==='ui_hunter'){
                const cur = userData.purchases.filter(p=>p.category==='UI Kit').length;
                progress=Math.min(100,(cur/3)*100);
                progressText = `${cur} / 3 UI Kit`;
            }
            else if(a.id==='icon_lover'){
                const cur = userData.purchases.filter(p=>p.category==='Иконки').length;
                progress=Math.min(100,(cur/3)*100);
                progressText = `${cur} / 3 набора иконок`;
            }
            else if(a.id==='motion_explorer'){
                const cur = userData.purchases.filter(p=>p.category==='Motion').length;
                progress=Math.min(100,(cur/3)*100);
                progressText = `${cur} / 3 Motion-дизайна`;
            }
        }
        
        const c=document.getElementById('achievementDetailContent');if(!c)return;
        c.innerHTML=`
        <div style="text-align:center;padding:20px 0">
            <div style="width:80px;height:80px;margin:0 auto 16px;border-radius:18px;background:${unlocked?'linear-gradient(135deg,var(--purple-500),var(--magenta-500))':'var(--color-bg-muted)'};display:flex;align-items:center;justify-content:center;${a.rare?'box-shadow:0 0 20px rgba(139,92,246,0.3);':''}">
                <svg viewBox="0 0 24 24" fill="none" stroke="${unlocked?'white':'var(--color-muted)'}" stroke-width="2" style="width:36px;height:36px">${I[a.icon]||''}</svg>
            </div>
            
            <h3 style="font-family:var(--font-mono);font-weight:700;font-size:1.2rem;margin-bottom:4px">${a.name}</h3>
            ${a.rare?'<span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:0.65rem;font-weight:700;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1e1b4b;margin-bottom:8px">⭐ РЕДКОЕ</span>':''}
            
            <p style="color:var(--color-muted);font-size:0.9rem;margin-bottom:20px;line-height:1.5">${getAchievementDescription(a)}</p>
            
            <!-- Rewards -->
            <div style="display:flex;gap:20px;justify-content:center;margin-bottom:20px">
                <div style="padding:12px 20px;border-radius:12px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.15)">
                    <div style="font-family:var(--font-mono);font-weight:800;font-size:1.1rem;color:var(--purple-500)">+${a.xp}</div>
                    <div style="font-size:0.68rem;color:var(--color-muted);font-weight:600">XP опыт</div>
                </div>
                <div style="padding:12px 20px;border-radius:12px;background:rgba(217,70,239,0.08);border:1px solid rgba(217,70,239,0.15)">
                    <div style="font-family:var(--font-mono);font-weight:800;font-size:1.1rem;color:var(--magenta-500,#d946ef)">+${a.tishara}</div>
                    <div style="font-size:0.68rem;color:var(--color-muted);font-weight:600">TISHARA ✦</div>
                </div>
            </div>
            
            <!-- Status -->
            ${unlocked ? `
                <div style="padding:12px;border-radius:10px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2)">
                    <div style="color:#22c55e;font-weight:700;font-size:0.9rem">✅ Разблокировано!</div>
                    <div style="font-size:0.72rem;color:var(--color-muted);margin-top:2px">Награды уже начислены</div>
                </div>
            ` : `
                <div style="padding:12px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06)">
                    <div style="font-size:0.8rem;font-weight:600;margin-bottom:8px;color:var(--color-text)">Прогресс</div>
                    <div style="height:10px;background:rgba(139,92,246,0.1);border-radius:8px;overflow:hidden;margin-bottom:6px">
                        <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,var(--purple-500),var(--magenta-500));border-radius:8px;transition:width 0.5s ease"></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--color-muted)">
                        <span>${progressText || Math.round(progress)+'%'}</span>
                        <span>${Math.round(progress)}%</span>
                    </div>
                </div>
            `}
        </div>`;
        openModal('achievementDetailModal');
    }

    function renderLevel(){
        const n=document.querySelector('#page-profile .level-card__number');if(n)n.textContent=userData.level;
        const r=document.querySelector('#page-profile .level-card__rank');if(r)r.textContent=getLvl(userData.level);
        const l=document.querySelector('#page-profile .level-progress__labels');if(l)l.innerHTML=`<span>${userData.xp} / ${userData.maxXp} XP</span><span>Ур. ${userData.level+1}</span>`;
    }

    function renderBalance(){
        // Main balance display
        const balEl = document.getElementById('tisharaBalanceDisplay');
        if(balEl) balEl.textContent = `${userData.tishara} ✦`;
        
        // Also update the old selector if exists
        const a=document.querySelector('#page-profile .balance-card__amount');
        if(a && a.id !== 'tisharaBalanceDisplay') a.textContent=`${userData.tishara} ✦`;
        
        // Recent transactions
        const rc = document.getElementById('tisharaRecentList');
        if(!rc) {
            // Fallback to old selector
            const rcOld = document.querySelector('#page-profile .balance-card__recent');
            if(rcOld) renderTisharaRecent(rcOld);
            return;
        }
        renderTisharaRecent(rc);
    }
    
    function renderTisharaRecent(container) {
        const recent = userData.tisharaHistory.slice(0, 5);
        if(recent.length === 0) {
            container.innerHTML = '<div style="font-size:0.78rem;color:rgba(244, 240, 255, 0.82);padding:4px 0;margin-bottom:8px">Нет начислений</div>';
            return;
        }
        
        const iconMap = {
            'Покупка': 'shopping-cart',
            'Отзыв': 'star',
            'spend': 'tag',
            'Код': 'gift',
            'Первый NFT': 'hexagon',
            'Первая покупка': 'shopping-bag',
            'Первый отзыв': 'message-circle',
            'UI Hunter': 'monitor',
            'Полный профиль': 'user-check'
        };
        
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
                ${recent.map(it => {
                    // Determine icon
                    let iconName = 'zap';
                    for(const [key, val] of Object.entries(iconMap)) {
                        if(it.label && it.label.includes(key)) { iconName = val; break; }
                        if(it.type && it.type.includes(key)) { iconName = val; break; }
                    }
                    
                    const isPositive = it.value > 0;
                    return `
                        <div class="balance-card__earning">
                            <span class="balance-card__earning-label">
                                ${ic(iconName)} ${it.label || it.type || 'Бонус'}
                            </span>
                            <div style="display:flex;flex-direction:column;align-items:flex-end">
                                <span class="balance-card__earning-value ${isPositive ? '' : 'negative'}">
                                    ${isPositive ? '+' : ''}${it.value} ✦
                                </span>
                                ${it.date ? `<span style="font-size:0.6rem;color:rgba(244, 240, 255, 0.76);opacity:0.9">${fmtDate(it.date)}</span>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }


    function renderRefCard(){
        const inv=document.querySelector('[data-ref-invited]');if(inv)inv.textContent=userData.referrals?.invited||0;
        const ear=document.querySelector('[data-ref-earned]');if(ear)ear.textContent=`${userData.referrals?.earned||0} ✦`;
        const link=document.querySelector('#page-profile .referral-link-input');if(link)link.value=userData.referrals?.link||'';
        const cd=document.getElementById('myRefCodeDisplay');if(cd)cd.textContent=userData.referrals?.myCode||'';
        const hist=document.querySelector('#page-profile .referral-history-list');
        if(hist){const rh=userData.referrals?.history||[];hist.innerHTML=rh.length===0?'<div style="font-size:0.78rem;color:var(--color-muted);padding:8px 0">Пригласите друзей!</div>':rh.slice(0,3).map(it=>`<div class="referral-history__item"><div class="referral-history__avatar">${ic('user')}</div><span class="referral-history__name">${it.name}</span><span>${it.action}</span><span class="referral-history__bonus">+${it.bonus} ✦</span></div>`).join('');}
    }

    function getProfilePageRoot(){
        return document.querySelector('#page-profile .profile-page');
    }

    function setAdaptiveEffectsLow(isLow){
        const root = getProfilePageRoot();
        if(!root) return;
        adaptiveFxState.isLow = !!isLow;
        root.classList.toggle('profile-effects-low', adaptiveFxState.isLow);
    }

    function stopAdaptiveEffectsMonitor(){
        adaptiveFxState.running = false;
        if(adaptiveFxState.raf){
            cancelAnimationFrame(adaptiveFxState.raf);
            adaptiveFxState.raf = 0;
        }
        adaptiveFxState.lastTs = 0;
        adaptiveFxState.sampleCount = 0;
        adaptiveFxState.sampleDt = 0;
        adaptiveFxState.slowFrames = 0;
        adaptiveFxState.cooldown = 0;
    }

    function startAdaptiveEffectsMonitor(){
        const root = getProfilePageRoot();
        if(!root) return;

        stopAdaptiveEffectsMonitor();

        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if(reduceMotion){
            setAdaptiveEffectsLow(true);
            renderBannerFX();
            return;
        }

        const cores = Number(navigator.hardwareConcurrency || 0);
        const memory = Number(navigator.deviceMemory || 0);
        adaptiveFxState.lowDeviceHint = (cores > 0 && cores <= 4) || (memory > 0 && memory <= 4);
        setAdaptiveEffectsLow(adaptiveFxState.lowDeviceHint);
        renderBannerFX();

        adaptiveFxState.lastTs = 0;
        adaptiveFxState.sampleCount = 0;
        adaptiveFxState.sampleDt = 0;
        adaptiveFxState.slowFrames = 0;
        adaptiveFxState.cooldown = 0;
        adaptiveFxState.running = true;

        const tick = (ts) => {
            if(!adaptiveFxState.running) return;

            const page = getProfilePageRoot();
            if(!page){
                stopAdaptiveEffectsMonitor();
                return;
            }

            if(document.hidden || page.offsetParent === null){
                adaptiveFxState.lastTs = ts;
                adaptiveFxState.raf = requestAnimationFrame(tick);
                return;
            }

            if(adaptiveFxState.lastTs){
                const dt = ts - adaptiveFxState.lastTs;
                if(dt > 0 && dt < 500){
                    adaptiveFxState.sampleCount += 1;
                    adaptiveFxState.sampleDt += dt;
                    if(dt > ADAPTIVE_FX_CONFIG.slowFrameMs) adaptiveFxState.slowFrames += 1;
                }
            }
            adaptiveFxState.lastTs = ts;

            if(adaptiveFxState.sampleCount >= ADAPTIVE_FX_CONFIG.sampleFrames){
                const avgDt = adaptiveFxState.sampleDt / adaptiveFxState.sampleCount;
                const fps = avgDt > 0 ? (1000 / avgDt) : 60;
                const slowRatio = adaptiveFxState.slowFrames / adaptiveFxState.sampleCount;

                if(!adaptiveFxState.isLow && (fps < ADAPTIVE_FX_CONFIG.lowFps || slowRatio > ADAPTIVE_FX_CONFIG.highSlowRatio)){
                    setAdaptiveEffectsLow(true);
                    renderBannerFX();
                    adaptiveFxState.cooldown = ADAPTIVE_FX_CONFIG.cooldownFrames;
                } else if(
                    adaptiveFxState.isLow &&
                    !adaptiveFxState.lowDeviceHint &&
                    adaptiveFxState.cooldown <= 0 &&
                    fps > ADAPTIVE_FX_CONFIG.recoverFps &&
                    slowRatio < ADAPTIVE_FX_CONFIG.recoverSlowRatio
                ){
                    setAdaptiveEffectsLow(false);
                    renderBannerFX();
                }

                adaptiveFxState.sampleCount = 0;
                adaptiveFxState.sampleDt = 0;
                adaptiveFxState.slowFrames = 0;
            }

            if(adaptiveFxState.cooldown > 0) adaptiveFxState.cooldown -= 1;
            adaptiveFxState.raf = requestAnimationFrame(tick);
        };

        adaptiveFxState.raf = requestAnimationFrame(tick);
    }

    function renderBannerFX(){
        const b=document.querySelector('#page-profile .profile-banner');if(!b)return;
        const sc=b.querySelector('.profile-banner__stars');
        const root = getProfilePageRoot();
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
        const lowFx = !!(root && root.classList.contains('profile-effects-low'));
        const starCount = reduceMotion ? 10 : (lowFx ? (isMobile ? 12 : 18) : (isMobile ? 20 : 34));
        if(sc && sc.children.length !== starCount){
            sc.innerHTML = '';
            for(let i=0;i<starCount;i++){
                const s=document.createElement('div');
                s.className='profile-banner__star';
                s.style.left=Math.random()*100+'%';
                s.style.top=Math.random()*100+'%';
                const sz=(lowFx ? (0.8+Math.random()*2) : (0.8+Math.random()*2.4))+'px';
                s.style.width=sz;
                s.style.height=sz;
                s.style.setProperty('--dur',((lowFx ? 5.4 : 3.2)+Math.random()*(lowFx ? 4.2 : 5.5))+'s');
                s.style.setProperty('--drift',((lowFx ? 18 : 11)+Math.random()*12)+'s');
                s.style.setProperty('--drift-x',((lowFx ? -4 : -7)+Math.random()*(lowFx ? 8 : 14)).toFixed(2)+'px');
                s.style.setProperty('--drift-y',((lowFx ? -5 : -9)+Math.random()*(lowFx ? 10 : 18)).toFixed(2)+'px');
                s.style.setProperty('--star-opacity',((lowFx ? 0.2 : 0.28)+Math.random()*(lowFx ? 0.34 : 0.56)).toString());
                s.style.animationDelay=Math.random()*6+'s';
                sc.appendChild(s);
            }
        }
    }

    function initParallax(){
        const b=document.querySelector('#page-profile .profile-banner');if(!b)return;
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hasFinePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if(reduceMotion || !hasFinePointer) return;

        const blobs = b.querySelectorAll('.profile-banner-blob');
        let nx = 0;
        let ny = 0;
        let raf = null;

        const applyParallax = () => {
            blobs.forEach((bl,i)=>{bl.style.transform=`translate(${nx*(i+1)*8}px,${ny*(i+1)*8}px)`;});
            raf = null;
        };

        b.addEventListener('mousemove',e=>{
            const r=b.getBoundingClientRect();
            nx=(e.clientX-r.left)/r.width-0.5;
            ny=(e.clientY-r.top)/r.height-0.5;
            if(!raf) raf=requestAnimationFrame(applyParallax);
        });

        b.addEventListener('mouseleave',()=>{
            if(raf){
                cancelAnimationFrame(raf);
                raf = null;
            }
            blobs.forEach(bl=>{bl.style.transform='';});
        });
    }

    function obs(){const o=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');o.unobserve(e.target);}});},{threshold:0.1});document.querySelectorAll('#page-profile .p-reveal:not(.is-visible)').forEach(el=>o.observe(el));}
    function animLevel(){const bar=document.querySelector('#page-profile .level-progress__bar');if(!bar)return;bar.style.width='0%';setTimeout(()=>{bar.style.width=(userData.xp/userData.maxXp*100)+'%';},500);}

    function renderAll(){
        const renderSteps = [
            renderHeader,
            renderSetup,
            renderOrders,
            renderFavs,
            renderHistory,
            renderRecs,
            renderReviews,
            renderAch,
            renderLevel,
            renderBalance,
            renderRefCard,
            renderNftCollection,
            renderBannerFX
        ];
        renderSteps.forEach((fn) => {
            try { fn(); } catch (err) { console.error('[Profile] render step failed:', fn.name, err); }
        });
        if(typeof Cart!=='undefined'&&Cart.renderQuickView)Cart.renderQuickView();
        const gq=document.getElementById('giftsQuickContent');
        if(gq){const dc=extractArray(userData.discounts,[]).filter(d=>d&&d.active).length;gq.textContent=dc>0?`${dc} активн. скидк${dc>1?(dc>4?'и':'и'):'а'}`:'Скидки и бонусы';}
        
        setTimeout(()=>{
            updateRegionIndicator();
        },200);
    }

    // ===== INIT =====
    function init(){
        load();renderBannerFX();initParallax();renderAll();
        if(typeof Navigation==='undefined'||!Navigation.getCurrentPage||Navigation.getCurrentPage()==='profile'){
            startAdaptiveEffectsMonitor();
        }
        if(!_profileBindingsDone){
            document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAllModals();});
            document.addEventListener('favoritesChanged',()=>{if(typeof Navigation!=='undefined'&&Navigation.getCurrentPage&&Navigation.getCurrentPage()==='profile')renderFavs();});
            document.addEventListener('pageShown', (e) => {
                const shownPage = e && e.detail ? e.detail.page : '';
                if (shownPage !== 'profile') {
                    stopAdaptiveEffectsMonitor();
                    return;
                }
                try {
                    load();
                    renderAll();
                } catch(ex) {}
                renderBannerFX();
                startAdaptiveEffectsMonitor();
                setTimeout(() => {
                    updateRegionIndicator();
                }, 50);
            });
            _profileBindingsDone = true;
        }
        setTimeout(()=>{animLevel();obs();},300);
        checkAch();
        if(!_catalogModalPatched&&typeof Catalog!=='undefined'&&Catalog.openModal){
            const orig=Catalog.openModal.bind(Catalog);
            Catalog.openModal=function(id){trackView(id);orig(id);};
            _catalogModalPatched = true;
        }

    }

        return {
            init,renderAll,openEditProfile,saveEditProfile,toggleTag,
            openAvatarUpload,openBannerModal,selectBanner,
            openCustomizationModal,selectAccent,selectTheme,
            openWriteReview,setReviewRating,submitReview,
            openSpendTishara,buyDiscount,openTisharaHistory,
            openGiftsModal,openSettings,saveNotifSettings:saveNotifSettings,
            downloadPurchase,openPurchase,removeFav,clearHistory,
            copyReferralLink:copyRefLink,applyReferralCode:applyRefCode,editMyRefCode:editMyRefCode,
            resetProfile,confirmReset,
            openModal,closeModal,closeAllModals,
            openAchievementDetail:openAchDetail,openAchDetail,openLevelsModal,
            syncAvatar,trackProductView:trackView,renderOrders,
            // NFT exports
            openNftDetail, addNft, getNftCollection, nftSellStub, nftTradeStub,
            renderNftCollection,
            setListPage,
            // NFT Customization exports
            openNftCustomizationModal, setNftCustom, toggleNftOnHeader, saveNftCustomization,
            // Region exports  <-- ДОБАВЬ ЭТИ ДВЕ
            openRegionModal, setRegion,
            // Auth exports
            getUserData: () => userData,
            save,
            reload: () => { renderAll(); },
        };
})();