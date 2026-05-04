(function () {
  const scripts = document.querySelectorAll('script[data-amount][data-wallet]');

  scripts.forEach(function (script) {
    const amount = script.getAttribute('data-amount');
    const token = script.getAttribute('data-token') || 'USDC';
    const wallet = script.getAttribute('data-wallet');
    const label = script.getAttribute('data-label') || 'Pay with Flint';
    const memo = script.getAttribute('data-memo') || '';
    const theme = script.getAttribute('data-theme') || 'dark';

    const btn = document.createElement('button');
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 64 64" fill="none" style="margin-right:8px;vertical-align:middle">
        <polygon points="32,6 54,18 54,46 32,58 10,46 10,18" stroke="currentColor" stroke-width="3" fill="none"/>
        <polyline points="48,8 60,8 60,20" stroke="#FF6B2B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <rect x="24" y="24" width="6" height="20" rx="2" fill="currentColor"/>
        <rect x="30" y="24" width="14" height="6" rx="2" fill="currentColor"/>
        <rect x="30" y="34" width="10" height="5" rx="2" fill="currentColor"/>
      </svg>
      ${label} · ${amount} ${token}
    `;

    const isDark = theme === 'dark';
    btn.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      background: ${isDark ? '#0f0f0f' : '#FF6B2B'};
      color: ${isDark ? '#f7f7f5' : 'white'};
      transition: opacity 0.2s;
      text-decoration: none;
    `;

    btn.onmouseover = function () { btn.style.opacity = '0.85'; };
    btn.onmouseout = function () { btn.style.opacity = '1'; };

    btn.onclick = async function () {
      btn.disabled = true;
      btn.innerHTML = 'Creating invoice...';

      try {
        const origin = script.src.replace('/embed.js', '');
        const res = await fetch(origin + '/api/invoice/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: memo || label,
            amount: amount,
            token: token,
            recipientWallet: wallet,
            memo: memo,
            expiryDays: '1',
          }),
        });

        const data = await res.json();
        if (data.id) {
          window.open(origin + '/pay/' + data.id, '_blank');
        }
      } catch (e) {
        console.error('Flint embed error:', e);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 64 64" fill="none" style="margin-right:8px;vertical-align:middle">
            <polygon points="32,6 54,18 54,46 32,58 10,46 10,18" stroke="currentColor" stroke-width="3" fill="none"/>
            <polyline points="48,8 60,8 60,20" stroke="#FF6B2B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <rect x="24" y="24" width="6" height="20" rx="2" fill="currentColor"/>
            <rect x="30" y="24" width="14" height="6" rx="2" fill="currentColor"/>
            <rect x="30" y="34" width="10" height="5" rx="2" fill="currentColor"/>
          </svg>
          ${label} · ${amount} ${token}
        `;
      }
    };

    script.parentNode.insertBefore(btn, script.nextSibling);
  });
})();