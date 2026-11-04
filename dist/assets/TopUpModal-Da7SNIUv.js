import{M as F,_ as Z}from"./index-DmZvYASk.js";import{r as i,j as e,v as U,d as ee,n as v,a9 as te,a1 as se,a3 as le,aa as ne,F as ae,ab as ie,ac as re,o as oe}from"./icons-B9_KrQdF.js";import"./vendor-BRJ-fevS.js";import"./motion-BC0GQ_jj.js";import"./supabase-s3XNS0mn.js";function X(N){const{invoiceNo:r,invoiceDate:n,companyName:a,unp:h,userEmail:u,minutes:f,ratePerMinute:o,totalByn:x}=N;return`<!DOCTYPE html>
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

<h1>СЧЁТ НА ОПЛАТУ № ${r} от ${n} г.</h1>
<hr style="border: 0; border-top: 2px solid #2563eb; margin-bottom: 12px;">

<div class="meta-line"><strong>Поставщик (Исполнитель):</strong> ИП Беляков Кирилл Олегович, УНП 193991846, 220045, Республика Беларусь, г. Минск, ул. Наполеона Орды, д. 11, кв. 58</div>
<div class="meta-line"><strong>Покупатель (Заказчик):</strong> ${a}${h?`, УНП: ${h}`:""}${u?`, email: ${u}`:""}</div>
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
  3. Назначение платежа: <em>«Оплата по счёту № ${r} от ${n} за пакет минут Voxi.by без НДС»</em>.<br>
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
</html>`}const pe=({isOpen:N,onClose:r,user:n,initialPackage:a,onSuccessTopUp:h})=>{const[u,f]=i.useState(a&&a.id!=="custom"?a.id:"pack_300"),[o,x]=i.useState((a==null?void 0:a.id)==="custom"),[m,Y]=i.useState((a==null?void 0:a.id)==="custom"?a.minutes:200),[d,k]=i.useState("erip"),[p,O]=i.useState(""),[y,B]=i.useState(!1),[I,w]=i.useState(!1),[A,M]=i.useState(!1),[C,G]=i.useState(""),[R,D]=i.useState(!1),[q,E]=i.useState(!1),[L,_]=i.useState(null),z=i.useRef(null);i.useEffect(()=>{a&&(a.id==="custom"?(x(!0),Y(a.minutes)):(f(a.id),x(!1)))},[a]),i.useEffect(()=>{const t=z.current;t&&(N?(_(null),M(!1),t.open||t.showModal()):t.open&&t.close())},[N]);const H=t=>{if(y)return;const s=z.current;if(!s)return;const l=s.getBoundingClientRect();(t.clientX<l.left||t.clientX>l.right||t.clientY<l.top||t.clientY>l.bottom)&&r()},$=F.find(t=>t.id===u)||F[1],P=t=>t>=1e3?.35:t>=300?.4:.45,b=o?m:$.minutes,c=o?Math.round(m*P(m)):$.priceByn,T=o?P(m):$.ratePerMinute,V=async()=>{try{const{default:t}=await Z(async()=>{const{default:s}=await import("./confetti.module-C2jkTI5u.js");return{default:s}},[]);t({particleCount:70,spread:80,origin:{y:.6},colors:["#2563eb","#10b981","#3b82f6","#f59e0b"]})}catch{}},S=()=>{const t=new Date,s=g=>String(g).padStart(2,"0"),l=`${s(t.getDate())}.${s(t.getMonth()+1)}.${t.getFullYear()}`;return{invoiceNo:C||`VX-${Date.now().toString().slice(-6)}`,invoiceDate:l,companyName:n.companyName||"ООО / ИП",unp:p.trim()||void 0,userEmail:n.email||"",minutes:b,ratePerMinute:T,totalByn:c}},J=()=>{const t=S(),s=X(t),l=window.open("","_blank");l&&(l.document.write(s),l.document.close(),l.focus(),setTimeout(()=>{l.print()},350))},K=()=>{const t=S(),s=X(t),l=new Blob(["\uFEFF"+s],{type:"application/msword;charset=utf-8"}),g=URL.createObjectURL(l),j=document.createElement("a");j.href=g,j.setAttribute("download",`Schet_${t.invoiceNo}_Voxi.doc`),document.body.appendChild(j),j.click(),document.body.removeChild(j),setTimeout(()=>URL.revokeObjectURL(g),2e3),E(!0),setTimeout(()=>E(!1),3500)},Q=()=>{var l;const t=S(),s=[`Счёт на оплату: № ${t.invoiceNo} от ${t.invoiceDate} г.`,"Получатель: ИП Беляков Кирилл Олегович","УНП получателя: 193991846","Расчётный счёт (IBAN): BY88ALFA30132G19399184600000","Банк: ЗАО «Альфа-Банк», г. Минск, БИК ALFABY2X",`Сумма к оплате: ${c}.00 BYN (без НДС)`,`Плательщик: ${n.companyName}${p?` (УНП ${p})`:""}`,`Назначение платежа: Оплата по счёту № ${t.invoiceNo} от ${t.invoiceDate} за пакет ${b} минут Voxi.by (без НДС)`].join(`
`);(l=navigator.clipboard)==null||l.writeText(s),D(!0),setTimeout(()=>D(!1),2500)},W=async()=>{if(_(null),d==="bank_invoice"){const t=`VX-${Date.now().toString().slice(-6)}`;G(t),M(!0);return}B(!0);try{const t=await fetch("/api/bepaid-checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({packageId:o?null:$.id,customMinutes:o?m:null,paymentMethod:d,userId:n.id,email:n.email,companyName:n.companyName})});if(t.ok){const l=await t.json();if(l!=null&&l.redirectUrl){window.location.href=l.redirectUrl;return}}if(n.isMock){B(!1),w(!0),V(),setTimeout(()=>{h(b,c),w(!1),r()},1400);return}const s=await t.json().catch(()=>({}));_((s==null?void 0:s.message)||(s==null?void 0:s.error)||"Платёжный шлюз bePaid временно недоступен. Пожалуйста, выберите безналичный счёт или напишите в @voxi_support.")}catch{n.isMock?(w(!0),V(),setTimeout(()=>{h(b,c),w(!1),r()},1400)):_("Не удалось связаться с платёжным сервером bePaid.")}finally{B(!1)}};return e.jsx("dialog",{ref:z,"aria-labelledby":"topup-modal-title",onClose:r,onClick:H,className:"w-[calc(100%-1.5rem)] max-w-xl rounded-[32px] sm:rounded-[40px] bg-white border border-slate-200 shadow-2xl overflow-hidden p-0 text-slate-900 backdrop:bg-black/60 backdrop:backdrop-blur-sm open:animate-fadeIn m-auto",children:e.jsxs("div",{className:"max-h-[90vh] flex flex-col",children:[e.jsxs("div",{className:"px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-[#2563eb]","aria-hidden":"true",children:e.jsx(U,{size:22})}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h2",{id:"topup-modal-title",className:"text-base font-bold text-slate-900 tracking-tight",children:"Пополнение баланса минут"}),n.isMock&&e.jsx("span",{className:"text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200",children:"Демо-режим"})]}),e.jsxs("p",{className:"text-xs text-slate-600",children:["Текущий баланс: ",e.jsxs("strong",{className:"text-slate-900 font-semibold",children:[n.balanceMinutes||0," мин"]})," (~",((n.balanceMinutes||0)*(n.ratePerMinute||.45)).toFixed(1)," BYN)"]})]})]}),e.jsx("button",{type:"button","aria-label":"Закрыть окно пополнения",onClick:r,className:"w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors",children:e.jsx(ee,{size:18})})]}),e.jsx("div",{className:"p-6 sm:p-7 overflow-y-auto space-y-5",children:I?e.jsxs("div",{className:"py-10 text-center space-y-3",role:"status",children:[e.jsx("div",{className:"w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto",children:e.jsx(v,{size:36})}),e.jsx("h3",{className:"text-xl font-bold text-slate-900",children:"Демо-баланс пополнен!"}),e.jsxs("p",{className:"text-xs text-slate-600 max-w-sm mx-auto",children:["В ознакомительном режиме зачислено ",e.jsxs("strong",{className:"text-emerald-700 font-semibold",children:["+",b," минут"]}),". При боевых платежах переадресация выполняется на защищённый шлюз ",e.jsx("strong",{children:"bePaid"}),"."]})]}):A?e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"p-5 rounded-3xl bg-blue-50/70 border border-blue-200/90 space-y-3.5 text-xs text-slate-800",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 border-b border-blue-200/60 pb-3",children:[e.jsxs("div",{className:"flex items-center gap-2 font-bold text-sm text-[#1d4ed8]",children:[e.jsx(v,{size:18}),e.jsxs("span",{children:["Счёт на оплату № ",C||"VX-001"]})]}),e.jsxs("span",{className:"text-[11px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold",children:["от ",new Date().toLocaleDateString("ru-RU")," г."]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-500 block",children:"Плательщик (Заказчик):"}),e.jsx("strong",{className:"text-slate-900 font-semibold",children:n.companyName||"Организация"}),p&&e.jsxs("span",{className:"block text-slate-600 font-mono",children:["УНП: ",p]})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-500 block",children:"Получатель (Исполнитель):"}),e.jsx("strong",{className:"text-slate-900 font-semibold",children:"ИП Беляков К.О."}),e.jsx("span",{className:"block text-slate-600 font-mono",children:"УНП: 193991846"})]})]}),e.jsxs("div",{className:"p-3 rounded-2xl bg-white border border-blue-200/70 space-y-1 font-mono text-[11px] text-slate-800 select-all",children:[e.jsxs("div",{className:"flex justify-between items-center text-[10px] text-slate-500 font-sans mb-1 border-b border-slate-100 pb-1",children:[e.jsx("span",{children:"Реквизиты для перечисления в Клиент-Банке:"}),e.jsx("span",{className:"text-blue-600 font-semibold",children:"без НДС"})]}),e.jsxs("div",{children:[e.jsx("strong",{children:"IBAN:"})," BY88ALFA30132G19399184600000"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Банк:"})," ЗАО «Альфа-Банк», г. Минск, БИК: ALFABY2X"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Назначение:"})," Оплата по счёту № ",C," за пакет ",b," мин Voxi.by"]})]}),e.jsxs("div",{className:"flex items-baseline justify-between pt-1",children:[e.jsx("span",{className:"text-slate-600",children:"Сумма к оплате:"}),e.jsxs("span",{className:"text-xl font-black text-[#2563eb]",children:[c,".00 BYN"]})]})]}),R&&e.jsxs("div",{role:"status",className:"p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-2",children:[e.jsx(v,{size:14,className:"text-emerald-600 shrink-0"}),e.jsx("span",{children:"Реквизиты счёта и назначение платежа скопированы в буфер обмена!"})]}),q&&e.jsxs("div",{role:"status",className:"p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-2",children:[e.jsx(v,{size:14,className:"text-emerald-600 shrink-0"}),e.jsx("span",{children:"Счёт на оплату (.doc) успешно скачан для отправки в бухгалтерию."})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1",children:[e.jsxs("button",{type:"button",onClick:J,className:"w-full py-2.5 px-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs",children:[e.jsx(te,{size:16}),e.jsx("span",{children:"Печать / PDF"})]}),e.jsxs("button",{type:"button",onClick:K,className:"w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",children:[e.jsx(se,{size:16}),e.jsx("span",{children:"Скачать .doc"})]}),e.jsxs("button",{type:"button",onClick:Q,className:"w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",children:[e.jsx(le,{size:16}),e.jsx("span",{children:R?"Скопировано!":"Реквизиты"})]})]}),e.jsxs("div",{className:"pt-2 flex items-center justify-between text-xs",children:[e.jsxs("button",{type:"button",onClick:()=>M(!1),className:"text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 underline",children:[e.jsx(ne,{size:14}),e.jsx("span",{children:"Изменить пакет или способ оплаты"})]}),e.jsx("span",{className:"text-[11px] text-slate-600",children:"Электронный акт через ЭДиН"})]})]}):e.jsxs(e.Fragment,{children:[L&&e.jsx("div",{role:"alert",className:"p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium",children:L}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-3 text-xs",children:[e.jsx("span",{className:"font-semibold text-slate-800",children:"Выберите пакет минут:"}),e.jsx("button",{type:"button",onClick:()=>x(!o),className:"text-[#2563eb] hover:underline font-medium",children:o?"Выбрать готовый пакет":"Указать свое количество"})]}),o?e.jsxs("div",{className:"p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3",children:[e.jsxs("div",{className:"flex justify-between items-center text-xs",children:[e.jsx("label",{htmlFor:"custom-minutes-range",className:"text-slate-700 font-medium",children:"Количество минут:"}),e.jsxs("span",{className:"font-bold text-[#2563eb] text-sm bg-blue-100/80 px-3 py-0.5 rounded-full font-mono",children:[m," мин"]})]}),e.jsx("input",{id:"custom-minutes-range",type:"range",min:"50",max:"2000",step:"25",value:m,onChange:t=>Y(Number(t.target.value)),className:"w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#2563eb]"}),e.jsxs("div",{className:"flex justify-between text-[11px] text-slate-500 font-mono",children:[e.jsx("span",{children:"50 мин"}),e.jsx("span",{children:"500 мин"}),e.jsx("span",{children:"1 000 мин"}),e.jsx("span",{children:"2 000 мин"})]})]}):e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-3",children:F.map(t=>{const s=u===t.id;return e.jsxs("button",{type:"button",onClick:()=>f(t.id),"aria-pressed":s,className:`cursor-pointer p-4 rounded-3xl border transition-all text-left relative flex flex-col justify-between ${s?"bg-blue-50/70 border-[#2563eb] shadow-sm ring-2 ring-[#2563eb]/20":"bg-white border-slate-200 hover:border-slate-300"}`,children:[t.savingsPercent&&e.jsxs("span",{className:"absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-0.5 shadow-xs",children:[e.jsx(ae,{size:11}),"−",t.savingsPercent,"%"]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-semibold text-slate-600 block mb-0.5",children:t.name}),e.jsxs("div",{className:"text-lg font-bold text-slate-900",children:[t.minutes," мин"]}),e.jsxs("div",{className:"text-[11px] text-slate-600 mt-1",children:[t.ratePerMinute.toFixed(2)," BYN / мин"]})]}),e.jsxs("div",{className:"mt-4 pt-3 border-t border-slate-200/60 flex items-baseline justify-between w-full",children:[e.jsxs("span",{className:"text-base font-extrabold text-[#2563eb]",children:[t.priceByn," BYN"]}),s&&e.jsx(v,{size:16,className:"text-[#2563eb]"})]})]},t.id)})})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("span",{className:"font-semibold text-slate-800 text-xs block",children:"Способ оплаты (через bePaid / Беларусь):"}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-2.5",children:[e.jsxs("button",{type:"button","aria-pressed":d==="erip",onClick:()=>k("erip"),className:`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${d==="erip"?"bg-blue-50/70 border-[#2563eb] text-[#2563eb]":"bg-white border-slate-200 text-slate-700 hover:border-slate-300"}`,children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0",children:e.jsx("span",{className:"text-xs font-black text-slate-800",children:"ЕРИП"})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold leading-tight",children:"ЕРИП (bePaid)"}),e.jsx("div",{className:"text-[10px] text-slate-600 mt-0.5",children:"QR-код / АИС «Расчет»"})]})]}),e.jsxs("button",{type:"button","aria-pressed":d==="card",onClick:()=>k("card"),className:`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${d==="card"?"bg-blue-50/70 border-[#2563eb] text-[#2563eb]":"bg-white border-slate-200 text-slate-700 hover:border-slate-300"}`,children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700",children:e.jsx(ie,{size:18})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold leading-tight",children:"Карта (bePaid)"}),e.jsx("div",{className:"text-[10px] text-slate-600 mt-0.5",children:"БЕЛКАРТ, Visa, MC"})]})]}),e.jsxs("button",{type:"button","aria-pressed":d==="bank_invoice",onClick:()=>k("bank_invoice"),className:`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${d==="bank_invoice"?"bg-blue-50/70 border-[#2563eb] text-[#2563eb]":"bg-white border-slate-200 text-slate-700 hover:border-slate-300"}`,children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700",children:e.jsx(re,{size:18})}),e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-bold leading-tight",children:"Безнал (ИП / ООО)"}),e.jsx("div",{className:"text-[10px] text-slate-600 mt-0.5",children:"Счёт в BYN и акт"})]})]})]}),d==="bank_invoice"&&e.jsxs("div",{className:"pt-1",children:[e.jsx("label",{htmlFor:"invoice-unp",className:"block text-[11px] font-medium text-slate-700 mb-1",children:"УНП вашей организации или ИП (необязательно):"}),e.jsx("input",{id:"invoice-unp",type:"text",inputMode:"numeric",maxLength:9,value:p,onChange:t=>O(t.target.value.replace(/\D/g,"")),placeholder:"Напр. 193991846",className:"w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-[#2563eb]"})]})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2",children:[e.jsxs("div",{className:"flex justify-between items-center text-xs",children:[e.jsx("span",{className:"text-slate-600",children:"К зачислению на баланс:"}),e.jsxs("span",{className:"font-bold text-slate-900 font-mono",children:["+",b," минут"]})]}),e.jsxs("div",{className:"flex justify-between items-center text-xs",children:[e.jsx("span",{className:"text-slate-600",children:"Тариф за минуту:"}),e.jsxs("span",{className:"text-slate-700 font-mono",children:[T.toFixed(2)," BYN / мин"]})]}),e.jsxs("div",{className:"pt-2 border-t border-slate-200 flex justify-between items-baseline",children:[e.jsx("span",{className:"text-sm font-semibold text-slate-900",children:"К оплате (без НДС):"}),e.jsxs("span",{className:"text-2xl font-black text-[#2563eb]",children:[c," BYN"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2 text-[11px] text-slate-600",children:[e.jsx(oe,{size:15,className:"text-emerald-600 shrink-0","aria-hidden":"true"}),e.jsxs("span",{children:["Безопасный приём платежей обеспечивает ",e.jsx("strong",{children:"bePaid"})," (PCI DSS Level 1). Минуты не сгорают в конце месяца."]})]})]})}),!I&&!A&&e.jsxs("div",{className:"p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3",children:[e.jsx("button",{type:"button",onClick:r,disabled:y,className:"px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors",children:"Отмена"}),e.jsx("button",{type:"button",onClick:W,disabled:y,className:"flex-1 sm:flex-initial px-7 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60",children:y?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"}),e.jsx("span",{children:"Переход в bePaid..."})]}):e.jsxs(e.Fragment,{children:[e.jsx(U,{size:16,"aria-hidden":"true"}),e.jsx("span",{children:d==="bank_invoice"?`Сформировать счёт на ${c} BYN`:n.isMock?`Протестировать оплату (${c} BYN)`:`Оплатить ${c} BYN через bePaid`})]})})]})]})})};export{pe as TopUpModal};
