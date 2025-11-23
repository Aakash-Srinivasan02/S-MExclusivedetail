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
    bookingForm.addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(bookingForm);
      const data = Object.fromEntries(fd.entries());
      console.log('Booking request (demo):', data);
      bookingMessage.textContent = `Thanks, ${data.name || 'there'} — we received your request. We'll reach out to confirm.`;
      bookingMessage.style.color = '#9fe8c9';
      bookingForm.reset();
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
});
