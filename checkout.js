(function(){
  const authKey='liwika_auth_session', required=document.getElementById('authRequired'), content=document.getElementById('checkoutContent');
  const login=document.getElementById('loginLink'), signup=document.getElementById('signupLink');
  const returnUrl='checkout.html';
  login.href='login.html?returnTo='+encodeURIComponent(returnUrl); signup.href='signup.html?returnTo='+encodeURIComponent(returnUrl);
  function session(){try{return JSON.parse(localStorage.getItem(authKey)||'null')}catch(e){return null}}
  function money(v){return '₹'+Number(v||0).toLocaleString('en-IN')}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  const items=window.LiwikaCart?window.LiwikaCart.getItems():[];
  if(!items.length){location.href='seasonals/cart.html';return}
  const subtotal=window.LiwikaCart.getSubtotal();
  const delivery=subtotal>=150?0:20;
  const total=subtotal+delivery;
  document.getElementById('summarySubtotal').textContent=money(subtotal);
  document.getElementById('summaryDelivery').textContent=delivery===0?'Free':money(delivery);
  document.getElementById('summaryTotal').textContent=money(total);
  document.getElementById('summaryItems').innerHTML=items.map(i=>`<div class="summary-item"><span><strong>${esc(i.name)}</strong><br>${esc(i.flavour||'')} × ${Number(i.quantity)||0}</span><span>${money(i.price*i.quantity)}</span></div>`).join('');
  const s=session();
  if(!s){required.classList.add('show');return}
  content.classList.add('show');document.getElementById('customerEmail').textContent=s.email||s.phoneNumber||'SIGNED IN';

  /* =========================================================
     VISAKHAPATNAM-ONLY DELIVERY VALIDATION
     - Phone: 10-digit Indian mobile number
     - Pincode: must belong to the Visakhapatnam (530xxx) postal district
     - Map: pinned point must fall inside the Visakhapatnam service area
     ========================================================= */

  // Visakhapatnam district bounding box (covers GVMC + Bheemunipatnam,
  // Anandapuram, Pendurthi, Gajuwaka and other nearby delivery mandals).
  const VIZAG_BOUNDS = { minLat:17.55, maxLat:18.10, minLng:83.00, maxLng:83.45 };
  const VIZAG_CENTER = { lat:17.6868, lng:83.2185 }; // RTC Complex, Visakhapatnam

  const phoneInput=document.getElementById('checkoutPhone');
  const phoneField=document.getElementById('phoneField');
  const phoneMsg=document.getElementById('phoneMsg');
  const pinInput=document.getElementById('checkoutPin');
  const pinField=document.getElementById('pinField');
  const pinMsg=document.getElementById('pinMsg');
  const locationStatus=document.getElementById('locationStatus');
  const submitBtn=document.getElementById('checkoutSubmitBtn');

  let phoneValid=false, pinValid=false, locationValid=false, pinnedLatLng=null, emailOk=false;
  // The account gate (checkout-gate.js) tells us when the customer's email is verified.
  window.LiwikaCheckout={setEmailVerified:function(v){emailOk=!!v;updateSubmitState()}};

  function setField(field,msgEl,state,text){
    field.classList.remove('valid','invalid');
    if(state==='ok'){field.classList.add('valid')}
    else if(state==='err'){field.classList.add('invalid')}
    msgEl.textContent=text||'';
    msgEl.className='field-msg'+(state==='ok'?' ok':state==='err'?' err':'');
  }

  function validatePhone(){
    const v=phoneInput.value.replace(/\D/g,'');
    if(!v){phoneValid=false;setField(phoneField,phoneMsg,'','');return}
    if(!/^[6-9]\d{9}$/.test(v)){
      phoneValid=false;
      setField(phoneField,phoneMsg,'err','Enter a valid 10-digit Indian mobile number.');
    }else{
      phoneValid=true;
      setField(phoneField,phoneMsg,'ok','Looks good.');
    }
    updateSubmitState();
  }

  function validatePin(){
    const v=pinInput.value.replace(/\D/g,'');
    if(!v){pinValid=false;setField(pinField,pinMsg,'','');updateSubmitState();return}
    if(!/^\d{6}$/.test(v)){
      pinValid=false;
      setField(pinField,pinMsg,'err','Pincode must be 6 digits.');
    }else if(!/^530\d{3}$/.test(v)){
      pinValid=false;
      setField(pinField,pinMsg,'err','Sorry, delivery isn\'t available in this area yet — we currently deliver within Visakhapatnam only.');
    }else{
      pinValid=true;
      setField(pinField,pinMsg,'ok','Delivers within Visakhapatnam ✓');
    }
    updateSubmitState();
  }

  phoneInput.addEventListener('input',function(){this.value=this.value.replace(/\D/g,'').slice(0,10);validatePhone()});
  pinInput.addEventListener('input',function(){this.value=this.value.replace(/\D/g,'').slice(0,6);validatePin()});

  function updateSubmitState(){
    submitBtn.disabled=!(phoneValid && pinValid && locationValid && emailOk);
  }

  function inVizagBounds(lat,lng){
    return lat>=VIZAG_BOUNDS.minLat && lat<=VIZAG_BOUNDS.maxLat && lng>=VIZAG_BOUNDS.minLng && lng<=VIZAG_BOUNDS.maxLng;
  }

  async function checkLocation(lat,lng){
    locationStatus.className='location-status';
    locationStatus.textContent='Checking this location…';
    const insideBox=inVizagBounds(lat,lng);
    if(!insideBox){
      locationValid=false;pinnedLatLng=null;
      locationStatus.className='location-status err';
      locationStatus.textContent='This location is outside Visakhapatnam. We can\'t deliver here yet — please pin a location within Visakhapatnam.';
      updateSubmitState();
      return;
    }
    // Best-effort reverse geocode (OpenStreetMap Nominatim) to confirm & label the spot.
    let label='Pinned location';
    try{
      const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14`);
      if(res.ok){
        const data=await res.json();
        const a=data.address||{};
        const district=(a.state_district||a.county||'').toLowerCase();
        const cityText=(a.city||a.town||a.suburb||a.county||'').toLowerCase();
        label=data.display_name?data.display_name.split(',').slice(0,3).join(','):label;
        // If the geocoder clearly names a different district, flag it even though
        // the point fell inside our fallback bounding box.
        if(district && district.indexOf('visakhapatnam')===-1 && cityText.indexOf('visakhapatnam')===-1 && district.length){
          locationValid=false;pinnedLatLng=null;
          locationStatus.className='location-status err';
          locationStatus.textContent='This pin looks like it\'s outside Visakhapatnam ('+(a.state_district||a.county)+'). We can\'t deliver here yet.';
          updateSubmitState();
          return;
        }
      }
    }catch(e){ /* offline / blocked — fall back to the bounding-box result above */ }
    locationValid=true;pinnedLatLng={lat,lng,label};
    locationStatus.className='location-status ok';
    locationStatus.textContent='✓ Within Visakhapatnam — '+label;
    updateSubmitState();
  }

  // ---- Map setup (Leaflet + OpenStreetMap — no API key required) ----
  let map,marker;
  function initMap(){
    map=L.map('deliveryMap',{scrollWheelZoom:false}).setView([VIZAG_CENTER.lat,VIZAG_CENTER.lng],12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:19,attribution:'© OpenStreetMap contributors'
    }).addTo(map);
    marker=L.marker([VIZAG_CENTER.lat,VIZAG_CENTER.lng],{draggable:true}).addTo(map);
    marker.on('dragend',function(){
      const p=marker.getLatLng();checkLocation(p.lat,p.lng);
    });
    map.on('click',function(e){
      marker.setLatLng(e.latlng);checkLocation(e.latlng.lat,e.latlng.lng);
    });
  }
  if(window.L){initMap()}else{
    locationStatus.textContent='Map could not load. Please check your connection and refresh.';
  }

  document.getElementById('locateBtn').addEventListener('click',function(){
    if(!navigator.geolocation){locationStatus.textContent='Location access isn\'t supported on this browser.';return}
    locationStatus.className='location-status';
    locationStatus.textContent='Getting your location…';
    navigator.geolocation.getCurrentPosition(function(pos){
      const {latitude,longitude}=pos.coords;
      if(map&&marker){map.setView([latitude,longitude],15);marker.setLatLng([latitude,longitude])}
      checkLocation(latitude,longitude);
    },function(){
      locationStatus.className='location-status err';
      locationStatus.textContent='Couldn\'t get your location. Please drag the pin manually.';
    });
  });

  document.getElementById('checkoutForm').addEventListener('submit',function(e){
    e.preventDefault();
    validatePhone();validatePin();
    if(!phoneValid||!pinValid||!locationValid||!emailOk){
      updateSubmitState();
      return;
    }
    const details={
      name:document.getElementById('checkoutName').value.trim(),
      phone:phoneInput.value.trim(),
      address:document.getElementById('checkoutAddress').value.trim(),
      pin:pinInput.value.trim(),
      city:'Visakhapatnam',
      lat:pinnedLatLng?pinnedLatLng.lat:null,
      lng:pinnedLatLng?pinnedLatLng.lng:null,
      locationLabel:pinnedLatLng?pinnedLatLng.label:''
    };
    sessionStorage.setItem('liwika_checkout_details',JSON.stringify(details));
    sessionStorage.setItem('liwika_checkout_total',String(total));
    if(!sessionStorage.getItem('liwika_checkout_intent')){
      const intent=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():('lk-'+Date.now()+'-'+Math.random().toString(16).slice(2));
      sessionStorage.setItem('liwika_checkout_intent',intent);
    }
    location.href='payment.html';
  });
})();
