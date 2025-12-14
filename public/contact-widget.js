(function () {
  function parseBool(value, defaultValue) {
    if (value === undefined || value === null || value === "") return !!defaultValue;
    if (typeof value === "boolean") return value;
    const v = String(value).toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
    return !!defaultValue;
  }

  function buildShadowWidget(options) {
    const {
      hostElement,
      formtitle = true,
      formframe = true,
      apiBaseUrl,
      redirectUrl = "https://sharonc.me/thankyou_parent/",
    } = options;

    const container = hostElement || document.createElement("div");
    if (!hostElement) document.body.appendChild(container);

    const shadowRoot = container.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      *, *::before, *::after { box-sizing: border-box; }
      .wrap { direction: rtl; font-family: Rubik, Arial, sans-serif; color: #333; }
      .frame { background: #fff; width: 100%; max-width: 600px; margin: 0 auto; ${formframe ? "border: 1px solid #D1D5DB; border-radius: 10px; box-shadow: 0 0 8px 4px rgba(102,102,102,0.16); padding: 24px;" : ""} }
      .title { font-size: 36px; font-weight: 400; text-align: center; margin: 0 0 20px; }
      .row { margin-bottom: 12px; }
      label { display: block; font-size: 18px; font-weight: 700; margin-bottom: 6px; }
      input, select { width: 100%; height: 48px; border: none; background: #F6F6F6; border-radius: 8px; padding: 0 12px; font-size: 16px; }
      select { appearance: none; -webkit-appearance: none; -moz-appearance: none; padding-left: 36px; background-color: #F6F6F6; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: left 10px center; }
      .error { color: #dc2626; font-size: 13px; margin-top: 4px; }
      .submit { margin-top: 16px; width: 100%; height: 52px; font-size: 24px; font-weight: 700; border-radius: 5px; background: #00A165; color: #fff; cursor: pointer; border: none; }
      .submit:disabled { opacity: .7; cursor: not-allowed; }
      .disabled { opacity: .6; pointer-events: none; }
    `;

    const root = document.createElement("div");
    root.className = "wrap";
    root.innerHTML = `
      <div class="frame">
        ${formtitle ? '<h3 class="title">צרו איתי קשר</h3>' : ""}
        <form id="widgetForm" novalidate>
          <div class="row">
            <label>בחרי פעילות <span style="color:#000">*</span></label>
            <select name="activityType" required>
              <option value="" selected disabled>בחרי פעילות</option>
              <option value="הכנה ללידה מרוכז קבוצתי">הכנה ללידה מרוכז קבוצתי</option>
              <option value="הכנה ללידה מפגש רענון">הכנה ללידה מפגש רענון</option>
              <option value="הכנה ללידה קורס פרטי">הכנה ללידה קורס פרטי</option>
              <option value="יוגה לתינוקות">יוגה לתינוקות</option>
              <option value="יוגה נשית">יוגה נשית</option>
              <option value="יוגה לאמהות">יוגה לאמהות</option>
            </select>
            <div class="error" data-err="activityType" hidden>ביחרו פעילות בבקשה</div>
          </div>

          <div class="row">
            <label>שם <span style=\"color:#000\">*</span></label>
            <input name="name" type="text" required />
            <div class="error" data-err="name" hidden>נא מלאו שם</div>
          </div>

          <div class="row">
            <label>טלפון <span style=\"color:#000\">*</span></label>
            <input name="phone" type="tel" required />
            <div class="error" data-err="phone" hidden>נא מלאו מספר טלפון</div>
          </div>

          <div class="row" data-cond="babyBirthdate" hidden>
            <label>יום הולדת של התינוק</label>
            <input name="babyBirthdate" type="date" />
          </div>

          <div class="row" data-cond="birthdate">
            <label>תאריך לידה משוער</label>
            <input name="birthdate" type="date" />
          </div>

          <div class="row">
            <label>הערות</label>
            <input name="message" type="text" />
          </div>

          <div class="row">
            <label>איך הגעתן אלי?</label>
            <select name="howFound">
              <option value="" selected>ממש לא חובה אבל תמיד טוב לדעת למי לאמר תודה</option>
              <option value="פייסבוק">פייסבוק</option>
              <option value="גוגל">גוגל</option>
              <option value="המלצה של חברה או חבר">המלצה של חברה או חבר</option>
              <option value="המלצה של איש או אשת מקצוע">המלצה של איש או אשת מקצוע</option>
              <option value="אחר">אחר</option>
            </select>
          </div>

          <div class="row" data-cond="referrerName" hidden>
            <label>אשמח לדעת מי המליץ כדי להודות להם :)</label>
            <input name="referrerName" type="text" />
          </div>

          <div class="row center"><div class="error" data-err="server" hidden>שגיאה בשליחת הטופס.</div></div>
          <button class="submit" type="submit">הרשמה</button>
        </form>
      </div>
    `;

    shadowRoot.append(style, root);

    const form = shadowRoot.getElementById("widgetForm");
    const activitySelect = form.querySelector("select[name=activityType]");
    const howFoundSelect = form.querySelector("select[name=howFound]");
    const birthdateRow = form.querySelector('[data-cond="birthdate"]');
    const babyBirthdateRow = form.querySelector('[data-cond="babyBirthdate"]');
    const referrerRow = form.querySelector('[data-cond="referrerName"]');

    activitySelect.addEventListener("change", function () {
      const value = activitySelect.value;
      const isBabyYoga = value === "יוגה לתינוקות";
      babyBirthdateRow.hidden = !isBabyYoga;
      birthdateRow.hidden = isBabyYoga || value === "";
    });

    howFoundSelect.addEventListener("change", function () {
      const value = howFoundSelect.value;
      referrerRow.hidden = !(
        value === "המלצה של חברה או חבר" || value === "המלצה של איש או אשת מקצוע"
      );
    });

    // Show native date pickers on click/focus
    form.querySelectorAll('input[type="date"]').forEach(function (el) {
      function openPicker() {
        try {
          if (typeof el.showPicker === "function") el.showPicker();
          else el.focus();
        } catch (_) {
          el.focus();
        }
      }
      el.addEventListener("click", openPicker);
      el.addEventListener("focus", openPicker);
    });

    function setError(name, visible) {
      const el = form.querySelector('[data-err="' + name + '"]');
      if (el) el.hidden = !visible;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setError("server", false);

      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const phone = String(fd.get("phone") || "").trim();
      const activityType = String(fd.get("activityType") || "").trim();
      const birthdate = String(fd.get("birthdate") || "").trim();
      const babyBirthdate = String(fd.get("babyBirthdate") || "").trim();
      const message = String(fd.get("message") || "").trim();
      const howFound = String(fd.get("howFound") || "").trim();
      const referrerName = String(fd.get("referrerName") || "").trim();

      let invalid = false;
      setError("name", !name);
      setError("phone", !phone);
      setError("activityType", !activityType);
      if (!name || !phone || !activityType) invalid = true;
      if (invalid) return;

      const submitBtn = form.querySelector(".submit");
      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = "שולח...";
      form.classList.add("disabled");

      var target = (function () {
        if (apiBaseUrl) return apiBaseUrl.replace(/\/$/, "");
        // default to script's origin
        const scriptEl =
          document.currentScript ||
          Array.from(document.getElementsByTagName("script")).find(function (s) {
            return /contact-widget\.js(\?|$)/.test(s.src);
          });
        if (scriptEl) {
          try {
            var u = new URL(scriptEl.src);
            return u.origin;
          } catch (_) {}
        }
        return window.location.origin;
      })();

      fetch(target + "/api/contact-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          phone: phone,
          email: "",
          activityType: activityType,
          birthdate: birthdate || null,
          babyBirthdate: babyBirthdate || null,
          message: message || "",
          howFound: howFound || "",
          referrerName: referrerName || "",
        }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("submit-failed");
          window.location.href = redirectUrl;
        })
        .catch(function () {
          setError("server", true);
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel || "הרשמה";
          form.classList.remove("disabled");
        });
    });

    return { container: hostElement ? undefined : container, shadowRoot: shadowRoot };
  }

  function autoInitFromScript() {
    var scriptEl =
      document.currentScript ||
      Array.from(document.getElementsByTagName("script")).find(function (s) {
        return /contact-widget\.js(\?|$)/.test(s.src);
      });
    if (!scriptEl) return;

    // Get config from data attributes first, then from URL params
    var selector = scriptEl.getAttribute("data-selector") || null;
    var formtitle = parseBool(scriptEl.getAttribute("data-formtitle"), true);
    var formframe = parseBool(scriptEl.getAttribute("data-formframe"), true);
    var apiBaseUrl = scriptEl.getAttribute("data-api-base") || null;
    var redirectUrl = scriptEl.getAttribute("data-redirect-url") || undefined;

    // Override with URL parameters if present
    try {
      var scriptUrl = new URL(scriptEl.src);
      if (scriptUrl.searchParams.has("formtitle")) {
        formtitle = parseBool(scriptUrl.searchParams.get("formtitle"), true);
      }
      if (scriptUrl.searchParams.has("formframe")) {
        formframe = parseBool(scriptUrl.searchParams.get("formframe"), true);
      }
    } catch (e) {
      // Ignore URL parsing errors
    }

    var hostElement = selector ? document.querySelector(selector) : null;
    buildShadowWidget({
      hostElement: hostElement || undefined,
      formtitle: formtitle,
      formframe: formframe,
      apiBaseUrl: apiBaseUrl || undefined,
      redirectUrl: redirectUrl,
    });
  }

  if (!window.SharonContactWidget) {
    window.SharonContactWidget = {
      init: function (config) {
        config = config || {};
        var host = config.selector
          ? document.querySelector(config.selector)
          : config.hostElement || null;
        return buildShadowWidget({
          hostElement: host || undefined,
          formtitle: parseBool(config.formtitle, true),
          formframe: parseBool(config.formframe, true),
          apiBaseUrl: config.apiBaseUrl || undefined,
          redirectUrl: config.redirectUrl || undefined,
        });
      },
    };
  }

  // Auto-init after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInitFromScript);
  } else {
    autoInitFromScript();
  }
})();
