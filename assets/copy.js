// Copy buttons: data-copy names the prompt elements to copy, in order, joined by a blank line.
(function () {
  var status = document.getElementById("copy-status");
  function textOf(ids) {
    return ids.map(function (id) { return document.getElementById(id).textContent.trim(); }).join("\n\n");
  }
  function fallback(text) {
    var area = document.createElement("textarea");
    area.value = text; area.setAttribute("readonly", ""); area.style.position = "fixed"; area.style.opacity = "0";
    document.body.appendChild(area); area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; },
        function () { return fallback(text); });
    }
    return Promise.resolve(fallback(text));
  }
  document.querySelectorAll("button[data-copy]").forEach(function (button) {
    var label = button.textContent;
    button.addEventListener("click", function () {
      copy(textOf(button.getAttribute("data-copy").split(" "))).then(function (ok) {
        button.textContent = ok ? "Copied" : "Not copied: select the text instead";
        status.textContent = ok ? button.getAttribute("data-what") + " copied" : "Not copied";
        setTimeout(function () { button.textContent = label; }, 2200);
      });
    });
  });
})();
