document.addEventListener('DOMContentLoaded',()=>{
  const nav = document.getElementById('mainNav');
  const btn = document.getElementById('navToggle');
  btn.addEventListener('click',()=>nav.classList.toggle('open'));

  // year
  const year = document.getElementById('year');
  if(year) year.textContent = new Date().getFullYear();

  // booking form handler (demo)
  const bookingForm = document.getElementById('bookingForm');
  const bookingMessage = document.getElementById('bookingMessage');
  if(bookingForm){
    bookingForm.addEventListener('submit', async e=>{
      e.preventDefault();
      bookingMessage.textContent = 'Sending request...';
      bookingMessage.style.color = '';
      const fd = new FormData(bookingForm);
      const data = Object.fromEntries(fd.entries());
      try{
        const resp = await fetch('/.netlify/functions/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if(resp.ok){
          bookingMessage.textContent = `Thanks, ${data.name || 'there'} — we received your request. We'll reach out to confirm.`;
          bookingMessage.style.color = '#9fe8c9';
          bookingForm.reset();
        } else {
          const text = await resp.text();
          bookingMessage.textContent = `Error: ${text}`;
          bookingMessage.style.color = '#ffb4b4';
        }
      }catch(err){
        bookingMessage.textContent = 'Network error — please try again.';
        bookingMessage.style.color = '#ffb4b4';
      }
    });
  }

  // call button
  const callBtn = document.getElementById('callBtn');
  if(callBtn){
    callBtn.addEventListener('click', ()=>{
      window.location.href = 'tel:+1234567890';
    });
  }

  // simple subscribe buttons (placeholder for Stripe)
  document.querySelectorAll('.subscribe-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const confirmMsg = 'To enable subscriptions, connect Stripe and create a server endpoint. See site/README.md for steps.';
      alert(confirmMsg);
    });
  });

  // lightbox preview for gallery
  const gallery = document.getElementById('gallery');
  if(gallery){
    gallery.addEventListener('click', e=>{
      const img = e.target.closest('img');
      if(!img) return;
      const src = img.src;
      const overlay = document.createElement('div');
      overlay.style.position='fixed';overlay.style.inset=0;overlay.style.background='rgba(3,6,10,0.85)';overlay.style.display='flex';overlay.style.alignItems='center';overlay.style.justifyContent='center';overlay.style.zIndex=9999;
      const big = document.createElement('img');big.src=src;big.style.maxWidth='92%';big.style.maxHeight='92%';big.style.borderRadius='8px';overlay.appendChild(big);
      overlay.addEventListener('click', ()=>overlay.remove());
      document.body.appendChild(overlay);
    });
  }

  // populate Instagram strip via Netlify function (fallback to existing images)
  (async function populateInstagram(){
    const strip = document.querySelector('.strip-track');
    if(!strip) return;
    try{
      const resp = await fetch('/.netlify/functions/instagram?count=12');
      if(!resp.ok) throw new Error('Instagram fetch failed');
      const json = await resp.json();
      if(json && Array.isArray(json.items) && json.items.length){
        strip.innerHTML = '';
        json.items.forEach(it=>{
          const a = document.createElement('a');
          a.href = it.permalink || '#';
          a.target = '_blank';
          const img = document.createElement('img');
          img.src = it.url;
          img.alt = 'Instagram image';
          a.appendChild(img);
          strip.appendChild(a);
        });
        // duplicate for seamless scroll
        json.items.forEach(it=>{ const img = document.createElement('img'); img.src = it.url; img.alt=''; strip.appendChild(img); });
      }
    }catch(err){
      // leave placeholders
      console.warn('Instagram strip load failed:', err);
    }
  })();
});
