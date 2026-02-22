/* =====================================================
   THEME SWITCHER — Light / Dark (Cosmic) Theme
   ===================================================== */

class ThemeSwitcher {
    constructor() {
        this.STORAGE_KEY = 'tish_theme';
        this.theme = this.loadTheme();
        this.applyTheme(this.theme);
        this.bindEvents();
    }

    loadTheme() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') return saved;

        // System preference
        if (window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    applyTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);

        // Update particles color
        this.updateParticlesColor(theme);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themeChange', {
            detail: { theme }
        }));
    }

    toggle() {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    bindEvents() {
        // All theme toggle buttons
        document.querySelectorAll('.theme-toggle, .admin-theme-toggle')
            .forEach(btn => {
                btn.addEventListener('click', () => this.toggle());
            });

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', (e) => {
                if (!localStorage.getItem(this.STORAGE_KEY)) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
    }

    updateParticlesColor(theme) {
        // If ParticleSystem exists, update colors
        if (window.particleSystemInstance) {
            window.particleSystemInstance.updateTheme(theme);
        }
    }

    isDark() {
        return this.theme === 'dark';
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
});