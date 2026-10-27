(function () {
  'use strict';

  var WEBHOOK_URL = 'https://n8n.lamarketing.com.br/webhook/allout-captacao-black-2026';
  // Mesmo grupo da página anterior. Troque aqui se a Black Friday tiver um grupo novo.
  var WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/EbetZHu4e825uIc7Ub9qXG';

  var form = document.getElementById('vip-form');
  if (!form) return;

  var nameEl = document.getElementById('name');
  var emailEl = document.getElementById('email');
  var phoneEl = document.getElementById('whatsapp');
  var consentEl = document.getElementById('consent');
  var btn = document.getElementById('submit-btn');
  var statusEl = document.getElementById('form-status');

  /* ---- Máscara de WhatsApp: (11) 91234-5678 ---- */
  phoneEl.addEventListener('input', function () {
    var d = phoneEl.value.replace(/\D/g, '').slice(0, 11);
    var out = d;
    if (d.length > 10) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    else if (d.length > 6) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    else if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    else if (d.length > 0) out = '(' + d;
    phoneEl.value = out;
  });

  /* ---- Rolagem do botão secundário até o formulário ---- */
  document.querySelectorAll('[data-scroll-to]').forEach(function (el) {
    el.addEventListener('click', function () {
      var target = document.getElementById(el.getAttribute('data-scroll-to'));
      if (!target) return;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(function () { target.focus({ preventScroll: true }); }, 500);
    });
  });

  function setStatus(msg, type) {
    statusEl.textContent = msg || '';
    statusEl.className = 'form__status' + (type ? ' is-' + type : '');
  }

  function mark(el, invalid) { el.classList.toggle('is-invalid', invalid); }

  function validate() {
    var okName = nameEl.value.trim().length >= 2;
    var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailEl.value.trim());
    var digits = phoneEl.value.replace(/\D/g, '');
    var okPhone = digits.length === 10 || digits.length === 11;
    var okConsent = consentEl.checked;

    mark(nameEl, !okName);
    mark(emailEl, !okEmail);
    mark(phoneEl, !okPhone);
    mark(consentEl, !okConsent);

    if (!okName) return { ok: false, msg: 'Digite seu nome.', el: nameEl };
    if (!okEmail) return { ok: false, msg: 'Digite um e-mail válido.', el: emailEl };
    if (!okPhone) return { ok: false, msg: 'Digite seu WhatsApp com DDD.', el: phoneEl };
    if (!okConsent) return { ok: false, msg: 'Marque o consentimento para entrar no grupo.', el: consentEl };
    return { ok: true, digits: digits };
  }

  /* ---- Meta Pixel: evento Lead (disparado só após o envio com sucesso) ---- */
  function trackLead() {
    try {
      if (typeof fbq === 'function') {
        fbq('track', 'Lead', {
          content_name: 'Grupo VIP Black Friday',
          content_category: 'Formulario VIP'
        });
      }
    } catch (err) { /* o Pixel nunca deve quebrar o fluxo do formulário */ }
  }

  [nameEl, emailEl, phoneEl].forEach(function (el) {
    el.addEventListener('input', function () { mark(el, false); });
  });
  consentEl.addEventListener('change', function () { mark(consentEl, false); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('');

    var v = validate();
    if (!v.ok) {
      setStatus(v.msg, 'error');
      v.el.focus();
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var payload = {
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      whatsapp: phoneEl.value.trim(),
      consent: true,
      source: 'allout-captacao-black-2026',
      submittedAt: new Date().toISOString()
    };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      if (params.get(k)) payload[k] = params.get(k);
    });

    btn.disabled = true;
    btn.querySelector('.btn-cta__label').textContent = 'ENVIANDO...';

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        trackLead();
        form.reset();
        setStatus('Cadastro enviado! Redirecionando para o grupo do WhatsApp...', 'success');
        setTimeout(function () { window.location.href = WHATSAPP_GROUP_URL; }, 1200);
        btn.querySelector('.btn-cta__label').textContent = 'CADASTRO CONFIRMADO';
      })
      .catch(function () {
        btn.disabled = false;
        btn.querySelector('.btn-cta__label').textContent = 'ENTRAR NO GRUPO VIP';
        setStatus('Não foi possível enviar agora. Tente novamente em instantes.', 'error');
      });
  });
})();
