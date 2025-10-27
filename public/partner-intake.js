(function () {
  function init(script) {
    if (!script || typeof window === "undefined") return;
    const baseUrl = new URL(script.src, window.location.href);
    const origin = baseUrl.origin;
    const params = new URLSearchParams();

    const firm = script.dataset.firm || "";
    const partnerName = script.dataset.partnerName || "";
    const brandColor = script.dataset.brandColor || "";
    const customSource = script.dataset.source || "";
    const hostPage = window.location.href.slice(0, 500);

    if (firm) params.set("firm", firm);
    if (partnerName) params.set("partnerName", partnerName);
    if (brandColor) params.set("brandColor", brandColor);
    if (customSource) params.set("source", customSource);
    params.set("host", hostPage);

    const iframe = document.createElement("iframe");
    iframe.src = `${origin}/widget/intake${params.toString() ? `?${params.toString()}` : ""}`;
    iframe.style.width = "100%";
    iframe.style.minHeight = script.dataset.height || "620px";
    iframe.style.border = "0";
    iframe.style.borderRadius = script.dataset.rounded === "false" ? "0" : "16px";
    iframe.style.boxShadow = "0 10px 30px rgba(15, 23, 42, 0.08)";
    iframe.setAttribute("title", "LexFlow partner intake");

    const wrapper = document.createElement("div");
    wrapper.className = "lexflow-partner-widget";
    wrapper.style.width = "100%";
    wrapper.appendChild(iframe);

    const targetSelector = script.dataset.mount;
    const mountNode = targetSelector ? document.querySelector(targetSelector) : null;

    if (mountNode) {
      mountNode.appendChild(wrapper);
    } else if (script.parentElement) {
      script.parentElement.insertBefore(wrapper, script.nextSibling);
    } else {
      document.body.appendChild(wrapper);
    }
  }

  if (document.currentScript) {
    init(document.currentScript);
  } else {
    const scripts = document.querySelectorAll('script[src*="partner-intake.js"]');
    scripts.forEach(init);
  }
})();
