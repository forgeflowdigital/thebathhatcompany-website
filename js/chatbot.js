/* ==========================================================================
   "Ask the Milliner" — a hat-shaped assistant that answers common
   questions about The Bath Hat Company. Runs entirely client-side with a
   lightweight keyword-matching knowledge base (no external API/keys
   required), so it works the moment the page loads.
   ========================================================================== */
(function () {
  "use strict";

  var KB = [
    {
      id: "greeting",
      patterns: ["hello", "hi", "hey", "good morning", "good afternoon", "morning", "afternoon"],
      reply: "Hello there! I'm the Bath Hat Company's little digital milliner 🎩. Ask me about opening hours, our collections, hat stretching, or how to find the shop."
    },
    {
      id: "hours",
      patterns: ["hour", "open", "close", "time", "when are you", "opening", "closing"],
      reply: "We're open <strong>Monday to Saturday, 10:30am &ndash; 3:30pm</strong>. We're closed Sundays, so do plan your visit to Walcot Street around that."
    },
    {
      id: "location",
      patterns: ["where", "location", "address", "find you", "directions", "parking", "walcot"],
      reply: "You'll find us at <strong>9&ndash;11 Walcot Street, Bath, BA1 5BN</strong> &mdash; a short stroll from the Roman Baths and Royal Victoria Park. See the map on our <a href=\"contact.html\">Contact page</a> for directions."
    },
    {
      id: "phone",
      patterns: ["phone", "call", "number", "telephone", "contact number"],
      reply: "You can call us on <a href=\"tel:01225339009\">01225 339009</a> &mdash; we're always happy to talk hats."
    },
    {
      id: "email",
      patterns: ["email", "e-mail", "mail"],
      reply: "Drop us a line at <a href=\"mailto:thebathhatcompany@yahoo.co.uk\">thebathhatcompany@yahoo.co.uk</a> and we'll get back to you personally."
    },
    {
      id: "fit",
      patterns: ["stretch", "fit", "size", "too small", "too tight", "resize", "sizing"],
      reply: "Fit is everything &mdash; every hat is fitted personally in store, and we'll happily ease or adjust a hat so it sits just right. Pop in on Walcot Street or call <a href=\"tel:01225339009\">01225 339009</a> and we'll help."
    },
    {
      id: "accessories",
      patterns: ["accessor", "gloves", "wrap", "scarf", "finishing"],
      reply: "Alongside our hats we carry beautiful <strong>accessories</strong> &mdash; gloves, wraps and finishing touches to complete your look. See the <a href=\"occasions.html#accessories\">Accessories</a> section."
    },
    {
      id: "wedding",
      patterns: ["wedding", "mother of the bride", "motb", "bride", "bridal", "guest hat"],
      reply: "Our <strong>Mother of the Bride</strong> and wedding guest collections range from understated elegance to bold, show-stopping millinery &mdash; including pieces from our MAEVE collection. See <a href=\"occasions.html#mother-of-the-bride\">Occasions</a> for styles."
    },
    {
      id: "ascot",
      patterns: ["ascot", "races", "racing", "derby", "henley", "regatta"],
      reply: "Royal Ascot, Henley and race-day occasions are our specialty &mdash; think sculptural saucers, fascinators and fine straw. Have a browse of the <a href=\"gallery.html\">gallery</a> for inspiration."
    },
    {
      id: "mens",
      patterns: ["men", "man", "fedora", "gentleman", "flat cap", "trilby"],
      reply: "We carry styles for everyone &mdash; from classic fedoras, trilbies and flat caps to everyday and occasion pieces. Have a browse of the <a href=\"gallery.html\">gallery</a>, or pop in and we'll help you find the right fit."
    },
    {
      id: "gallery",
      patterns: ["gallery", "photo", "pictures", "see hats", "collection", "range", "styles"],
      reply: "Take a look through our <a href=\"gallery.html\">Gallery</a> &mdash; it's full of the styles, colours and finishes we carry in store (our full range changes daily!)."
    },
    {
      id: "story",
      patterns: ["story", "history", "about", "how long", "family", "who are you", "founded"],
      reply: "We've been dressing heads in Bath for over three decades &mdash; read about our journey on the <a href=\"our-story.html\">Our Story</a> page."
    },
    {
      id: "gift",
      patterns: ["gift", "present", "voucher", "birthday"],
      reply: "Hats make wonderful gifts! Pop into the shop and our milliners will help you pick the perfect piece (or size) for someone special."
    },
    {
      id: "delivery",
      patterns: ["delivery", "post", "ship", "online", "buy online", "website order"],
      reply: "We're a proudly in-person boutique on Walcot Street &mdash; every hat is fitted and finished with you in the room. Call <a href=\"tel:01225339009\">01225 339009</a> to check availability before you visit."
    },
    {
      id: "reviews",
      patterns: ["review", "rating", "recommend", "good", "trust"],
      reply: "We're grateful for our reviews &mdash; you'll find real customer stories on the homepage, and you're welcome to leave your own via <a href=\"https://www.yell.com/biz/the-bath-hat-co-bath-4237435/\" target=\"_blank\" rel=\"noopener\">Yell</a>."
    },
    {
      id: "thanks",
      patterns: ["thank", "thanks", "cheers", "appreciate"],
      reply: "You're very welcome &mdash; tip of the hat to you! 🎩 Anything else I can help with?"
    },
    {
      id: "bye",
      patterns: ["bye", "goodbye", "see you", "later"],
      reply: "Goodbye for now &mdash; we hope to see you at 9&ndash;11 Walcot Street soon!"
    }
  ];

  var FALLBACK = "I might not have the perfect answer for that one &mdash; but our milliners will! Call <a href=\"tel:01225339009\">01225 339009</a> or use the <a href=\"contact.html\">contact form</a> and we'll help directly.";

  var SUGGESTIONS = ["Opening hours", "Where are you?", "Wedding hats", "Accessories"];

  function scoreMessage(text) {
    var lower = text.toLowerCase();
    var best = null, bestScore = 0;
    KB.forEach(function (intent) {
      var score = 0;
      intent.patterns.forEach(function (p) {
        if (lower.indexOf(p) !== -1) score += p.length;
      });
      if (score > bestScore) { bestScore = score; best = intent; }
    });
    return best ? best.reply : FALLBACK;
  }

  function init() {
    var launcher = document.getElementById("hat-chat-launcher");
    var panel = document.getElementById("hat-chat-panel");
    if (!launcher || !panel) return;

    var body = panel.querySelector(".hat-chat-body");
    var form = panel.querySelector(".hat-chat-form");
    var input = form.querySelector("input");
    var closeBtn = panel.querySelector(".hat-chat-close");
    var suggestionsWrap = panel.querySelector(".hat-chat-suggestions");
    var opened = false;

    function addMessage(text, who) {
      var msg = document.createElement("div");
      msg.className = "hat-msg " + who;
      msg.innerHTML = text;
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
    }

    function botReply(text) {
      var typing = document.createElement("div");
      typing.className = "hat-typing";
      typing.innerHTML = "<span></span><span></span><span></span>";
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;
      window.setTimeout(function () {
        typing.remove();
        addMessage(text, "bot");
      }, 480 + Math.random() * 380);
    }

    function openPanel() {
      panel.classList.add("is-open");
      launcher.setAttribute("aria-expanded", "true");
      opened = true;
      window.setTimeout(function () { input.focus(); }, 320);
    }
    function closePanel() {
      panel.classList.remove("is-open");
      launcher.setAttribute("aria-expanded", "false");
    }

    launcher.addEventListener("click", function () {
      if (panel.classList.contains("is-open")) { closePanel(); return; }
      openPanel();
      if (!opened) {
        botReply("Hello there! I'm the Bath Hat Company's little digital milliner 🎩. Ask me about opening hours, our collections, hat stretching, or how to find the shop.");
      }
    });
    closeBtn.addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });

    if (suggestionsWrap) {
      SUGGESTIONS.forEach(function (label) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "hat-chip";
        chip.textContent = label;
        chip.addEventListener("click", function () {
          addMessage(label, "user");
          botReply(scoreMessage(label));
        });
        suggestionsWrap.appendChild(chip);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = input.value.trim();
      if (!val) return;
      addMessage(val, "user");
      input.value = "";
      botReply(scoreMessage(val));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
