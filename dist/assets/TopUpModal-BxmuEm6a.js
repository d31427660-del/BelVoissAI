import{r as a,j as e}from"./vendor-BjXWrvmJ.js";import{q as P,b as W,s as y,a3 as Z,a4 as ee,T as te,h as se,a5 as ie,a6 as ne,a7 as le,t as ae}from"./icons-BJTYGQWv.js";import{M as q}from"./index-7jYTiS0E.js";function w(m){return String(m||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function T(m){const{invoiceNo:p,invoiceDate:c,companyName:l,unp:F,userEmail:h,minutes:f,ratePerMinute:o,totalByn:x}=m,r=w(p),g=w(c),n=w(l),b=F?w(F):"",d=h?w(h):"";return`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Счёт на оплату № ${r}</title>
<style>
  body { font-family: Arial, "Helvetica Neue", sans-serif; font-size: 10pt; line-height: 1.35; color: #111; margin: 30px; }
  .header-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9.5pt; }
  .header-table td { border: 1px solid #444; padding: 5px 8px; vertical-align: top; }
  h1 { font-size: 14pt; margin: 18px 0 8px 0; font-weight: bold; text-align: left; }
  .meta-line { font-size: 10pt; margin-bottom: 5px; }
  .goods-table { width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 14px; font-size: 9.5pt; }
  .goods-table th, .goods-table td { border: 1px solid #333; padding: 6px 8px; }
  .goods-table th { background: #f2f2f2; text-align: center; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .total-block { margin-top: 12px; font-size: 10.5pt; }
  .notice { font-size: 8.5pt; color: #444; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 8px; }
  .sign-table { width: 100%; margin-top: 35px; }
  .sign-table td { width: 50%; vertical-align: top; font-size: 9.5pt; }
  @media print {
    body { margin: 10mm; }
  }
</style>
</head>
<body>
<table class="header-table">
  <tr>
    <td colspan="2" rowspan="2">
      ЗАО «Альфа-Банк», г. Минск, ул. Сурганова, 43<br>
      <small style="color: #666;">Банк получателя</small>
    </td>
    <td style="width: 15%;">БИК</td>
    <td style="width: 30%;"><strong>ALFABY2X</strong></td>
  </tr>
  <tr>
    <td>Сч. №</td>
    <td>30132G19399184600000</td>
  </tr>
  <tr>
    <td style="width: 25%;">УНП <strong>193991846</strong></td>
    <td style="width: 30%;">ОКПО —</td>
    <td rowspan="2">Сч. №</td>
    <td rowspan="2"><strong>BY88ALFA30132G19399184600000</strong></td>
  </tr>
  <tr>
    <td colspan="2">
      <strong>ИП Беляков Кирилл Олегович</strong><br>
      <small style="color: #666;">Получатель</small>
    </td>
  </tr>
</table>

<h1>СЧЁТ НА ОПЛАТУ № ${r} от ${g} г.</h1>
<hr style="border: 0; border-top: 2px solid #2563eb; margin-bottom: 12px;">

<div class="meta-line"><strong>Поставщик (Исполнитель):</strong> ИП Беляков Кирилл Олегович, УНП 193991846, 220045, Республика Беларусь, г. Минск, ул. Наполеона Орды, д. 11, кв. 58</div>
<div class="meta-line"><strong>Покупатель (Заказчик):</strong> ${n}${b?`, УНП: ${b}`:""}${d?`, email: ${d}`:""}</div>
<div class="meta-line"><strong>Основание:</strong> Публичный договор (оферта) возмездного оказания услуг Voxi.by (ОКЭД 62010)</div>

<table class="goods-table">
  <thead>
    <tr>
      <th style="width: 5%;">№</th>
      <th>Товары (работы, услуги)</th>
      <th style="width: 10%;">Кол-во</th>
      <th style="width: 8%;">Ед.</th>
      <th style="width: 15%;">Цена (BYN)</th>
      <th style="width: 15%;">Сумма (BYN)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="text-center">1</td>
      <td>Предоставление доступа к облачной платформе голосовых ИИ-ассистентов Voxi.by (пакет ${f} минут диалогов)</td>
      <td class="text-center">${f}</td>
      <td class="text-center">мин.</td>
      <td class="text-right">${o.toFixed(2)}</td>
      <td class="text-right"><strong>${x.toFixed(2)}</strong></td>
    </tr>
  </tbody>
</table>

<div class="total-block text-right">
  <div><strong>Итого без НДС:</strong> ${x.toFixed(2)} BYN</div>
  <div><strong>Ставка НДС:</strong> Без НДС (гл. 32 НК РБ, упрощённая система налогообложения)</div>
  <div style="font-size: 12pt; margin-top: 6px;"><strong>Всего к оплате: ${x.toFixed(2)} белорусских рублей</strong></div>
</div>

<div style="margin-top: 14px; font-size: 10pt;">
  Всего наименований 1, на сумму <strong>${x.toFixed(2)} BYN</strong> (Без НДС).
</div>

<div class="notice">
  <strong>Условия оплаты и поставки:</strong><br>
  1. Оплата данного счёта означает согласие с условиями Публичного договора (оферты), размещённого на сайте https://voxi.by/offer.<br>
  2. Срок оплаты — в течение 5 (пяти) банковских дней с даты выставления.<br>
  3. Назначение платежа: <em>«Оплата по счёту № ${r} от ${g} за пакет минут Voxi.by без НДС»</em>.<br>
  4. По факту оказания услуг первичный учётный документ (акт) составляется единолично Исполнителем (постановление Минфина РБ № 13) и направляется через сервис электронного документооборота ЭДиН либо на email Заказчика.
</div>

<table class="sign-table">
  <tr>
    <td>
      <strong>Исполнитель:</strong><br><br><br>
      _______________________ / К.О. Беляков /
    </td>
    <td>
      <strong>Заказчик:</strong><br><br><br>
      _______________________ / ________________ /
    </td>
  </tr>
</table>
</body>
</html>`}const xe=({isOpen:m,onClose:p,user:c,initialPackage:l,onSuccessTopUp:F})=>{const[h,f]=a.useState(l&&l.id!=="custom"?l.id:"pack_300"),[o,x]=a.useState((l==null?void 0:l.id)==="custom"),[r,g]=a.useState((l==null?void 0:l.id)==="custom"?l.minutes:200),[n,b]=a.useState("erip"),[d,V]=a.useState(""),[k,M]=a.useState(!1),[Y,re]=a.useState(!1),[I,B]=a.useState(!1),[S,X]=a.useState(""),[A,R]=a.useState(!1),[O,D]=a.useState(!1),[E,_]=a.useState(null),C=a.useRef(null);a.useEffect(()=>{l&&(l.id==="custom"?(x(!0),g(l.minutes)):(f(l.id),x(!1)))},[l]),a.useEffect(()=>{const t=C.current;t&&(m?(_(null),B(!1),t.open||t.showModal()):t.open&&t.close())},[m]);const G=t=>{if(k)return;const s=C.current;if(!s)return;const i=s.getBoundingClientRect();(t.clientX<i.left||t.clientX>i.right||t.clientY<i.top||t.clientY>i.bottom)&&p()},$=q.find(t=>t.id===h)||q[1],L=t=>t>=1e3?.35:t>=300?.4:.45,j=o?r:$.minutes,u=o?Math.round(r*L(r)):$.priceByn,U=o?L(r):$.ratePerMinute,z=()=>{const t=new Date,s=v=>String(v).padStart(2,"0"),i=`${s(t.getDate())}.${s(t.getMonth()+1)}.${t.getFullYear()}`;return{invoiceNo:S||`VX-${Date.now().toString().slice(-6)}`,invoiceDate:i,companyName:c.companyName||"ООО / ИП",unp:d.trim()||void 0,userEmail:c.email||"",minutes:j,ratePerMinute:U,totalByn:u}},H=()=>{const t=z(),s=T(t),i=window.open("","_blank");i&&(i.document.write(s),i.document.close(),i.focus(),setTimeout(()=>{i.print()},350))},J=()=>{const t=z(),s=T(t),i=new Blob(["\uFEFF"+s],{type:"application/msword;charset=utf-8"}),v=URL.createObjectURL(i),N=document.createElement("a");N.href=v,N.setAttribute("download",`Schet_${t.invoiceNo}_Voxi.doc`),document.body.appendChild(N),N.click(),document.body.removeChild(N),setTimeout(()=>URL.revokeObjectURL(v),2e3),D(!0),setTimeout(()=>D(!1),3500)},K=()=>{var i;const t=z(),s=[`Счёт на оплату: № ${t.invoiceNo} от ${t.invoiceDate} г.`,"Получатель: ИП Беляков Кирилл Олегович","УНП получателя: 193991846","Расчётный счёт (IBAN): BY88ALFA30132G19399184600000","Банк: ЗАО «Альфа-Банк», г. Минск, БИК ALFABY2X",`Сумма к оплате: ${u}.00 BYN (без НДС)`,`Плательщик: ${c.companyName}${d?` (УНП ${d})`:""}`,`Назначение платежа: Оплата по счёту № ${t.invoiceNo} от ${t.invoiceDate} за пакет ${j} минут Voxi.by (без НДС)`].join(`
`);(i=navigator.clipboard)==null||i.writeText(s),R(!0),setTimeout(()=>R(!1),2500)},Q=async()=>{if(_(null),n==="bank_invoice"){const t=`VX-${Date.now().toString().slice(-6)}`;X(t),B(!0);return}M(!0);try{const t=await fetch("/api/bepaid-checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({packageId:o?null:$.id,customMinutes:o?r:null,paymentMethod:n})});if(t.ok){const i=await t.json();if(i!=null&&i.redirectUrl){window.location.href=i.redirectUrl;return}}const s=await t.json().catch(()=>({}));_((s==null?void 0:s.message)||(s==null?void 0:s.error)||"Платёжный шлюз bePaid временно недоступен. Пожалуйста, выберите безналичный счёт или напишите в @voxi_support.")}catch{_("Не удалось связаться с платёжным сервером bePaid.")}finally{M(!1)}};return e.jsx("dialog",{ref:C,"aria-labelledby":"topup-modal-title",onClose:p,onClick:G,className:"w-[calc(100%-1.5rem)] max-w-xl rounded-[16px] liquid-glass-card shadow-2xl overflow-hidden p-0 text-black backdrop:bg-black/50 backdrop:backdrop-blur-md open:animate-fadeIn m-auto",children:e.jsxs("div",{className:"max-h-[90vh] flex flex-col",children:[e.jsxs("div",{className:"px-7 py-5 border-b border-black/[0.06] flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-[10px] bg-black text-white flex items-center justify-center shrink-0","aria-hidden":"true",children:e.jsx(P,{size:22})}),e.jsxs("div",{children:[e.jsx("div",{className:"flex items-center gap-2",children:e.jsx("h2",{id:"topup-modal-title",className:"text-base font-medium text-black tracking-tight",children:"Пополнение баланса минут"})}),e.jsxs("p",{className:"text-xs text-[#59544F]",children:["Текущий баланс: ",e.jsxs("strong",{className:"text-black font-medium",children:[c.balanceMinutes||0," мин"]})," (~",((c.balanceMinutes||0)*(c.ratePerMinute||.45)).toFixed(1)," BYN)"]})]})]}),e.jsx("button",{type:"button","aria-label":"Закрыть окно пополнения",onClick:p,className:"w-8 h-8 rounded-full liquid-glass-pill text-[#777169] hover:text-black flex items-center justify-center transition-colors cursor-pointer",children:e.jsx(W,{size:18})})]}),e.jsx("div",{className:"p-6 sm:p-7 overflow-y-auto space-y-5",children:Y?e.jsxs("div",{className:"py-10 text-center space-y-3",role:"status",children:[e.jsx("div",{className:"w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto",children:e.jsx(y,{size:36})}),e.jsx("h3",{className:"text-xl font-medium text-black",children:"Демо-баланс пополнен!"}),e.jsxs("p",{className:"text-xs text-[#59544F] max-w-sm mx-auto font-normal",children:["В ознакомительном режиме зачислено ",e.jsxs("strong",{className:"text-black font-semibold",children:["+",j," минут"]}),". При боевых платежах переадресация выполняется на защищённый шлюз ",e.jsx("strong",{children:"bePaid"}),"."]})]}):I?e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"p-5 rounded-[12px] liquid-glass-cream border border-black/[0.08] space-y-3.5 text-xs text-black",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 border-b border-black/[0.06] pb-3",children:[e.jsxs("div",{className:"flex items-center gap-2 font-medium text-sm text-black",children:[e.jsx(y,{size:18}),e.jsxs("span",{children:["Счёт на оплату № ",S||"VX-001"]})]}),e.jsxs("span",{className:"text-[11px] font-mono liquid-glass-pill text-black px-2 py-0.5 rounded-full font-medium",children:["от ",new Date().toLocaleDateString("ru-RU")," г."]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[#777169] block",children:"Плательщик (Заказчик):"}),e.jsx("strong",{className:"text-black font-medium",children:c.companyName||"Организация"}),d&&e.jsxs("span",{className:"block text-slate-600 font-mono",children:["УНП: ",d]})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-500 block",children:"Получатель (Исполнитель):"}),e.jsx("strong",{className:"text-slate-900 font-semibold",children:"ИП Беляков К.О."}),e.jsx("span",{className:"block text-slate-600 font-mono",children:"УНП: 193991846"})]})]}),e.jsxs("div",{className:"p-3 rounded-2xl bg-white border border-blue-200/70 space-y-1 font-mono text-[11px] text-slate-800 select-all",children:[e.jsxs("div",{className:"flex justify-between items-center text-[10px] text-slate-500 font-sans mb-1 border-b border-slate-100 pb-1",children:[e.jsx("span",{children:"Реквизиты для перечисления в Клиент-Банке:"}),e.jsx("span",{className:"text-blue-600 font-semibold",children:"без НДС"})]}),e.jsxs("div",{children:[e.jsx("strong",{children:"IBAN:"})," BY88ALFA30132G19399184600000"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Банк:"})," ЗАО «Альфа-Банк», г. Минск, БИК: ALFABY2X"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Назначение:"})," Оплата по счёту № ",S," за пакет ",j," мин Voxi.by"]})]}),e.jsxs("div",{className:"flex items-baseline justify-between pt-1",children:[e.jsx("span",{className:"text-slate-600",children:"Сумма к оплате:"}),e.jsxs("span",{className:"text-xl font-black text-[#2563eb]",children:[u,".00 BYN"]})]})]}),A&&e.jsxs("div",{role:"status",className:"p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-2",children:[e.jsx(y,{size:14,className:"text-emerald-600 shrink-0"}),e.jsx("span",{children:"Реквизиты счёта и назначение платежа скопированы в буфер обмена!"})]}),O&&e.jsxs("div",{role:"status",className:"p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-2",children:[e.jsx(y,{size:14,className:"text-emerald-600 shrink-0"}),e.jsx("span",{children:"Счёт на оплату (.doc) успешно скачан для отправки в бухгалтерию."})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1",children:[e.jsxs("button",{type:"button",onClick:H,className:"w-full py-2.5 px-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs",children:[e.jsx(Z,{size:16}),e.jsx("span",{children:"Печать / PDF"})]}),e.jsxs("button",{type:"button",onClick:J,className:"w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",children:[e.jsx(ee,{size:16}),e.jsx("span",{children:"Скачать .doc"})]}),e.jsxs("button",{type:"button",onClick:K,className:"w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",children:[e.jsx(te,{size:16}),e.jsx("span",{children:A?"Скопировано!":"Реквизиты"})]})]}),e.jsxs("div",{className:"pt-2 flex items-center justify-between text-xs",children:[e.jsxs("button",{type:"button",onClick:()=>B(!1),className:"text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 underline",children:[e.jsx(se,{size:14}),e.jsx("span",{children:"Изменить пакет или способ оплаты"})]}),e.jsx("span",{className:"text-[11px] text-slate-600",children:"Электронный акт через ЭДиН"})]})]}):e.jsxs(e.Fragment,{children:[E&&e.jsx("div",{role:"alert",className:"p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium",children:E}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-3 text-xs",children:[e.jsx("span",{className:"font-medium text-black",children:"Выберите пакет минут:"}),e.jsx("button",{type:"button",onClick:()=>x(!o),className:"text-black hover:underline font-normal cursor-pointer",children:o?"Выбрать готовый пакет":"Указать свое количество"})]}),o?e.jsxs("div",{className:"p-5 rounded-[12px] liquid-glass-cream border border-black/[0.08] space-y-3",children:[e.jsxs("div",{className:"flex justify-between items-center text-xs",children:[e.jsx("label",{htmlFor:"custom-minutes-range",className:"text-black font-normal",children:"Количество минут:"}),e.jsxs("span",{className:"font-medium text-black text-sm liquid-glass-pill px-3 py-0.5 rounded-full font-mono",children:[r," мин"]})]}),e.jsx("input",{id:"custom-minutes-range",type:"range",min:"50",max:"2000",step:"25",value:r,onChange:t=>g(Number(t.target.value)),className:"w-full h-1.5 bg-[#EBE8E4] rounded-full appearance-none cursor-pointer accent-black"}),e.jsxs("div",{className:"flex justify-between text-[11px] text-[#777169] font-mono",children:[e.jsx("span",{children:"50 мин"}),e.jsx("span",{children:"500 мин"}),e.jsx("span",{children:"1 000 мин"}),e.jsx("span",{children:"2 000 мин"})]})]}):e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-3",children:q.map(t=>{const s=h===t.id;return e.jsxs("button",{type:"button",onClick:()=>f(t.id),"aria-pressed":s,className:`cursor-pointer p-4 rounded-[12px] transition-all text-left relative flex flex-col justify-between ${s?"bg-black text-white shadow-md":"liquid-glass-cream text-black hover:border-black/20"}`,children:[t.savingsPercent&&e.jsxs("span",{className:`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-normal flex items-center gap-0.5 shadow-xs ${s?"bg-white text-black":"liquid-glass-btn-primary text-white"}`,children:[e.jsx(ie,{size:11}),"−",t.savingsPercent,"%"]}),e.jsxs("div",{children:[e.jsx("span",{className:`text-[11px] font-normal block mb-0.5 ${s?"text-white/70":"text-[#777169]"}`,children:t.name}),e.jsxs("div",{className:`text-lg font-medium tracking-tight ${s?"text-white":"text-black"}`,children:[t.minutes," мин"]}),e.jsxs("div",{className:`text-[11px] mt-1 font-mono ${s?"text-white/70":"text-[#777169]"}`,children:[t.ratePerMinute.toFixed(2)," BYN / мин"]})]}),e.jsxs("div",{className:`mt-4 pt-3 border-t flex items-baseline justify-between w-full ${s?"border-white/15":"border-black/[0.06]"}`,children:[e.jsxs("span",{className:`text-base font-medium ${s?"text-white":"text-black"}`,children:[t.priceByn," BYN"]}),s&&e.jsx(y,{size:16,className:"text-white"})]})]},t.id)})})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("span",{className:"font-normal text-[#777169] text-xs block",children:"Способ оплаты (через bePaid / Беларусь):"}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-2.5",children:[e.jsxs("button",{type:"button","aria-pressed":n==="erip",onClick:()=>b("erip"),className:`p-3.5 rounded-[12px] text-left flex items-start gap-2.5 transition-all cursor-pointer ${n==="erip"?"liquid-glass-dark text-white":"liquid-glass-cream text-black hover:border-black/20"}`,children:[e.jsx("div",{className:`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n==="erip"?"bg-white/10 text-white":"liquid-glass-card text-black"}`,children:e.jsx("span",{className:"text-xs font-bold",children:"ЕРИП"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-medium leading-tight",children:"ЕРИП (bePaid)"}),e.jsx("div",{className:`text-[10px] mt-0.5 ${n==="erip"?"text-white/70":"text-[#777169]"}`,children:"QR / АИС «Расчет»"})]})]}),e.jsxs("button",{type:"button","aria-pressed":n==="card",onClick:()=>b("card"),className:`p-3.5 rounded-[12px] text-left flex items-start gap-2.5 transition-all cursor-pointer ${n==="card"?"liquid-glass-dark text-white":"liquid-glass-cream text-black hover:border-black/20"}`,children:[e.jsx("div",{className:`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n==="card"?"bg-white/10 text-white":"liquid-glass-card text-black"}`,children:e.jsx(ne,{size:18})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-medium leading-tight",children:"Карта (bePaid)"}),e.jsx("div",{className:`text-[10px] mt-0.5 ${n==="card"?"text-white/70":"text-[#777169]"}`,children:"БЕЛКАРТ, Visa, MC"})]})]}),e.jsxs("button",{type:"button","aria-pressed":n==="bank_invoice",onClick:()=>b("bank_invoice"),className:`p-3.5 rounded-[12px] text-left flex items-start gap-2.5 transition-all cursor-pointer ${n==="bank_invoice"?"liquid-glass-dark text-white":"liquid-glass-cream text-black hover:border-black/20"}`,children:[e.jsx("div",{className:`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n==="bank_invoice"?"bg-white/10 text-white":"liquid-glass-card text-black"}`,children:e.jsx(le,{size:18})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-medium leading-tight",children:"Безнал (ИП / ООО)"}),e.jsx("div",{className:`text-[10px] mt-0.5 ${n==="bank_invoice"?"text-white/70":"text-[#777169]"}`,children:"Счёт в BYN и акт"})]})]})]}),n==="bank_invoice"&&e.jsxs("div",{className:"pt-1",children:[e.jsx("label",{htmlFor:"invoice-unp",className:"block text-[11px] font-normal text-black mb-1",children:"УНП вашей организации или ИП (необязательно):"}),e.jsx("input",{id:"invoice-unp",type:"text",inputMode:"numeric",maxLength:9,value:d,onChange:t=>V(t.target.value.replace(/\D/g,"")),placeholder:"Напр. 193991846",className:"w-full px-3.5 py-2 rounded-xl bg-white border border-black/[0.08] text-xs font-mono text-black focus:outline-none focus:border-black"})]})]}),e.jsxs("div",{className:"p-4 rounded-[12px] liquid-glass-cream border border-black/[0.08] space-y-2",children:[e.jsxs("div",{className:"flex justify-between items-center text-xs",children:[e.jsx("span",{className:"text-[#59544F]",children:"К зачислению на баланс:"}),e.jsxs("span",{className:"font-medium text-black font-mono",children:["+",j," минут"]})]}),e.jsxs("div",{className:"flex justify-between items-center text-xs",children:[e.jsx("span",{className:"text-[#59544F]",children:"Тариф за минуту:"}),e.jsxs("span",{className:"text-[#59544F] font-mono",children:[U.toFixed(2)," BYN / мин"]})]}),e.jsxs("div",{className:"pt-2 border-t border-black/[0.06] flex justify-between items-baseline",children:[e.jsx("span",{className:"text-sm font-normal text-black",children:"К оплате (без НДС):"}),e.jsxs("span",{className:"text-2xl font-medium text-black",children:[u," BYN"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2 text-[11px] text-[#777169]",children:[e.jsx(ae,{size:15,className:"text-black shrink-0","aria-hidden":"true"}),e.jsxs("span",{children:["Безопасный приём платежей обеспечивает ",e.jsx("strong",{children:"bePaid"})," (PCI DSS Level 1). Минуты не сгорают в конце месяца."]})]})]})}),!Y&&!I&&e.jsxs("div",{className:"p-5 border-t border-black/[0.06] bg-[#F5F3F1]/70 flex items-center justify-between gap-3",children:[e.jsx("button",{type:"button",onClick:p,disabled:k,className:"px-5 h-10 rounded-full liquid-glass-pill text-xs font-normal text-black hover:bg-white transition-colors cursor-pointer",children:"Отмена"}),e.jsx("button",{type:"button",onClick:Q,disabled:k,className:"flex-1 sm:flex-initial px-7 h-11 rounded-full liquid-glass-btn-primary text-white text-xs font-normal transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-[0.98]",children:k?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"}),e.jsx("span",{children:"Переход в bePaid..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(P,{size:16,"aria-hidden":"true"}),e.jsx("span",{children:n==="bank_invoice"?`Сформировать счёт на ${u} BYN`:`Оплатить ${u} BYN через bePaid`})]})})]})]})})};export{xe as TopUpModal};
