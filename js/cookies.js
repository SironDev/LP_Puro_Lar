
(() => {
  "use strict";

  const STORAGE_KEY = "purolar_cookie_preferences";

  const GTM_ID = "GTM-MN2MXJ29";
  const META_PIXEL_ID = "2402333043508107";

  const banner = document.getElementById("cookie-banner");
  const acceptButton = document.getElementById("cookie-accept");
  const rejectButton = document.getElementById("cookie-reject");

  if (!banner || !acceptButton || !rejectButton) {
    console.error(
      "Banner de cookies: verifique os IDs cookie-banner, cookie-accept e cookie-reject."
    );
    return;
  }

  let gtmLoaded = false;
  let pixelLoaded = false;

  function readPreferences() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (!value) return null;

      const preferences = JSON.parse(value);

      if (
        preferences?.version !== 1 ||
        typeof preferences.analytics !== "boolean" ||
        typeof preferences.marketing !== "boolean"
      ) {
        return null;
      }

      return preferences;
    } catch (error) {
      console.warn("Não foi possível ler as preferências de cookies.", error);
      return null;
    }
  }

  function savePreferences(analytics, marketing, decision) {
    const preferences = {
      version: 1,
      necessary: true,
      analytics,
      marketing,
      decision,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(preferences)
      );

      window.dispatchEvent(
        new CustomEvent("purolar:consent-updated", {
          detail: preferences
        })
      );

      return true;
    } catch (error) {
      console.error(
        "Não foi possível salvar as preferências.",
        error
      );

      return false;
    }
  }

  function loadGTM() {
    if (gtmLoaded || !GTM_ID) return;

    gtmLoaded = true;

    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
      "gtm.start": Date.now(),
      event: "gtm.js"
    });

    const script = document.createElement("script");
    script.id = "purolar-gtm";
    script.async = true;
    script.src =
      "https://www.googletagmanager.com/gtm.js?id=" +
      encodeURIComponent(GTM_ID);

    document.head.appendChild(script);
  }

  function loadMetaPixel() {
    if (pixelLoaded || !META_PIXEL_ID || window.fbq) return;

    pixelLoaded = true;

    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;

      n = f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      };

      if (!f._fbq) f._fbq = n;

      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];

      t = b.createElement(e);
      t.async = true;
      t.src = v;

      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(
      window,
      document,
      "script",
      "https://connect.facebook.net/en_US/fbevents.js"
    );

    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  function applyPreferences(preferences) {
    if (!preferences) return;

    // O GTM só é carregado após a autorização de
    // pelo menos uma categoria opcional.
    if (preferences.analytics || preferences.marketing) {
      loadGTM();
    }

    // O Pixel da Meta é considerado marketing.
    if (preferences.marketing) {
      loadMetaPixel();
    }
  }

  function showBanner() {
    banner.hidden = false;
  }

  function hideBanner() {
    banner.hidden = true;
  }

  // Aceitar todos os cookies opcionais.
  acceptButton.addEventListener("click", () => {
    const saved = savePreferences(true, true, "all");

    if (!saved) {
      alert(
        "Não foi possível salvar sua escolha. Os rastreadores não foram ativados."
      );
      return;
    }

    hideBanner();
    applyPreferences(readPreferences());
  });

  // Rejeitar cookies opcionais e salvar a escolha.
  rejectButton.addEventListener("click", () => {
    const saved = savePreferences(false, false, "rejected");

    if (!saved) {
      alert(
        "Não foi possível salvar sua escolha. O banner continuará disponível."
      );
      return;
    }

    hideBanner();
  });

  // Permitir reabrir as preferências pelo link do site.
  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const link = target.closest("#cookie-settings");
    if (!link) return;

    event.preventDefault();

    try {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    } catch (error) {
      console.error(
        "Não foi possível reabrir as preferências.",
        error
      );
    }
  });

  // Restaurar a escolha anterior do visitante.
  const savedPreferences = readPreferences();

  if (savedPreferences) {
    hideBanner();
    applyPreferences(savedPreferences);
  } else {
    showBanner();
  }
})();

