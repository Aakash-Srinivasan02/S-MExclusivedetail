document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('subscribeForm');
  if(!form) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const btn = document.getElementById('checkout-and-portal-button');
    const lookup = document.getElementById('lookup_key').value;
    btn.disabled = true; btn.textContent = 'Redirecting...';
    try{
      const resp = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookup_key: lookup })
      });
      const json = await resp.json();
      if(resp.ok && json.url){
        window.location.href = json.url;
        return;
      }
      alert('Error creating Checkout session: ' + (json.error || resp.statusText));
    }catch(err){
      alert('Network error creating Checkout session.');
    }finally{
      btn.disabled = false; btn.textContent = 'Checkout';
    }
  });
});
