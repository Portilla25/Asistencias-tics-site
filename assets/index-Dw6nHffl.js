(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function o(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(n){if(n.ep)return;n.ep=!0;const s=o(n);fetch(n.href,s)}})();let g={},B=[];try{B=JSON.parse(localStorage.getItem("asist_personalizados")||"[]")}catch{B=[]}let oe=JSON.parse(localStorage.getItem("asist_historial")||"[]"),ce=null,Ee=JSON.parse(localStorage.getItem("clase_base_config")||"{}"),Fe=null,P=JSON.parse(localStorage.getItem("horas_log")||"[]"),ae={};try{ae=JSON.parse(localStorage.getItem("asist_empty_modules")||"{}")}catch{ae={}}let T="dashboard";const U=new Date().toISOString().split("T")[0];if(B.length===0&&P.some(e=>(e==null?void 0:e._tipo)==="personalizado")){const e=new Map;P.filter(t=>(t==null?void 0:t._tipo)==="personalizado").forEach((t,o)=>{const a=Number(t._pid),n=Number.isFinite(a)&&a>0?a:Date.now()+o;e.has(n)||e.set(n,{id:n,nombre:t.curso||"Clase personalizada",tel:"",clases:[]});const s=e.get(n);t.fecha&&!s.clases.some(i=>i.fecha===t.fecha)&&s.clases.push({fecha:t.fecha,val:["Presente","Falta","Permiso"].includes(t.obsv)?t.obsv:"Presente",horas:t.horas||"",horaInicio:t.entrada||"",horaFin:t.salida||""})}),B=[...e.values()].sort((t,o)=>t.nombre.localeCompare(o.nombre,"es",{sensitivity:"base"})),localStorage.setItem("asist_personalizados",JSON.stringify(B))}function Ue(e){document.documentElement.setAttribute("data-theme",e),localStorage.setItem("asist_theme",e);const t=document.getElementById("themeLabel");t&&(t.textContent=e==="dark"?"🌙 Modo oscuro":"☀️ Modo claro")}function Ot(){const e=document.documentElement.getAttribute("data-theme")||"dark";Ue(e==="dark"?"light":"dark")}function p(e){const t=document.getElementById("toast");t&&(t.textContent=e,t.classList.add("show"),setTimeout(()=>t.classList.remove("show"),3e3))}function C(e,t,o,a){const n=document.getElementById("overlay"),s=document.getElementById("mTitle"),i=document.getElementById("mBody"),r=document.getElementById("mExtra"),l=document.getElementById("mOk");n&&(s.textContent=e||"",i.textContent=t||"",r.innerHTML=a||"",l.style.display=o?"inline-block":"none",l.onclick=()=>{typeof o=="function"&&o()},n.classList.add("show"))}function w(){const e=document.getElementById("overlay");e&&e.classList.remove("show")}function O(){localStorage.setItem("asist_state",JSON.stringify(g))}function K(e,t,o){oe.unshift({icon:e,msg:t,ctx:o,ts:Date.now()}),oe.length>200&&oe.pop(),localStorage.setItem("asist_historial",JSON.stringify(oe))}function Ht(){const e=document.getElementById("sidebar"),t=document.getElementById("sidebarOverlay");e&&e.classList.toggle("hidden"),t&&t.classList.toggle("show")}function Dt(e){const t=document.getElementById("globalResults");if(!t)return;if(!e.trim()){t.classList.remove("show");return}const o=[];ue().forEach(a=>{const n=g[a];n&&n.alumnos.forEach(s=>{s.nombre.toLowerCase().includes(e.toLowerCase())&&o.push({nombre:s.nombre,curso:a})})}),B.forEach(a=>{a.nombre.toLowerCase().includes(e.toLowerCase())&&o.push({nombre:a.nombre,curso:"Personalizado"})}),o.length===0?t.innerHTML='<div class="gr-empty">Sin resultados</div>':t.innerHTML=o.slice(0,8).map(a=>`<div class="gr-item"><div class="gr-name">${a.nombre}</div><div class="gr-sub">${a.curso}</div></div>`).join(""),t.classList.add("show")}function Rt(){const e=document.getElementById("globalResults");e&&e.classList.remove("show")}function je(e,t){if(!e||!t)return 0;const[o,a]=e.split(":").map(Number),[n,s]=t.split(":").map(Number),i=n*60+s-(o*60+a);return i>0?Math.round(i/60*10)/10:0}function Ie(){localStorage.setItem("horas_log",JSON.stringify(P))}const De={};function jt(e){return JSON.parse(JSON.stringify(e??null))}function Gt(e){const t=Z(e);return jt({alumnos:t.alumnos||[],retirados:t.retirados||[],asistencias:t.asistencias||{},fechas:t.fechas||[],motivos:t.motivos||{},notas:t.notas||{},participacion:t.participacion||{},emptiedAt:ae[e]&&(t.alumnos||[]).length===0?new Date(ae[e]).toISOString():null})}function Jt(e){return e&&g[e]?[e]:!e&&T&&g[T]?[T]:[]}async function qe(e){if(!Pe()||!e||!g[e])return!1;const t=Gt(e);return t.updatedAt=firebase.firestore.FieldValue.serverTimestamp(),await Fe.collection("modulos").doc(e).set(t),!0}function V(e){O();const t=Jt(e);return!Pe()||t.length===0?Promise.resolve(!1):(t.forEach(o=>{clearTimeout(De[o]),De[o]=setTimeout(()=>{delete De[o],qe(o).catch(a=>{console.error("Error sincronizando modulo:",o,a),p("No se pudo sincronizar con Firebase: "+a.message)})},350)}),Promise.resolve(!0))}function Ce(e,t,o,a,n){return V(e)}function Ve(e,t,o){return O(),Pe()?qe(e):Promise.resolve(!1)}function gt(e,t){return O(),Pe()?qe(e):Promise.resolve(!1)}function xe(){localStorage.setItem("asist_personalizados",JSON.stringify(B))}function Wt(e){return V(e)}function Ut(e){return V(e)}function ct(e){return String(e||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}function qt(e){return["Presente","Falta","Permiso"].includes(e==null?void 0:e.obsv)?e.obsv:"Presente"}function Vt(e){const t=new Map;return(e||[]).filter(o=>o&&(o._tipo==="personalizado"||String(o._uid||"").startsWith("pers_"))).forEach((o,a)=>{const n=Number(o._pid),s=Number.isFinite(n)&&n>0?n:Date.now()+a;t.has(s)||t.set(s,{id:s,nombre:o.curso||"Clase personalizada",tel:"",clases:[],_lastFecha:""});const i=t.get(s);o.fecha&&String(o.fecha).localeCompare(i._lastFecha||"")>=0&&o.curso&&(i.nombre=o.curso,i._lastFecha=o.fecha),o.fecha&&!i.clases.some(r=>r.fecha===o.fecha)&&i.clases.push({fecha:o.fecha,val:qt(o),horas:o.horas||"",horaInicio:o.entrada||"",horaFin:o.salida||""})}),[...t.values()].map(({_lastFecha:o,...a})=>a)}function Xt(e){const t=Array.isArray(e==null?void 0:e.personalizados)?e.personalizados:[],o=Vt(Array.isArray(e==null?void 0:e.horasLog)?e.horasLog:[]),a=t.length>0?t:o;if(a.length===0)return{alumnos:0,clases:0,horas:0};let n=0,s=0;a.forEach(r=>{const l=String(r.id||"");let d=B.find(c=>String(c.id)===l);d||(d=B.find(c=>ct(c.nombre)===ct(r.nombre))),d||(d={...r,id:r.id||Date.now()+Math.random(),clases:[]},B.push(d),n++),Array.isArray(d.clases)||(d.clases=[]),(r.clases||[]).forEach(c=>{if(!(c!=null&&c.fecha))return;const u=d.clases.find(m=>m.fecha===c.fecha);u?(!u.val&&c.val&&(u.val=c.val),!u.horas&&c.horas&&(u.horas=c.horas),!u.horaInicio&&c.horaInicio&&(u.horaInicio=c.horaInicio),!u.horaFin&&c.horaFin&&(u.horaFin=c.horaFin)):(d.clases.push({...c}),s++)}),d.clases.sort((c,u)=>String(c.fecha).localeCompare(String(u.fecha)))});let i=0;return((e==null?void 0:e.horasLog)||[]).filter(r=>r&&(r._tipo==="personalizado"||String(r._uid||"").startsWith("pers_"))).forEach(r=>{const l=r._uid||`pers_${r._pid||r.curso}_${r.fecha}`;P.some(c=>String(c._uid||"")===String(l))||P.some(c=>c._tipo==="personalizado"&&String(c._pid||"")===String(r._pid||"")&&c.fecha===r.fecha)||(P.push({...r,_uid:l,_tipo:"personalizado"}),i++)}),B.sort((r,l)=>r.nombre.localeCompare(l.nombre,"es",{sensitivity:"base"})),xe(),Ie(),{alumnos:n,clases:s,horas:i}}function Kt(){}function Qt(){}function vt(){const e=document.getElementById("adminCarrerasList");e&&(e.innerHTML=_.map(t=>`
    <div class="card" style="padding:16px;border:1px solid var(--border);border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:1.8rem;">${t.icono}</span>
        <div>
          <h4 style="font-size:1.05rem;font-weight:700;">${t.nombre}</h4>
          <div style="font-size:0.8rem;color:var(--muted);margin-top:4px;">${t.secciones?t.secciones.length:0} módulos configurados</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline" onclick="eliminarCarrera('${t.id}')" style="color:var(--danger);border-color:var(--danger)">🗑 Eliminar</button>
      </div>
    </div>
  `).join(""))}function Yt(e){if(_.length<=1){p("⚠️ Debe haber al menos una carrera.");return}C("🗑 Eliminar Carrera","¿Seguro que deseas eliminar esta carrera? Los datos no se borrarán de la base de datos (si usas Firebase) pero ya no se mostrarán en la interfaz local.",()=>{_=_.filter(t=>t.id!==e),localStorage.setItem("asist_carreras",JSON.stringify(_)),$===e&&($=_[0].id,localStorage.setItem("currentGrupo",$)),w(),p("🗑 Carrera eliminada"),setTimeout(()=>location.reload(),1e3)})}function Zt(){C("➕ Nueva Carrera",`
    <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px;">
      <div>
        <label style="font-size:.8rem;color:var(--muted)">Nombre de la Carrera/Aula</label>
        <input type="text" id="newCarreraNombre" class="inp" placeholder="Ej: Diseño Gráfico">
      </div>
      <div>
        <label style="font-size:.8rem;color:var(--muted)">Ícono (Emoji)</label>
        <input type="text" id="newCarreraIcono" class="inp" placeholder="Ej: 🎨" value="📚">
      </div>
    </div>
  `,()=>{const t=document.getElementById("newCarreraNombre").value.trim(),o=document.getElementById("newCarreraIcono").value.trim()||"📚";if(!t){p("⚠️ Escribe un nombre");return}const a="carrera_"+Date.now().toString(36),n={id:a,nombre:t,icono:o,color:"var(--violet)",secciones:[{id:a+"_M1",label:"Turno Mañana - Módulo 1",badge:"M1"}]};_.push(n),localStorage.setItem("asist_carreras",JSON.stringify(_)),w(),p("✅ Carrera creada"),setTimeout(()=>location.reload(),1e3)})}function ht(e){const t=String(e||"");if(/^\d{4}-\d{2}-\d{2}$/.test(t))return t.slice(0,7);const o=t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return o?`${o[3]}-${String(o[2]).padStart(2,"0")}`:""}function Xe(e){const t=String(e||"");if(/^\d{4}-\d{2}-\d{2}$/.test(t)){const[o,a,n]=t.split("-");return`${n}/${a}/${o}`}return t||"—"}function kt(e){if(!e)return"";const[t,o]=e.split("-").map(Number);return new Date(t,o-1,1).toLocaleDateString("es-ES",{month:"long",year:"numeric"})}function bt(e){var t;return e._tipo==="modulo"?e._grupo||((t=F(e._key))==null?void 0:t.carrera.id)||$:e._grupo||$}function eo(){var t;const e=((t=document.getElementById("horasFiltroMes"))==null?void 0:t.value)||"";return P.filter(o=>o&&o.fecha).filter(o=>bt(o)===$||!$).filter(o=>!e||ht(o.fecha)===e).sort((o,a)=>String(o.fecha).localeCompare(String(a.fecha))||String(o.curso||"").localeCompare(String(a.curso||"")))}function yt(){const e=document.getElementById("horasFiltroMes");if(!e)return;const t=e.value,o=[...new Set(P.filter(a=>bt(a)===$||!$).map(a=>ht(a.fecha)).filter(Boolean))].sort().reverse();e.innerHTML='<option value="">Todos los meses</option>'+o.map(a=>`<option value="${a}">${kt(a)}</option>`).join(""),t&&o.includes(t)&&(e.value=t)}function dt(e){return e._key||(e._tipo==="personalizado"?`pers_${e._pid||e.curso}`:e.curso||"manual")}function to(e,t){const o=dt(e),a=[...new Set(t.filter(r=>dt(r)===o).map(r=>r.fecha))].sort(),n=a.indexOf(e.fecha),s=Ee[o];if(!s||!s.fecha||!s.numero)return n>=0?n+1:"";const i=a.indexOf(s.fecha);return i===-1||n===-1?n+1:Math.max(1,Number(s.numero)+n-i)}function Re(e,t,o,a){const n=document.getElementById(e);if(n){if(t.length===0){n.innerHTML=`<tr><td colspan="12"><div class="empty"><div class="ei">📋</div>${a}</div></td></tr>`;return}n.innerHTML=t.map(s=>{const i=String(s._uid||s.id),r=to(s,o),l=s._tipo==="manual";return`
      <tr>
        <td style="font-family:'JetBrains Mono',monospace;color:var(--muted)">${r}</td>
        <td>${s._tipo==="modulo"?"📚":s._tipo==="personalizado"?"👤":"✏️"}</td>
        <td>${s.dia||""}</td>
        <td style="font-family:'JetBrains Mono',monospace">${Xe(s.fecha)}</td>
        <td>${s.curso||""}</td>
        <td><input class="finp" type="time" value="${s.entrada||""}" oninput="actualizarHora('${i}','entrada',this.value,false)" onblur="renderHoras()" style="width:92px;padding:5px 7px"></td>
        <td><input class="finp" type="time" value="${s.salida||""}" oninput="actualizarHora('${i}','salida',this.value,false)" onblur="renderHoras()" style="width:92px;padding:5px 7px"></td>
        <td style="color:var(--muted)">—</td>
        <td><input class="finp" type="number" min="0" value="${Number(s.alumnos||0)}" oninput="actualizarHora('${i}','alumnos',this.value,false)" onblur="renderHoras()" style="width:70px;padding:5px 7px"></td>
        <td><input class="finp" type="number" min="0" step="0.5" value="${Number(s.horas||0)}" oninput="actualizarHora('${i}','horas',this.value,false)" onblur="renderHoras()" style="width:76px;padding:5px 7px"></td>
        <td><input class="finp" value="${String(s.obsv||"").replaceAll('"',"&quot;")}" oninput="actualizarHora('${i}','obsv',this.value,false)" onblur="renderHoras()" style="min-width:120px;padding:5px 7px"></td>
        <td>${l?`<button class="btn btn-red" style="padding:3px 8px;font-size:.7rem" onclick="eliminarHora('${i}')">×</button>`:""}</td>
      </tr>`}).join("")}}function oo(e){const t=document.getElementById("horasMensualWrap");if(!t)return;const o=e.reduce((r,l)=>r+(Number.parseFloat(l.horas)||0),0),a=e.reduce((r,l)=>r+(Number.parseInt(l.alumnos)||0),0),n=e.filter(r=>r._tipo==="modulo").length,s=e.filter(r=>r._tipo==="personalizado").length,i=e.filter(r=>r._tipo==="manual").length;t.innerHTML=`
    <div class="stats-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:16px">
      <div class="stat"><div class="v amber">${e.length}</div><div class="l">Clases</div></div>
      <div class="stat"><div class="v green">${o.toFixed(1)}</div><div class="l">Horas</div></div>
      <div class="stat"><div class="v blue">${a}</div><div class="l">N° Al.</div></div>
      <div class="stat"><div class="v yellow">${n}</div><div class="l">Módulos</div></div>
      <div class="stat"><div class="v violet">${s+i}</div><div class="l">Otras</div></div>
    </div>`}function no(e){const t=document.getElementById("horasFuentesGrid");if(!t)return;const a=de($).map(n=>{const s=F(n),i=e.filter(l=>l._tipo==="modulo"&&l._key===n).length,r=e.filter(l=>l._tipo==="modulo"&&l._key===n).reduce((l,d)=>l+(Number.parseFloat(d.horas)||0),0);return`<div class="stat" style="padding:12px 14px">
      <div class="l">${(s==null?void 0:s.seccion.badge)||n}</div>
      <div style="font-size:.78rem;font-weight:700;margin-top:4px">${i} clase(s)</div>
      <div style="font-family:'JetBrains Mono',monospace;color:var(--green-l);font-size:.78rem;margin-top:3px">${r.toFixed(1)} h</div>
    </div>`});t.innerHTML=a.join("")}function pe(){T==="horas"&&Ye(!1,!1),yt();const e=eo(),t=e.filter(l=>l._tipo==="modulo"),o=e.filter(l=>l._tipo==="personalizado"),a=e.filter(l=>l._tipo==="manual");oo(e),no(e),Re("horasTbodyMod",t,e,"Sin clases de módulos para este filtro."),Re("horasTbodyPers",o,e,"Sin clases personalizadas para este filtro."),Re("horasTbodyMan",a,e,"Sin entradas manuales para este filtro.");const n=document.getElementById("horasModTotal"),s=document.getElementById("horasPersTotal");n&&(n.textContent=`${t.length} / ${t.reduce((l,d)=>l+(Number.parseFloat(d.horas)||0),0).toFixed(1)} h`),s&&(s.textContent=`${o.length} / ${o.reduce((l,d)=>l+(Number.parseFloat(d.horas)||0),0).toFixed(1)} h`);const i=document.getElementById("horasManualesWrap");i&&(i.style.display=a.length?"block":"none");const r=document.getElementById("horasTbody");r&&(r.innerHTML=e.map(l=>`<tr><td>${l.fecha}</td><td>${l.curso}</td><td>${l.horas}</td></tr>`).join(""))}function xt(){const e=document.getElementById("claseBaseCurso");e&&(e.innerHTML=de($).map(o=>{const a=F(o);return`<option value="${o}">${(a==null?void 0:a.seccion.label)||o}</option>`}).join(""));const t=document.getElementById("claseBaseFecha");t&&!t.value&&(t.value=U),yt()}function Ge(e,t){const o=document.getElementById("claseBaseStatus");o&&T==="horas"&&(o.textContent=`Clase registrada para ${Xe(t)}.`)}function ao(){var s,i,r;const e=(s=document.getElementById("claseBaseCurso"))==null?void 0:s.value,t=(i=document.getElementById("claseBaseFecha"))==null?void 0:i.value,o=Number.parseInt((r=document.getElementById("claseBaseNumero"))==null?void 0:r.value);if(!e){p("Selecciona un curso");return}if(!t){p("Selecciona una fecha de referencia");return}if(!o||o<1){p("Indica un número de clase válido");return}const a=F(e);Ee[e]={fecha:t,numero:o,label:(a==null?void 0:a.seccion.label)||e},localStorage.setItem("clase_base_config",JSON.stringify(Ee));const n=document.getElementById("claseBaseStatus");n&&(n.innerHTML=`<span style="font-size:.78rem;color:var(--green-l)">Referencia guardada: ${Ee[e].label} · clase ${o} el ${Xe(t)}</span>`),pe(),p("Número de clase actualizado")}function so(e,t,o,a=!0){const n=P.find(s=>String(s._uid||s.id)===String(e));if(n){if(t==="horas"?n[t]=Number.parseFloat(o)||0:t==="alumnos"?n[t]=Number.parseInt(o)||0:n[t]=o,(t==="entrada"||t==="salida")&&n.entrada&&n.salida){const s=je(n.entrada,n.salida);s>0&&(n.horas=s)}Ie(),a&&pe()}}function io(e){C("Eliminar entrada","¿Seguro que deseas quitar esta entrada manual del registro de horas?",()=>{P=P.filter(t=>String(t._uid||t.id)!==String(e)),Ie(),w(),pe(),p("Entrada eliminada")})}function ro(){C("🗑 Limpiar historial","¿Seguro que deseas borrar todo el historial de cambios? Esta acción no se puede deshacer.",()=>{oe=[],localStorage.setItem("asist_historial",JSON.stringify(oe)),w(),p("🗑 Historial eliminado")})}function lo(){const e={state:g,personalizados:B,historial:oe,carreras:_,horasLog:P,claseBaseConfig:Ee},t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),o=document.createElement("a");o.href=URL.createObjectURL(t),o.download=`backup_asistencias_${U}.json`,o.click(),p("💾 Backup exportado")}function co(){const e=document.createElement("input");e.type="file",e.accept=".json",e.onchange=t=>{const o=t.target.files[0];if(!o)return;const a=new FileReader;a.onload=n=>{try{const s=JSON.parse(n.target.result);C("📥 Importar Backup","",null,`
          <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px;">
            <p style="font-size:0.9rem;color:var(--muted)">¿Cómo deseas importar este archivo de backup?</p>
            <button class="btn btn-outline" id="btnRestaurarTodo" style="color:var(--danger);border-color:var(--danger)">⚠️ Reemplazar TODO (borra datos actuales)</button>
            <button class="btn btn-green" id="btnRestaurarPersonalizados">👤 Fusionar SOLO clases personalizadas</button>
            <button class="btn btn-violet" id="btnRestaurarRedes">✅ Restaurar SOLO Redes & TICs (Mantiene el resto intacto)</button>
          </div>
        `),document.getElementById("btnRestaurarTodo").onclick=()=>{s.state&&(g=s.state),s.personalizados&&(B=s.personalizados,xe()),s.historial&&(oe=s.historial,localStorage.setItem("asist_historial",JSON.stringify(oe))),s.carreras&&(_=s.carreras,localStorage.setItem("asist_carreras",JSON.stringify(_))),s.horasLog&&(P=s.horasLog),s.claseBaseConfig&&(Ee=s.claseBaseConfig),O(),Ie(),w(),p("📂 Backup completo restaurado"),setTimeout(()=>location.reload(),1e3)},document.getElementById("btnRestaurarPersonalizados").onclick=()=>{const r=Xt(s);if(w(),fe(),T==="horas"&&pe(),r.alumnos===0&&r.clases===0&&r.horas===0){p("⚠️ El backup no contiene clases personalizadas para fusionar");return}p(`✅ Personalizados fusionados: ${r.alumnos} alumno(s), ${r.clases} clase(s), ${r.horas} hora(s)`)},document.getElementById("btnRestaurarRedes").onclick=()=>{s.state?(Object.keys(s.state).forEach(r=>{r.startsWith("redes_")&&(g[r]=s.state[r])}),O(),w(),p("✅ Asistencias de Redes & TICs recuperadas"),setTimeout(()=>location.reload(),1e3)):p("⚠️ El archivo no contiene datos de estado válidos")}}catch{p("❌ Backup inválido")}},a.readAsText(o)},e.click()}Ue(localStorage.getItem("asist_theme")||document.documentElement.getAttribute("data-theme")||"dark");const $t=[{id:"redes",nombre:"Redes & TICs",icono:"🖥️",color:"var(--amber)",secciones:[{id:"redes_M_1",label:"Turno Mañana - Módulo 1",badge:"Mañana M1"},{id:"redes_M_2",label:"Turno Mañana - Módulo 2",badge:"Mañana M2"},{id:"redes_M_3",label:"Turno Mañana - Módulo 3",badge:"Mañana M3"},{id:"redes_M_4",label:"Turno Mañana - Módulo 4",badge:"Mañana M4"},{id:"redes_T_1",label:"Turno Tarde - Módulo 1",badge:"Tarde M1"},{id:"redes_T_2",label:"Turno Tarde - Módulo 2",badge:"Tarde M2"},{id:"redes_T_3",label:"Turno Tarde - Módulo 3",badge:"Tarde M3"},{id:"redes_T_4",label:"Turno Tarde - Módulo 4",badge:"Tarde M4"}]},{id:"info_gastro",nombre:"Tecnologías de la Información",icono:"👨‍🍳",color:"var(--teal)",secciones:[{id:"info_gastro_L_1",label:"Clase Lunes",badge:"Lunes"}]},{id:"tics_sabados",nombre:"Tecnologías Turno mañana sábados",icono:"📅",color:"var(--violet)",googleSheetCsvUrl:"",secciones:[{id:"tics_S_1",label:"Turno Sábado - Módulo 1",badge:"Sáb M1"},{id:"tics_S_2",label:"Turno Sábado - Módulo 2",badge:"Sáb M2"},{id:"tics_S_3",label:"Turno Sábado - Módulo 3",badge:"Sáb M3"},{id:"tics_S_4",label:"Turno Sábado - Módulo 4",badge:"Sáb M4"}]}];let _=null;var pt;try{let e=JSON.parse(localStorage.getItem("asist_carreras"));if(e&&e.length){const t=new Set;e=e.filter(s=>t.has(s.id)?!1:(t.add(s.id),!0));const o=s=>(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g," ").replace(/\s+/g," ").trim();e=e.filter(s=>s.id==="tics_sabados"?!0:!o(s.nombre).includes("sabado"));const a=$t.find(s=>s.id==="tics_sabados"),n=e.find(s=>s.id==="tics_sabados");!n&&a?e.push(a):n&&a&&!n.googleSheetCsvUrl&&(n.googleSheetCsvUrl=a.googleSheetCsvUrl),(pt=n==null?void 0:n.googleSheetCsvUrl)!=null&&pt.includes("docs.google.com/spreadsheets/d/")&&(n.googleSheetCsvUrl=""),localStorage.setItem("asist_carreras",JSON.stringify(e)),_=e}}catch{}_||(_=$t);let $=localStorage.getItem("currentGrupo");var ft;(!$||!_.find(e=>e.id===$))&&($=((ft=_[0])==null?void 0:ft.id)||"redes");function ue(){return _.flatMap(e=>e.secciones.map(t=>t.id))}function de(e){const t=_.find(o=>o.id===e);return t?t.secciones.map(o=>o.id):[]}function F(e){for(const t of _){const o=t.secciones.find(a=>a.id===e);if(o)return{carrera:t,seccion:o}}return null}function we(e){if(e.includes("-")){const n=e.split("-");return{prefix:n[0],num:Number.parseInt(n[1])||1,isLegacy:!0}}const t=e.split("_"),o=Number.parseInt(t.pop())||1;return{prefix:t.join("_"),num:o,isLegacy:!1}}function uo(e){const t=localStorage.getItem("asist_state");if(t)try{const o=JSON.parse(t),a={...o};let n=!1;for(const[s,i]of Object.entries(e))o[s]&&(o[s].alumnos||[]).length>0&&(a[i]=a[i]?{...a[i],...o[s]}:o[s],delete a[s],n=!0);n&&localStorage.setItem("asist_state",JSON.stringify(a))}catch(o){console.warn("Error en migración de asist_state",o)}}function mo(e){const t=localStorage.getItem("horas_log");if(t)try{const o=JSON.parse(t);let a=!1;o.forEach(n=>{var s;if(e[n._key]&&(n._key=e[n._key],a=!0),(s=n._uid)!=null&&s.startsWith("mod_"))for(const[i,r]of Object.entries(e))n._uid.includes(`_${i}_`)&&(n._uid=n._uid.replaceAll(`_${i}_`,`_${r}_`),a=!0)}),a&&localStorage.setItem("horas_log",JSON.stringify(o))}catch(o){console.warn("Error en migración de horas_log",o)}}(function(){const t={"M-1":"redes_M_1","M-2":"redes_M_2","M-3":"redes_M_3","M-4":"redes_M_4","T-1":"redes_T_1","T-2":"redes_T_2","T-3":"redes_T_3","T-4":"redes_T_4","G-1":"info_gastro_L_1","G-2":"info_gastro_L_2","G-3":"info_gastro_L_3","G-4":"info_gastro_L_4"};uo(t),mo(t)})();try{const e=JSON.parse(localStorage.getItem("asist_state")||"{}");e&&typeof e=="object"&&Object.assign(g,e)}catch{}ue().forEach(e=>{g[e]?(g[e].alumnos||(g[e].alumnos=[]),g[e].retirados||(g[e].retirados=[]),g[e].asistencias||(g[e].asistencias={}),g[e].fechas||(g[e].fechas=[]),g[e].motivos||(g[e].motivos={}),g[e].notas||(g[e].notas={}),g[e].participacion||(g[e].participacion={})):g[e]={alumnos:[],retirados:[],asistencias:{},fechas:[],motivos:{},notas:{},participacion:{}}});document.getElementById("topbarDate").textContent=new Date().toLocaleDateString("es",{weekday:"long",year:"numeric",month:"long",day:"numeric"});const ut=localStorage.getItem("fb_config");if(ut)try{st(it(ut))}catch{}ue().forEach(e=>{const t=document.createElement("div");t.className="page",t.id=`page-${e}`,t.innerHTML=_o(e),document.querySelector(".content").appendChild(t)});_.forEach(e=>{const t=document.createElement("div");t.className="page",t.id=`page-carrera_${e.id}`,t.innerHTML=So(e),document.querySelector(".content").appendChild(t)});Qe();Oe();function po(e){let t=0;for(let a=0;a<Math.min(e.length,5);a++){const n=e[a].join(" ").toLowerCase();if(n.includes("apellido")||n.includes("nombre")||n.includes("dni")){t=a;break}}const o=e[t].map(a=>String(a||"").trim().toLowerCase());return{headerIdx:t,idxNombre:o.findIndex(a=>a.includes("apellido")||a.includes("nombre")),idxDni:o.indexOf("dni"),idxCorreo:o.findIndex(a=>a.includes("correo")||a.includes("email")),idxNac:o.findIndex(a=>a.includes("nac")||a.includes("nacimiento")),idxCel:o.findIndex(a=>a.includes("celular")||a.includes("tel")||a.includes("cel")),idxEdad:o.indexOf("edad")}}function fo(e){if(!e||e.length<2)return[];const t=po(e),o=[];for(let a=t.headerIdx+1;a<e.length;a++){const n=e[a],s=String(n[Math.max(0,t.idxNombre)]||"").trim();if(!s||s.length<3)continue;const i=s.toLowerCase();i.includes("total")||i.includes("nombre")||/^[=]/.test(s)||o.push({id:null,nombre:s,dni:t.idxDni>=0?String(n[t.idxDni]||"").trim():"",correo:t.idxCorreo>=0?String(n[t.idxCorreo]||"").trim():"",fecha:t.idxNac>=0?String(n[t.idxNac]||"").trim():"",cel:t.idxCel>=0?String(n[t.idxCel]||"").trim():"",edad:t.idxEdad>=0?String(n[t.idxEdad]||"").trim():""})}return o}function go(e,t){let o=0,a=0;const n=e.alumnos.find(s=>ne(s.nombre)===ne(t.nombre));if(n)!n.dni&&t.dni&&(n.dni=t.dni,o++),!n.correo&&t.correo&&(n.correo=t.correo,o++),!n.cel&&t.cel&&(n.cel=t.cel,o++),!n.fecha&&t.fecha&&(n.fecha=t.fecha,o++),!n.edad&&t.edad&&(n.edad=t.edad,o++);else{const s=Ae(e);e.alumnos.push({...t,id:s}),e.asistencias[s]={},a++}return{actualizados:o,agregados:a}}function vo(e,t){let o=0,a=0,n=!1;return t.forEach(s=>{const i=Z(s);let r=0,l=0;e.forEach(d=>{const c=go(i,d);r+=c.agregados,l+=c.actualizados}),(r>0||l>0)&&(ye(i),o+=r,a+=l,n=!0,T===s&&R(s))}),{totalAgregados:o,totalActualizados:a,needsSave:n}}async function Ke(e=!1){const t=_.find(n=>n.id==="tics_sabados");if(!t||!t.googleSheetCsvUrl)return;const o=["tics_S_1","tics_S_2","tics_S_3","tics_S_4"],a=t.googleSheetCsvUrl;try{const n=await fetch(a);if(!n.ok)throw new Error(`HTTP ${n.status}`);const s=await n.text(),i=St(s.replaceAll(`\r
`,`
`).replaceAll("\r",`
`)),r=fo(i);if(!r.length){e&&p("📋 El Sheet aún no tiene alumnos con datos");return}const{totalAgregados:l,totalActualizados:d,needsSave:c}=vo(r,o);c?(O(),T==="dashboard"&&Oe(),e&&p(`✅ Sábados: ${l} inserciones, ${d} actualizaciones (total 4 módulos)`),typeof K=="function"&&l>0&&K("📅",`${l} inserciones de alumnos sincronizadas`,"Sábados M1-M4")):e&&p("✓ Sábados: sin cambios nuevos")}catch(n){e&&p("⚠️ Error al leer el Sheet de sábados: "+n.message),console.warn("[syncSheetTicsSabados]",n)}}setTimeout(()=>Ke(!1),2e3);setInterval(()=>Ke(!1),5*60*1e3);function ho(e){if(e==="dashboard")return"Resumen General";if(e==="personalizados")return"👤 Clases Personalizadas";if(e==="mensual")return"📅 Resumen Mensual";if(e==="historial")return"🕒 Historial de Cambios";if(e==="admin_carreras")return"⚙️ Gestión de Carreras";if(e==="horas"){const o=_.find(a=>a.id===$);return`🕐 Registro de Horas — ${(o==null?void 0:o.nombre)||""}`}if(e.startsWith("carrera_")){const o=e.split("carrera_")[1],a=_.find(n=>n.id===o);if(a)return`${a.icono} ${a.nombre} — Panel de Carrera`}const t=F(e);return t?`${t.seccion.label} — ${t.carrera.nombre}`:"Resumen General"}function bo(e){if(e==="dashboard")Oe();else if(e==="personalizados")fe();else if(e==="mensual"){const t=document.getElementById("mensualMes");t&&!t.value&&(t.value=U.slice(0,7))}else if(e!=="historial"){if(e==="admin_carreras")vt();else if(e==="horas")xt(),pe();else if(!e.startsWith("carrera_")){const t=new Date().toISOString().split("T")[0],o=document.getElementById(`date-${e}`);o&&o.value!==t&&(o.value===U||o.value==="")&&(o.value=t),R(e),setTimeout(()=>Ho(e),50)}}}function ze(e){var t;document.querySelectorAll(".page").forEach(o=>o.classList.remove("active")),document.querySelectorAll(".nav-item").forEach(o=>o.classList.remove("active")),(t=document.getElementById(`page-${e}`))==null||t.classList.add("active"),document.querySelectorAll(".nav-item").forEach(o=>{o.getAttribute("onclick")===`goPage('${e}')`&&o.classList.add("active")}),T=e,document.getElementById("topbarTitle").textContent=ho(e),window.innerWidth<900&&(document.getElementById("sidebar").classList.add("hidden"),document.getElementById("sidebarOverlay").classList.remove("show")),bo(e)}function Qe(){const e=_.find(n=>n.id===$);if(!e)return;const t=document.getElementById("logoMark");t&&(t.textContent=e.nombre);const o=document.getElementById("carrerasList");o&&(o.innerHTML=_.map(n=>`
          <div class="carrera-block${n.id===$?" carrera-active":""}" id="cb-${n.id}">
            <button class="carrera-header" onclick="switchGrupoAndPage('${n.id}','carrera_${n.id}')">
              <div class="carrera-strip" style="background:${n.color}"></div>
              <span class="carrera-icon">${n.icono}</span>
              <span class="carrera-name">${n.nombre}</span>
            </button>
          </div>`).join(""),o.innerHTML+='<button class="btn-nueva-carrera" onclick="showAddCarreraModal()">➕ Nueva Carrera</button>');const a=document.getElementById("mensualKey");a&&(a.innerHTML=_.flatMap(n=>n.secciones.map(s=>`<option value="${s.id}">${n.icono} ${s.label}</option>`)).join("")),document.querySelectorAll(".nav-item").forEach(n=>{n.classList.toggle("active",n.getAttribute("onclick")===`goPage('${T}')`)})}function yo(e){if(e===$){const t=document.getElementById("cb-"+e);t&&t.classList.toggle("carrera-active");return}Et(e)}function xo(e,t){e!==$&&($=e,localStorage.setItem("currentGrupo",e)),ze(t),Qe()}function Et(e){if(e===$)return;$=e,localStorage.setItem("currentGrupo",e),Qe(),!de(e).includes(T)&&T!=="dashboard"&&T!=="personalizados"&&T!=="mensual"&&T!=="historial"&&T!=="horas"&&T!=="admin_carreras"&&!T.startsWith("carrera_")?ze("dashboard"):T==="dashboard"&&Oe()}async function $o(e,t){if(!t)return{alumnos:[],retirados:[],asistencias:{},fechas:[],motivos:{},notas:{},participacion:{}};const o=t.asistencias||{},a=t.fechas||[],n=(t.alumnos||[]).map(r=>({...r,id:Number(r.id)||r.id})),s=(t.retirados||[]).map(r=>({...r,id:Number(r.id)||r.id})),i={};return Object.entries(o).forEach(([r,l])=>{const d=isNaN(r)?r:Number(r);i[d]=l}),{alumnos:n,retirados:s,asistencias:i,fechas:a,motivos:t.motivos||{},notas:t.notas||{},participacion:t.participacion||{},emptiedAt:t.emptiedAt||null,updatedAt:t.updatedAt||null}}function Eo(e,t,o,a){g[e]={alumnos:[],retirados:o.retirados||t.retirados||[],asistencias:{},fechas:[],motivos:{},notas:{},participacion:{}},a&&!ae[e]&&(ae[e]=Date.now(),et()),O()}function Io(e,t,o){g[e]={alumnos:t.alumnos||o.alumnos||[],retirados:t.retirados||o.retirados||[],asistencias:{...o.asistencias||{},...t.asistencias||{}},fechas:[...new Set([...t.fechas||[],...o.fechas||[]])].sort(),motivos:{...t.motivos||{},...o.motivos||{}},notas:tn(t.notas,o.notas),participacion:{...t.participacion||{},...o.participacion||{}}},on(),O()}async function wo(e,t,o,a){if(Pe()){const n=document.getElementById("fbLoaderOverlay");n&&(n.style.display="flex");try{const s=await Fe.collection("modulos").doc(a).get();if(s.exists){const i=await $o(a,s.data()),r=Z(a),l=i.emptiedAt&&(i.alumnos||[]).length===0;en(a,i,!0)?Eo(a,i,r,l):Io(a,i,r)}}catch(s){p("⚠️ No se pudo descargar datos a tiempo: "+s.message)}finally{n&&(n.style.display="none")}}ze(a)}function So(e){const t={};e.secciones.forEach(a=>{let n="General";const s=a.label.toLowerCase();if(s.includes("módulo 1"))n="Módulo 1";else if(s.includes("módulo 2"))n="Módulo 2";else if(s.includes("módulo 3"))n="Módulo 3";else if(s.includes("módulo 4"))n="Módulo 4";else if(s.includes("módulo")){const i=s.match(/módulo\s*\d+/i);i&&(n=i[0].replace(/^m/i,"M"))}else n=a.label.includes("-")?a.label.split("-")[1].trim():a.label;t[n]||(t[n]=[]),t[n].push(a)});const o=Object.keys(t).map(a=>{let s=t[a].map(i=>{let r=i.label.includes("-")?i.label.split("-")[0].trim():i.badge;return r.toLowerCase().includes("mañana")?r="☀️ "+r:r.toLowerCase().includes("tarde")&&(r="🌙 "+r),`<button class="pill-btn" onclick="cargarAsistencia('${e.id}', '${a}', '${r}', '${i.id}')">${r}</button>`}).join("");return`
          <div class="mod-card">
            <h4 class="mc-title">${a}</h4>
            <div class="mc-desc">Selecciona el turno para gestionar las asistencias, reportes y métricas de este grupo.</div>
            <div class="mc-pills">
              ${s}
            </div>
          </div>
        `}).join("");return`
        <div class="carrera-panel-header">
           <h2 style="font-size:1.6rem;font-weight:800;color:var(--text);margin-bottom:8px">
             <span style="margin-right:8px">${e.icono}</span> ${e.nombre}
           </h2>
           <div style="font-size:.9rem;color:var(--muted)">Selecciona un módulo y turno para comenzar a gestionar el aula.</div>
        </div>
        <div class="modulos-grid">
           ${o}
        </div>
      `}function _o(e){const t=F(e);if(!t)return"";const o=t.seccion;return`
  <div class="mod-header">
    <span class="mod-badge" style="background:${t.carrera.color}22;color:${t.carrera.color}">${o.badge}</span>
    <div class="mod-info">${o.label}</div>
  </div>

  <!-- IMPORT PANEL -->
  <div class="panel" id="importPanel-${e}">
    <div class="panel-title">📂 <span>Importar desde Excel, Google Sheets o cargar manualmente</span></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <label class="btn btn-amber" for="fileInput-${e}" style="cursor:pointer;">📂 Subir Excel de este módulo</label>
      <input type="file" id="fileInput-${e}" accept=".xlsx,.xls" style="display:none" onchange="importExcel('${e}',this)">
      <button class="btn btn-outline" onclick="showGoogleSheetsSyncModal('${e}')">📊 Google Sheets</button>
      <button class="btn btn-outline" onclick="showAddAlumnoModal('${e}')">➕ Agregar alumno manualmente</button>
      <button class="btn btn-outline" style="font-size:.75rem" onclick="propagarAlumnos('${e}')" title="Copiar alumnos a otra sección">📋 Propagar</button>
      <button class="btn btn-outline" style="font-size:.75rem;border-color:var(--amber);color:var(--amber)" onclick="showMoverModuloCompleto('${e}')" title="Mover todos los alumnos a otro módulo">📦 Mover Módulo</button>
    </div>
    <div style="font-size:.75rem;color:var(--muted);margin-top:10px;line-height:1.7;">
      El Excel debe tener: <strong>Fila 1</strong> = fechas · <strong>Fila 2</strong> = número de clase · <strong>Fila 3+</strong> = alumnos con valores <em>Presente / Falta / Permiso</em>. La última fila con fórmulas se omite automáticamente.
    </div>
  </div>

  <!-- STATS -->
  <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat"><div class="v green"  id="st-pres-${e}">0</div><div class="l">Presentes hoy</div></div>
    <div class="stat"><div class="v red"    id="st-falt-${e}">0</div><div class="l">Faltas hoy</div></div>
    <div class="stat"><div class="v blue"   id="st-perm-${e}">0</div><div class="l">Permisos hoy</div></div>
    <div class="stat"><div class="v yellow" id="st-alert-${e}">0</div><div class="l">Con alertas</div></div>
  </div>

  <div class="alert-bar" id="alertBar-${e}">⚠️ <span id="alertTxt-${e}"></span></div>

  <!-- SELECTOR DE FECHA — destacado -->
  <div class="date-selector-bar" id="datebar-${e}">
    <div class="date-selector-label">📅 Registrando asistencia del día:</div>
    <div class="date-selector-controls">
      <button class="date-quick-btn" id="btnHoy-${e}" onclick="setDateQuick('${e}','hoy')">Hoy</button>
      <button class="date-quick-btn" id="btnAyer-${e}" onclick="setDateQuick('${e}','ayer')">Ayer</button>
      <input type="date" class="date-inp-main" id="date-${e}" value="${U}" onchange="onDateChange('${e}')">
    </div>
    <div class="date-selector-info" id="dateInfo-${e}"></div>
  </div>

  <div class="toolbar">
    <div class="toolbar-h" id="modTitle-${e}">— alumnos</div>
    <div class="search-w">
      <span class="search-ico">🔍</span>
      <input class="inp" id="search-${e}" placeholder="Buscar..." oninput="renderModule('${e}')" style="padding-left:28px;width:165px;">
    </div>
    <div class="thr-wrap">⚠️ Alerta
      <select class="inp" id="thr-${e}" onchange="renderModule('${e}')">
        <option value="2">2 faltas</option>
        <option value="3" selected>3 faltas</option>
        <option value="4">4 faltas</option>
        <option value="5">5 faltas</option>
      </select>
    </div>
    <button class="btn btn-amber" onclick="marcarTodos('${e}','Presente')">✅ Todos presentes</button>
    <button class="btn btn-outline" onclick="showAddAlumnoModal('${e}')">➕ Alumno</button>
  </div>

  <div class="table-wrap">
    <table>
      <thead><tr>
        <th>#</th><th>Alumno</th><th id="th-asist-${e}">Asistencia hoy</th>
        <th>Historial</th><th>% Asistencia</th><th></th>
      </tr></thead>
      <tbody id="tbody-${e}"></tbody>
    </table>
  </div>
  <!-- Gráfica -->
  <div class="chart-wrap" style="margin-top:16px">
    <div class="chart-title">📊 Asistencia por fecha — últimas 10 clases</div>
    <div id="chart-${e}"><div style="color:var(--muted);font-size:.78rem;text-align:center;padding:16px">Sin datos aún</div></div>
  </div>
  <!-- Retirados -->
  <div id="retirados-section-${e}" style="display:none;margin-top:4px"></div>

  <!-- NOTAS -->
  <div style="margin-top:20px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
      <div style="font-size:.85rem;font-weight:700;">📝 Notas</div>
      <button class="btn btn-violet" onclick="showAddNotaModal('${e}')">＋ Nuevo tema</button>
    </div>
    <div id="notas-section-${e}"></div>
  </div>
  <!-- PARTICIPACIÓN -->
  <div style="margin-top:20px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-size:.85rem;font-weight:700;">🙋 Participación en clase</div>
        <div style="font-size:.72rem;color:var(--muted);margin-top:2px">Nota 0–20 · Se suma directamente a la nota elegida</div>
      </div>
      <button class="part-sum-btn" onclick="showSumarParticipacionModal('${e}')">➕ Sumar a nota</button>
    </div>
    <div id="part-section-${e}"></div>
  </div>`}function Mo(e,t){const o=t.files[0];if(!o)return;const a=new FileReader;a.onload=n=>{const s=XLSX.read(n.target.result,{type:"binary",cellDates:!0}),i=s.Sheets[s.SheetNames[0]],r=XLSX.utils.sheet_to_json(i,{header:1,defval:""}),l=It(r);if(!l){p("❌ No se pudieron leer los datos del archivo.");return}g[e]=l,R(e),p(`✅ ${l.alumnos.length} alumnos importados en ${e.replace("-"," Módulo ")}`),t.value=""},a.readAsBinaryString(o)}function Co(e){const t={};for(let a=1;a<e.length;a++){const n=e[a];let s=null;n instanceof Date?s=n.toISOString().split("T")[0]:n!==""&&n!==null&&(s=To(String(n).trim())),s&&(t[a]=s)}const o=[...new Set(Object.values(t))].sort();return{dateColMap:t,fechas:o}}function Ao(e,t){const o=[],a={};for(let n=2;n<e.length;n++){const s=e[n],i=String(s[0]||"").trim();if(!i||i.length<2)continue;const r=i.toLowerCase();if(r.includes("total")||r.includes("nombre")||r.includes("alumno")||/^[=]/.test(i)||String(s[1]||"").startsWith("="))continue;const l=n;o.push({id:l,nombre:i}),a[l]={};for(const[d,c]of Object.entries(t)){const u=String(s[d]||"").trim();(u==="Presente"||u==="Falta"||u==="Permiso")&&(a[l][c]=u)}}return{alumnos:o,asistencias:a}}function It(e){if(!e||e.length<3)return null;const{dateColMap:t,fechas:o}=Co(e[0]),{alumnos:a,asistencias:n}=Ao(e,t);return a.length===0?null:(a.sort((s,i)=>s.nombre.localeCompare(i.nombre,"es",{sensitivity:"base"})),{alumnos:a,asistencias:n,fechas:o})}function To(e){if(/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/.test(e)){const o=e.replace(/\//g,"-").split("-");return`${o[0]}-${o[1].padStart(2,"0")}-${o[2].padStart(2,"0")}`}if(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(e)){const o=e.split(/[-\/]/);return`${o[2]}-${o[1].padStart(2,"0")}-${o[0].padStart(2,"0")}`}const t=Number(e);return!isNaN(t)&&t>4e4&&t<6e4?new Date((t-25569)*86400*1e3).toISOString().split("T")[0]:null}let Me=JSON.parse(localStorage.getItem("google_sheets_sync")||"{}"),Le=null;async function Bo(e,t){const o=`https://sheets.googleapis.com/v4/spreadsheets/${e}/values/Sheet1?key=${t}`,a=await fetch(o);if(!a.ok)throw new Error("Error al conectar con Google Sheets");const n=await a.json();if(!n.values||n.values.length===0)throw new Error("Hoja vacía");return n.values}function No(e){return It(e)}function wt(e){const t=Me[e]||{};ue();const o=`
    <div style="margin-bottom:16px">
      <div class="fgroup">
        <div class="flabel">ID de Google Sheet <span style="color:var(--muted);font-size:.7rem">(del URL)</span></div>
        <input class="finp" id="gsSheetId" placeholder="Ej: 1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890" value="${t.sheetId||""}">
      </div>
      <div class="fgroup" style="margin-top:10px">
        <div class="flabel">API Key de Google <span style="color:var(--muted);font-size:.7rem">(necesario para privado)</span></div>
        <input class="finp" id="gsApiKey" type="password" placeholder="Tu API Key de Google Cloud" value="${t.apiKey||""}">
        <div style="font-size:.7rem;color:var(--muted);margin-top:4px">
          ⚠️ Si la hoja es pública, puedes publicarla como CSV y usar esa URL en vez de API Key.
        </div>
      </div>
      <div class="fgroup" style="margin-top:10px">
        <div class="flabel">URL pública (CSV) <span style="color:var(--muted);font-size:.7rem">(alternativo)</span></div>
        <input class="finp" id="gsCsvUrl" placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv" value="${t.csvUrl||""}">
      </div>
      <div style="margin-top:14px;display:flex;align-items:center;gap:8px">
        <input type="checkbox" id="gsAutoSync" ${t.autoSync?"checked":""}>
        <label for="gsAutoSync" style="font-size:.82rem">Sincronización automática cada 5 min</label>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-amber" onclick="importarDesdeGoogleSheets('${e}')">📥 Importar ahora</button>
      <button class="btn btn-outline" onclick="testGoogleSheetsConnection('${e}')">🔗 Probar conexión</button>
    </div>
    <div id="gsSyncStatus" style="margin-top:12px;font-size:.78rem;color:var(--muted)"></div>`;C("📊 Sincronizar con Google Sheets","",()=>{var r,l,d,c;const a=(r=document.getElementById("gsSheetId"))==null?void 0:r.value.trim(),n=(l=document.getElementById("gsApiKey"))==null?void 0:l.value.trim(),s=(d=document.getElementById("gsCsvUrl"))==null?void 0:d.value.trim(),i=(c=document.getElementById("gsAutoSync"))==null?void 0:c.checked;if(!a&&!s){p("⚠️ Ingresa el ID del Sheet o URL CSV");return}Me[e]={sheetId:a,apiKey:n,csvUrl:s,autoSync:i},localStorage.setItem("google_sheets_sync",JSON.stringify(Me)),i?Lo(e):_t(),w(),p("✅ Configuración guardada")},o)}async function Po(e){const t=Me[e];if(!t){p("⚠️ Configura la conexión primero"),wt(e);return}p("⏳ Importando desde Google Sheets...");try{let o;if(t.csvUrl){const l=await fetch(t.csvUrl);if(!l.ok)throw new Error("CSV no accesible");const c=(await l.text()).replace(/\r\n/g,`
`).replace(/\r/g,`
`);o=St(c)}else if(t.sheetId&&t.apiKey)o=await Bo(t.sheetId,t.apiKey);else throw new Error("Configuración incompleta");const a=No(o);if(!a){p("❌ No se pudieron parsear los datos");return}const n=g[e],s=[...(n==null?void 0:n.alumnos)||[]],i={...(n==null?void 0:n.asistencias)||{}};a.alumnos.forEach(l=>{const d=s.findIndex(c=>c.nombre.trim().toLowerCase()===l.nombre.trim().toLowerCase());if(d===-1){const c=Ae({alumnos:s,retirados:(n==null?void 0:n.retirados)||[]});s.push({...l,id:c}),i[c]=a.asistencias[l.id]||{}}else{const c=s[d].id;i[c]={...i[c],...a.asistencias[l.id]}}});const r=[...new Set([...(n==null?void 0:n.fechas)||[],...a.fechas])].sort();g[e]={...g[e],alumnos:s.sort((l,d)=>l.nombre.localeCompare(d.nombre,"es",{sensitivity:"base"})),asistencias:i,fechas:r,motivos:{...(n==null?void 0:n.motivos)||{},...a.motivos||{}},notas:{...(n==null?void 0:n.notas)||{},...a.notas||{}},participacion:{...(n==null?void 0:n.participacion)||{},...a.participacion||{}}},O(),R(e),p(`✅ ${a.alumnos.length} alumnos importados. Total: ${s.length}`)}catch(o){p(`❌ Error: ${o.message}`)}}function St(e){const t=[];let o=[],a="",n=!1;for(let s=0;s<e.length;s++){const i=e[s],r=e[s+1];n?i==='"'&&r==='"'?(a+='"',s++):i==='"'?n=!1:a+=i:i==='"'?n=!0:i===","?(o.push(a.trim()),a=""):i===`
`?(o.push(a.trim()),o.some(l=>l)&&t.push(o),o=[],a=""):a+=i}return(a||o.length>0)&&(o.push(a.trim()),o.some(s=>s)&&t.push(o)),t}function Lo(e){_t(),Le=setInterval(()=>{const t=Me[e];t!=null&&t.autoSync&&Po(e)},5*60*1e3)}function _t(){Le&&(clearInterval(Le),Le=null)}function Fo(e,t,o,a){const n=t.asistencias[e.id]||{},s=n[o]||"",i=t.fechas.filter(v=>v!==o).slice(-15);let r=0,l=0;Object.values(n).forEach(v=>{v==="Falta"?r++:(v==="Presente"||v==="Permiso")&&l++});const d=t.fechas.filter(v=>v<=o).length,c=d>0?Math.round(l/d*100):0,u=r>=a,m=c>=80?"var(--green)":c>=60?"var(--yellow)":"var(--red)";return{hoy:s,hist:i,totalF:r,pct:c,enAlerta:u,barCol:m,reg:n}}function zo(e,t,o,a,n,s){const{hoy:i,hist:r,totalF:l,pct:d,enAlerta:c,barCol:u,reg:m}=s,v=o.motivos&&o.motivos[e.id]&&o.motivos[e.id][a]||null,f=!!(e.dni||e.cel||e.correo||e.edad);let b="";const h=e.nombre.replaceAll("'","\\'");i==="Falta"&&(e.cel&&(b+=`<button onclick="enviarWhatsApp('${h}','${e.cel}','${n}','${a}')" style="background:#25D366;color:#fff;border:none;border-radius:6px;padding:3px 8px;font-size:.72rem;cursor:pointer;font-weight:600">📱 WA</button>`),e.correo&&(b+=`<button onclick="enviarCorreo('${h}','${e.correo}','${n}','${a}')" style="background:var(--sky);color:#000;border:none;border-radius:6px;padding:3px 8px;font-size:.72rem;cursor:pointer;font-weight:600">✉️</button>`));const y=r.map(x=>{var M,H;const E=m[x]||"none",D=(H=(M=o.motivos)==null?void 0:M[e.id])==null?void 0:H[x];return`<div class="hd ${E}" title="${x}: ${E}${D?`
📎 `+D.texto:""}" style="${D?"box-shadow:0 0 0 1.5px var(--amber)":""}"></div>`}).join("");return`
      <td style="color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:.75rem">${t+1}</td>
      <td>
        <div class="aname" onclick="showPerfil('${n}',${e.id})" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px">${e.nombre}</div>
        ${c?`<div class="asub" style="color:var(--red)">⚠️ ${l} falta(s)</div>`:""}
        ${e.dni?`<div class="asub" style="color:var(--muted);font-family:'JetBrains Mono',monospace">DNI: ${e.dni}</div>`:""}
        ${!e.dni&&!f?'<div class="asub" style="color:var(--muted2);font-size:.66rem">Sin datos extra</div>':""}
      </td>
      <td>
        <div class="segmented-control">
          <button class="seg-btn p${i==="Presente"?" active":""}" onclick="setAsist('${n}',${e.id},'${a}','Presente')">P</button>
          <button class="seg-btn f${i==="Falta"?" active":""}${v&&i==="Falta"?" has-motivo":""}" onclick="setAsistConMotivo('${n}',${e.id},'${a}','Falta')">F</button>
          <button class="seg-btn j${i==="Permiso"?" active":""}${v&&i==="Permiso"?" has-motivo":""}" onclick="setAsistConMotivo('${n}',${e.id},'${a}','Permiso')">J</button>
        </div>
      </td>
      <td>
        <div class="hdots">${y}</div>
      </td>
      <td>
        <div class="pbar">
          <div class="pbg"><div class="pfill" style="width:${d}%;background:${u}"></div></div>
          <span class="pval" style="color:${u}">${d}%</span>
        </div>
      </td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
          ${b}
          <button class="btn-edit-data" onclick="showEditarAlumno('${n}',${e.id})" title="Editar datos del alumno">✏️</button>
          <button class="btn btn-outline" style="padding:3px 8px;font-size:.7rem;border:1px solid rgba(255,255,255,0.15);" onclick="showMoverAlumno('${n}',${e.id})" title="Mover a otra sección/turno">🔄 Mover</button>
          <button class="btn btn-red" style="padding:3px 8px;font-size:.7rem" onclick="eliminarAlumno('${n}',${e.id})">✕</button>
          <button class="btn-retirar" onclick="retirarAlumno('${n}',${e.id})">📤 Retirar</button>
        </div>
      </td>`}function R(e){var v,f,b;const t=Z(e),o=((v=document.getElementById(`date-${e}`))==null?void 0:v.value)||U,a=(((f=document.getElementById(`search-${e}`))==null?void 0:f.value)||"").toLowerCase(),n=Number.parseInt(((b=document.getElementById(`thr-${e}`))==null?void 0:b.value)||3),s=t.alumnos.filter(h=>h.nombre.toLowerCase().includes(a));t.alumnos.length>0&&!t.fechas.includes(o)&&t.alumnos.some(y=>(t.asistencias[y.id]||{})[o])&&(t.fechas.push(o),t.fechas.sort()),document.getElementById(`modTitle-${e}`).textContent=`${t.alumnos.length} alumno(s) registrado(s)`;let i=0,r=0,l=0,d=0;const c=document.getElementById(`tbody-${e}`);if(!c)return;c.innerHTML="",s.length===0&&(c.innerHTML=`<tr><td colspan="6"><div class="empty"><div class="ei">${t.alumnos.length===0?"📋":"🔍"}</div>${t.alumnos.length===0?"Sin alumnos. Importa un Excel o agrega manualmente.":"Sin resultados."}</div></td></tr>`),s.forEach((h,y)=>{const x=Fo(h,t,o,n);x.hoy==="Presente"?i++:x.hoy==="Falta"?r++:x.hoy==="Permiso"&&l++,x.enAlerta&&d++;const E=document.createElement("tr");E.innerHTML=zo(h,y,t,o,e,x),c.appendChild(E)}),document.getElementById(`st-pres-${e}`).textContent=i,document.getElementById(`st-falt-${e}`).textContent=r,document.getElementById(`st-perm-${e}`).textContent=l,document.getElementById(`st-alert-${e}`).textContent=d;const u=t.alumnos.filter(h=>Object.values(t.asistencias[h.id]||{}).filter(y=>y==="Falta").length>=n),m=document.getElementById(`alertBar-${e}`);u.length>0?(m.classList.add("show"),document.getElementById(`alertTxt-${e}`).innerHTML=`<strong>${u.length} alumno(s) con ${n}+ faltas:</strong> ${u.map(h=>h.nombre.split(" ")[0]).join(", ")}`):m.classList.remove("show"),ln(e),Uo(e),Be(e),nt(e)}function Oo(e,t){const o=document.getElementById(`date-${e}`);if(o){if(t==="hoy")o.value=U;else if(t==="ayer"){const a=new Date;a.setDate(a.getDate()-1),o.value=a.toISOString().split("T")[0]}Mt(e)}}function Mt(e){R(e),Ct(e)}function Ct(e){const t=document.getElementById(`date-${e}`);if(!t)return;const o=t.value,a=document.getElementById(`dateInfo-${e}`),n=document.getElementById(`btnHoy-${e}`),s=document.getElementById(`btnAyer-${e}`),i=document.getElementById(`th-asist-${e}`),r=new Date;r.setDate(r.getDate()-1);const l=r.toISOString().split("T")[0];if(n&&n.classList.toggle("active",o===U),s&&s.classList.toggle("active",o===l),a)if(o===U)a.textContent="📅 Hoy",a.className="date-selector-info hoy";else{const[d,c,u]=o.split("-"),m=`${u}/${c}/${d}`;a.textContent=`📆 Fecha pasada: ${m}`,a.className="date-selector-info pasado"}if(i)if(o===U)i.textContent="Asistencia hoy";else{const[d,c,u]=o.split("-");i.textContent=`Asistencia ${u}/${c}/${d}`}}function Ho(e){Ct(e)}function Do(e,t,o,a){var i,r,l,d;const n=g[e];if(n.asistencias[t]||(n.asistencias[t]={}),n.asistencias[t][o]===a?(delete n.asistencias[t][o],(r=(i=n.motivos)==null?void 0:i[t])!=null&&r[o]&&delete n.motivos[t][o],a=""):(n.asistencias[t][o]=a,a==="Presente"&&((d=(l=n.motivos)==null?void 0:l[t])!=null&&d[o])&&delete n.motivos[t][o],n.fechas.includes(o)||(n.fechas.push(o),n.fechas.sort())),R(e),O(),Ce(e),At(e,t),a==="Presente"||a==="Falta"||a==="Permiso"){const c=!P.some(u=>u._uid===`mod_${e}_${o}`);Ro(),c&&typeof Ge=="function"&&Ge(e,o)}const s=n.alumnos.find(c=>c.id===t)||(n.retirados||[]).find(c=>c.id===t);if(s&&typeof K=="function"){const c=e.replace("M-","Mañana M").replace("T-","Tarde M"),u={Presente:"✅",Falta:"❌",Permiso:"🔵","":"↩️"},m={Presente:"Presente",Falta:"Falta",Permiso:"Permiso","":"eliminada"};K(u[a]||"📝",`${s.nombre} — ${m[a]||a}`,`${c} · ${o}`)}}function Ro(e,t){Ye(!1)}function Ye(e=!0,t=!0){const o=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"],a=ue();let n=0;if(P=P.filter(s=>!(s._tipo==="modulo"&&(!s.curso||s.curso.includes("undefined")))),P.forEach(s=>{if(s._tipo==="modulo"&&s._key){const i=F(s._key);i&&s._grupo!==i.carrera.id&&(s._grupo=i.carrera.id),i&&(!s.curso||s.curso.includes("undefined"))&&(s.curso=i.seccion.label)}}),P=P.filter(s=>{if(s._tipo==="modulo"){const i=g[s._key];return!!i&&(i.fechas||[]).includes(s.fecha)}if(s._tipo==="personalizado"){const i=B.find(r=>String(r.id)===String(s._pid));return i?(i.clases||[]).some(r=>r.fecha===s.fecha):!0}return!0}),a.forEach(s=>{const i=g[s];if(!i)return;const r=F(s),l=r?r.seccion.label:s,d=r?r.carrera.id:$;(i.alumnos||[]).length;const c=s.includes("_M_")||l.toLowerCase().includes("mañana"),u=s.includes("_T_")||l.toLowerCase().includes("tarde");let m,v,f;if(c)m="09:00",v="13:00",f=4;else if(u)m="14:00",v="18:00",f=4;else{const b=P.find(h=>h._key===s&&h.entrada&&h.salida);b?(m=b.entrada,v=b.salida,f=je(b.entrada,b.salida)||2):(m="11:00",v="13:00",f=2)}(i.fechas||[]).forEach(b=>{const h=`mod_${s}_${b}`,y=(i.alumnos||[]).filter(D=>{var H,q;const M=((q=(H=i.asistencias)==null?void 0:H[D.id])==null?void 0:q[b])||"";return M!==""&&M!=="Falta"}).length,x=P.findIndex(D=>D._uid===h);if(x>=0){P[x].alumnos=y;return}const E=o[new Date(b+"T12:00:00").getDay()];P.push({id:Date.now()+Math.random(),_uid:h,_tipo:"modulo",_grupo:d,_key:s,dia:E,fecha:b,curso:l,tema:"",entrada:m,salida:v,horas:f,alumnos:y,obsv:"Presencial"}),n++})}),B.forEach(s=>{(s.clases||[]).forEach(i=>{if(!i.horas&&!i.horaInicio)return;const r=`pers_${s.id}_${i.fecha}`;if(P.some(u=>u._uid===r))return;const d=o[new Date(i.fecha+"T12:00:00").getDay()];let c=0;i.horas?c=Number.parseFloat(i.horas):i.horaInicio&&i.horaFin&&(c=je(i.horaInicio,i.horaFin)),P.push({id:Date.now()+Math.random(),_uid:r,_tipo:"personalizado",_pid:s.id,dia:d,fecha:i.fecha,curso:s.nombre,tema:"",entrada:i.horaInicio||"",salida:i.horaFin||"",horas:c||1,alumnos:1,obsv:i.val||"Presente"}),n++})}),Ie(),t&&T==="horas"&&pe(),e){const s=document.getElementById("horasSyncStatus");s&&(s.textContent=`✓ Sincronizado — ${n} entrada(s) nueva(s)`),n>0?p(`🔄 ${n} clase(s) importadas`):p("✓ Todo al día")}}function jo(){const e=`
    <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px;margin-top:4px">
      <div class="fgroup" style="grid-column:1/-1">
        <div class="flabel">Descripción / Curso *</div>
        <input class="finp" id="hmCurso" placeholder="Ej: Capacitación docente">
      </div>
      <div class="fgroup">
        <div class="flabel">Fecha *</div>
        <input class="finp" type="date" id="hmFecha" value="${U}">
      </div>
      <div class="fgroup">
        <div class="flabel">Horas *</div>
        <input class="finp" type="number" id="hmHoras" min="0.5" max="12" step="0.5" placeholder="Ej: 2">
      </div>
      <div class="fgroup">
        <div class="flabel">Hora inicio</div>
        <input class="finp" type="time" id="hmEntrada" oninput="hmAutoHoras()">
      </div>
      <div class="fgroup">
        <div class="flabel">Hora fin</div>
        <input class="finp" type="time" id="hmSalida" oninput="hmAutoHoras()">
      </div>
      <div class="fgroup">
        <div class="flabel">N° Alumnos</div>
        <input class="finp" type="number" id="hmAlumnos" min="0" placeholder="0">
      </div>
      <div class="fgroup">
        <div class="flabel">Observaciones</div>
        <input class="finp" id="hmObsv" placeholder="Presencial">
      </div>
    </div>`;C("➕ Agregar entrada manual","",()=>{var i,r,l,d,c,u,m;const t=(i=document.getElementById("hmCurso"))==null?void 0:i.value.trim(),o=(r=document.getElementById("hmFecha"))==null?void 0:r.value,a=Number.parseFloat((l=document.getElementById("hmHoras"))==null?void 0:l.value)||0;if(!t){p("⚠️ El nombre/curso es obligatorio");return}if(!o){p("⚠️ La fecha es obligatoria");return}if(!a){p("⚠️ Las horas son obligatorias");return}const s=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][new Date(o+"T12:00:00").getDay()];P.push({id:Date.now()+Math.random(),_uid:`manual_${Date.now()}`,_tipo:"manual",_grupo:$,dia:s,fecha:o,curso:t,tema:"",entrada:((d=document.getElementById("hmEntrada"))==null?void 0:d.value)||"",salida:((c=document.getElementById("hmSalida"))==null?void 0:c.value)||"",horas:a,alumnos:Number.parseInt((u=document.getElementById("hmAlumnos"))==null?void 0:u.value)||0,obsv:((m=document.getElementById("hmObsv"))==null?void 0:m.value.trim())||"Presencial"}),Ie(),w(),pe(),p("✅ Entrada manual agregada")},e),document.getElementById("mOk").textContent="Agregar"}function Go(e,t,o,a){var v;const n=g[e];n.asistencias[t]||(n.asistencias[t]={}),n.motivos||(n.motivos={}),n.motivos[t]||(n.motivos[t]={});const s=n.asistencias[t][o],i=n.motivos[t][o]||{},r=s===a,l=!!i.texto;if(r&&!l){delete n.asistencias[t][o],delete n.motivos[t][o],R(e),O(),Ce(e);return}const d=n.alumnos.find(f=>f.id===t),c=a==="Falta"?"❌":"🔵",u=r&&l,m=`
  <div class="motivo-grid">
    <div>
      <div class="flabel">Motivo de la ${a==="Falta"?"falta":"permiso"} <span style="color:var(--muted);font-size:.72rem">(aparecerá en Google Sheets)</span></div>
      <textarea class="finp" id="motivoTxt" rows="3" placeholder="Ej: cita médica, viaje, llegó tarde..." style="resize:vertical">${i.texto||""}</textarea>
    </div>
    <div>
      <div class="flabel" style="margin-bottom:6px">Foto de evidencia <span style="color:var(--muted);font-size:.72rem">(opcional)</span></div>
      <div class="foto-preview" id="fotoPreview" onclick="document.getElementById('fotoInput').click()" style="position:relative;min-height:120px">
        ${i.foto?`<img src="${i.foto}" alt="evidencia">`:'<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><span style="font-size:1.5rem">📷</span><span style="font-size:.75rem;color:var(--muted);text-align:center">Clic para subir foto<br><strong style="color:var(--amber)">o pega con Ctrl+V</strong></span></div>'}
      </div>
      <input type="file" id="fotoInput" accept="image/*" style="display:none" onchange="previewFoto(this)">
      ${i.foto?'<button class="btn btn-red" style="font-size:.7rem;margin-top:6px;padding:3px 8px" onclick="clearFoto()">✕ Quitar foto</button>':""}
    </div>
    ${u?'<div style="font-size:.72rem;color:var(--muted);padding:4px 0">💡 Editando motivo existente — deja el campo vacío para borrarlo</div>':""}
  </div>`;C(`${c} ${u?"Editar motivo":"Registrar "+a} — ${((v=d==null?void 0:d.nombre)==null?void 0:v.split(" ").slice(0,2).join(" "))||""}`,"",()=>{var x,E;const f=((x=document.getElementById("motivoTxt"))==null?void 0:x.value.trim())||"",b=(E=document.getElementById("fotoPreview"))==null?void 0:E.querySelector("img"),h=b?b.src:i.foto||"";n.asistencias[t][o]=a,n.fechas.includes(o)||(n.fechas.push(o),n.fechas.sort()),f||h?n.motivos[t][o]={texto:f,foto:h,tipo:a}:delete n.motivos[t][o],w(),R(e),O(),Ce(e),At(e,t);let y=" registrada";f&&(y=' — "'+f.substring(0,30)+(f.length>30?"...":"")+'"'),p(`${c} ${a}${y}`)},m),document.getElementById("mOk").textContent=u?"💾 Guardar cambios":`Registrar ${a}`,setTimeout(()=>{var b;const f=document.querySelector(".modal");f&&(f.style.maxWidth="520px"),(b=document.getElementById("motivoTxt"))==null||b.focus(),globalThis._pasteFotoHandler=async h=>{var x;const y=(x=h.clipboardData)==null?void 0:x.items;if(y){for(const E of y)if(E.type.startsWith("image/")){h.preventDefault();const D=E.getAsFile(),M=new FileReader;M.onload=H=>{const q=document.getElementById("fotoPreview");if(q){q.innerHTML=`<img src="${H.target.result}" alt="evidencia">`;const se=q.parentElement;if(se&&!se.querySelector(".btn-quitar-foto")){const Q=document.createElement("button");Q.className="btn btn-red btn-quitar-foto",Q.style.cssText="font-size:.7rem;margin-top:6px;padding:3px 8px",Q.textContent="✕ Quitar foto",Q.onclick=Jo,se.appendChild(Q)}}p("📷 Imagen pegada")},M.readAsDataURL(D);break}}},document.addEventListener("paste",globalThis._pasteFotoHandler)},50)}globalThis._fotoBase64="";function Jo(){const e=document.getElementById("fotoPreview");e&&(e.innerHTML="📷 Clic para subir foto"),globalThis._fotoBase64=""}function Wo(e,t){const o=g[e],a=o.alumnos.find(f=>f.id===t);if(!a)return;const n=o.asistencias[a.id]||{},s=o.motivos||{},i=Object.values(n).filter(f=>f==="Presente").length,r=Object.values(n).filter(f=>f==="Falta").length,l=Object.values(n).filter(f=>f==="Permiso").length,d=o.fechas.length,c=d>0?Math.round((i+l)/d*100):0;let u="var(--red)";c>=80?u="var(--green)":c>=60&&(u="var(--yellow)");const m=o.fechas.length===0?'<div style="color:var(--muted);font-size:.8rem;text-align:center;padding:12px">Sin clases registradas</div>':o.fechas.slice().reverse().map(f=>{var E;const b=n[f]||"—",h=(E=s[a.id])==null?void 0:E[f];let y="var(--muted)";b==="Presente"?y="var(--green)":b==="Falta"?y="var(--red)":b==="Permiso"&&(y="var(--blue)");let x="";return h&&(x=`<div style="flex:1">
          ${h.texto?`<div style="color:var(--muted2)">${h.texto}</div>`:""}
          ${h.foto?`<img src="${h.foto}" style="max-width:80px;max-height:60px;border-radius:5px;margin-top:4px;object-fit:cover;cursor:pointer" onclick="globalThis.open('${h.foto}','_blank')">`:""}
        </div>`),`<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--border);font-size:.78rem">
        <span style="color:var(--muted);min-width:82px;font-family:'JetBrains Mono',monospace">${f}</span>
        <span style="color:${y};font-weight:600;min-width:60px">${b}</span>
        ${x}
      </div>`}).join(""),v=`
  <div class="profile-header">
    <div class="profile-avatar">${a.nombre.charAt(0).toUpperCase()}</div>
    <div>
      <div class="profile-name">${a.nombre}</div>
      <div style="font-size:.75rem;color:var(--muted);margin-top:3px">${e.replace("M-","Mañana M").replace("T-","Tarde M")}</div>
      <div style="font-size:.85rem;font-weight:700;color:${u};margin-top:4px">${c}% asistencia</div>
    </div>
  </div>
  <div class="profile-fields">
    ${a.dni?`<div class="pf-item"><div class="pf-label">DNI</div><div class="pf-val">${a.dni}</div></div>`:""}
    ${a.cel?`<div class="pf-item"><div class="pf-label">Celular</div><div class="pf-val">${a.cel}</div></div>`:""}
    ${a.correo?`<div class="pf-item" style="grid-column:1/-1"><div class="pf-label">Correo</div><div class="pf-val">${a.correo}</div></div>`:""}
    ${a.fecha?`<div class="pf-item"><div class="pf-label">Nacimiento</div><div class="pf-val">${a.fecha}</div></div>`:""}
    ${a.edad?`<div class="pf-item"><div class="pf-label">Edad</div><div class="pf-val">${a.edad} años</div></div>`:""}
  </div>
  <!-- Mini chart -->
  <div class="chart-wrap">
    <div class="chart-title">Resumen de asistencia</div>
    <div style="display:flex;gap:16px;align-items:center">
      ${[["Presentes",i,"var(--green)"],["Faltas",r,"var(--red)"],["Permisos",l,"var(--blue)"],["Total clases",d,"var(--muted)"]].map(([f,b,h])=>`<div style="text-align:center"><div style="font-size:1.4rem;font-weight:800;color:${h}">${b}</div><div style="font-size:.68rem;color:var(--muted)">${f}</div></div>`).join("")}
    </div>
  </div>
  <!-- Historial -->
  <div style="font-size:.76rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Historial de clases</div>
  <div style="max-height:220px;overflow-y:auto">${m}</div>`;C("👤 Perfil del alumno","",null,v),setTimeout(()=>{const f=document.querySelector(".modal");f&&(f.style.maxWidth="580px")},10)}function Uo(e){const t=document.getElementById(`retirados-section-${e}`);if(!t)return;const o=g[e],a=o.retirados||[];if(a.length===0){t.style.display="none";return}t.style.display="block";const n=`ret-body-${e}`;t.innerHTML=`
  <div class="retirados-section">
    <div class="retirados-toggle" onclick="document.getElementById('${n}').style.display=document.getElementById('${n}').style.display==='none'?'block':'none'">
      <span>📤 Alumnos retirados</span>
      <span class="retirados-badge">${a.length}</span>
    </div>
    <div id="${n}" style="display:none">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Alumno</th><th>% Asist.</th><th></th></tr></thead>
          <tbody>
            ${a.map(s=>{const i=o.asistencias[s.id]||{},r=Object.values(i).filter(c=>c==="Presente").length,l=o.fechas.length,d=l>0?Math.round(r/l*100):0;return`<tr>
                <td><div class="aname" style="color:var(--text2)">${s.nombre}</div></td>
                <td><span style="font-family:'JetBrains Mono',monospace;font-size:.78rem;color:var(--muted)">${d}%</span></td>
                <td><button class="btn-reactivar" onclick="reactivarAlumno('${e}',${s.id})">♻️ Reactivar</button></td>
              </tr>`}).join("")}
          </tbody>
        </table>
      </div>
    </div>
  </div>`}function qo(e,t){const o=g[e],a=o.alumnos.find(r=>r.id===t);if(!a)return;const{prefix:n,num:s,isLegacy:i}=we(e);C("📤 Retirar alumno",`¿Confirmas retirar a "${a.nombre}"? Se retirará en este módulo y en los siguientes del mismo turno.`,async()=>{const r=[e];o.alumnos=o.alumnos.filter(l=>l.id!==t),o.retirados||(o.retirados=[]),o.retirados.some(l=>Number(l.id)===Number(a.id)||ne(l.nombre)===ne(a.nombre))||o.retirados.push({...a,retirado:!0}),[2,3,4,5,6,7,8,9].forEach(l=>{if(l<=s)return;const d=i?`${n}-${l}`:`${n}_${l}`;if(!g[d])return;const c=g[d],u=c.alumnos.find(m=>m.nombre.trim().toLowerCase()===a.nombre.trim().toLowerCase());u&&(c.alumnos=c.alumnos.filter(m=>m.id!==u.id),c.retirados||(c.retirados=[]),c.retirados.some(m=>Number(m.id)===Number(u.id)||ne(m.nombre)===ne(u.nombre))||c.retirados.push({...u,retirado:!0}),r.push(d))}),O(),R(e);try{await Promise.all(r.map(l=>Ve(l)))}catch(l){w(),p("Alumno retirado localmente, pero no se pudo sincronizar Firebase: "+l.message);return}if(w(),typeof K=="function"){const l=e.replace("M-","Mañana M").replace("T-","Tarde M");K("📤",`${a.nombre} retirado`,l)}p(`📤 "${a.nombre}" retirado en módulo ${s} y siguientes`)})}async function Vo(e,t){const o=g[e];if(!o)return;const a=(o.retirados||[]).findIndex(i=>i.id===t);if(a===-1)return;const n=o.retirados[a];o.retirados.splice(a,1);const s={...n};delete s.retirado,o.alumnos.push(s),ye(o),O(),R(e);try{await gt(e,s)}catch(i){p("Alumno reactivado localmente, pero no se pudo sincronizar Firebase: "+i.message);return}if(p(`♻️ "${n.nombre}" reactivado`),typeof K=="function"){const i=e.replace("M-","Mañana M").replace("T-","Tarde M");K("♻️",`${n.nombre} reactivado`,i)}}function Xo(e,t){const o=Number(t),a=g[e];if(!a)return;const n=a.alumnos.find(r=>Number(r.id)===o);if(!n)return;const s=ue().filter(r=>r!==e).map(r=>{const l=F(r);return`<option value="${r}">${l.carrera.nombre} - ${l.seccion.label}</option>`}).join(""),i=`
      <div style="font-size:.85rem;margin-bottom:12px;line-height:1.5;color:var(--text)">Moviendo a <b style="color:var(--amber)">${n.nombre}</b>. Se transferirá el alumno y su asistencia a la sección elegida, y se eliminará de la actual.</div>
      <div class="fgroup">
        <div class="flabel">Destino</div>
        <select class="finp" id="selectDestinoMover">
          ${s}
        </select>
      </div>`;C("🔄 Mover Alumno","",()=>{const r=document.getElementById("selectDestinoMover").value;r&&(nn(e,r,t),w())},i)}function Z(e){g[e]||(g[e]={alumnos:[],retirados:[],asistencias:{},fechas:[],motivos:{},notas:{},participacion:{}});const t=g[e];return Array.isArray(t.alumnos)||(t.alumnos=[]),Array.isArray(t.retirados)||(t.retirados=[]),t.asistencias||(t.asistencias={}),Array.isArray(t.fechas)||(t.fechas=[]),t.motivos||(t.motivos={}),t.notas||(t.notas={}),t.participacion||(t.participacion={}),t}function ne(e){return String(e||"").trim().toLowerCase()}function Ze(e,t){const o=String(t);return[...e.alumnos||[],...e.retirados||[]].some(a=>String(a.id)===o)}function Ae(e){const t=[...e.alumnos||[],...e.retirados||[]].map(a=>Number(a.id)).filter(Number.isFinite);let o=t.length?Math.max(...t)+1:1;for(;Ze(e,o);)o++;return o}function ke(e,t,o,a){const n=String(o),s=String(a),i=e.asistencias&&(e.asistencias[n]||e.asistencias[o])||{},r=e.motivos&&(e.motivos[n]||e.motivos[o])||{},l=e.participacion&&(e.participacion[n]??e.participacion[o]);t.asistencias||(t.asistencias={}),t.asistencias[s]||(t.asistencias[s]={}),Object.assign(t.asistencias[s],i);const d=new Set([...t.fechas||[],...e.fechas||[],...Object.keys(i)]);t.fechas=Array.from(d).sort((c,u)=>c.localeCompare(u)),Object.keys(r).length>0&&(t.motivos||(t.motivos={}),t.motivos[s]||(t.motivos[s]={}),Object.assign(t.motivos[s],r)),t.notas||(t.notas={}),Object.entries(e.notas||{}).forEach(([c,u])=>{var v,f;if(!u||!u.notas)return;const m=((v=u.notas)==null?void 0:v[n])??((f=u.notas)==null?void 0:f[o]);m!==void 0&&(t.notas[c]||(t.notas[c]={...u,notas:{}}),t.notas[c].notas||(t.notas[c].notas={}),t.notas[c].notas[s]=m)}),l!==void 0&&(t.participacion||(t.participacion={}),t.participacion[s]=l)}function Ko(e,t){const o=String(t);e.asistencias&&(delete e.asistencias[o],delete e.asistencias[t]),e.motivos&&(delete e.motivos[o],delete e.motivos[t]),e.participacion&&(delete e.participacion[o],delete e.participacion[t]),Object.values(e.notas||{}).forEach(a=>{a!=null&&a.notas&&(delete a.notas[o],delete a.notas[t])})}function et(){localStorage.setItem("asist_empty_modules",JSON.stringify(ae))}function tt(e){ae[e]=Date.now(),et()}function Qo(e){ae[e]&&(delete ae[e],et())}function Yo(e){var t;return!!ae[e]&&(((t=g[e])==null?void 0:t.alumnos)||[]).length===0}function Zo(e,t){var i;const o=((i=g[e])==null?void 0:i.alumnos)||[],a=(t==null?void 0:t.alumnos)||[];if(o.length>0||a.length===0)return!1;const n=a.map(r=>ne(r.nombre)).filter(Boolean);if(!n.length)return!1;const s=new Set;return ue().forEach(r=>{var l;r!==e&&(((l=g[r])==null?void 0:l.alumnos)||[]).forEach(d=>{const c=ne(d.nombre);c&&s.add(c)})}),n.every(r=>s.has(r))}function ko(e){if(!e)return 0;if(typeof e.toMillis=="function")return e.toMillis();if(typeof e.seconds=="number")return e.seconds*1e3+Math.floor((e.nanoseconds||0)/1e6);const t=Date.parse(e);return Number.isFinite(t)?t:0}function en(e,t,o=!0){if(o&&(t==null?void 0:t.emptiedAt)&&(t.alumnos||[]).length===0)return!0;if(!Yo(e))return Zo(e,t)?(tt(e),!0):!1;const n=((t==null?void 0:t.alumnos)||[]).length>0,s=ko(t==null?void 0:t.updatedAt);return n&&s>(ae[e]||0)?(Qo(e),!1):!0}function tn(...e){const t={};return e.forEach(o=>{Object.entries(o||{}).forEach(([a,n])=>{if(n){if(!t[a]){t[a]={...n,notas:{...n.notas||{}}};return}t[a]={...t[a],...n,notas:{...t[a].notas||{},...n.notas||{}}}}})}),t}function on(){let e=!1;return ue().forEach(t=>{const o=Z(t),a=new Set;o.alumnos.forEach(n=>{const s=String(n.id);if(!n.id||a.has(s)){const i=n.id,r=Ae(o);ke(o,o,i,r),n.id=r,e=!0}a.add(String(n.id))})}),e}function nn(e,t,o){var c;const a=Number(o),n=Z(e),s=Z(t),i=n.alumnos.findIndex(u=>Number(u.id)===a);if(i===-1)return;const r=n.alumnos[i],l=s.alumnos.find(u=>ne(u.nombre)===ne(r.nombre));let d=r.id;l?d=l.id:(Ze(s,d)&&(d=Ae(s)),s.alumnos.push({...r,id:d})),ke(n,s,r.id,d),n.alumnos.splice(i,1),Ko(n,r.id),n.alumnos.length===0&&tt(e),n.alumnos.sort((u,m)=>u.nombre.localeCompare(m.nombre,"es",{sensitivity:"base"})),s.alumnos.sort((u,m)=>u.nombre.localeCompare(m.nombre,"es",{sensitivity:"base"})),O(),V(e),V(t),R(e),p(`✅ ${r.nombre} transferido exitosamente.`),typeof K=="function"&&K("🔄",`${r.nombre} transferido a otra sección`,((c=F(t))==null?void 0:c.seccion.label)||t)}function Je(e){const t=e.match(/_([MmTtLl])_(\d+)$/);return t?Number.parseInt(t[2]):null}function an(e,t){const o=Je(e);if(o!==3&&o!==4)return null;const a=o===3?4:3,n=e.replace(/_([MmTtLl])_(\d+)$/,`_$1_${a}`),s=Je(t);let i;if(s===null)return i=t,null;let r=a;return s===3?r=4:s===4&&(r=3),i=t.replace(/_([MmTtLl])_(\d+)$/,`_$1_${r}`),!g[n]||(g[n].alumnos||[]).length===0||!F(i)?null:{origenPar:n,destinoPar:i}}function mt(e,t){const o=Z(e),a=Z(t),n=[...o.alumnos];let s=0,i=0,r=0;return n.forEach(l=>{const d=a.alumnos.find(u=>ne(u.nombre)===ne(l.nombre));let c=l.id;d?(c=d.id,i++):(Ze(a,c)&&(c=Ae(a),r++),a.alumnos.push({...l,id:c}),s++),ke(o,a,l.id,c)}),ye(a),o.alumnos=[],o.fechas=[],o.asistencias={},o.notas&&(o.notas={}),o.motivos&&(o.motivos={}),o.participacion&&(o.participacion={}),tt(e),{movidos:s,duplicados:i,idsReasignados:r}}function sn(e,t){var c,u;const o=F(e),a=F(t);if((((c=g[e])==null?void 0:c.alumnos)||[]).length===0){p("⚠️ El módulo origen no tiene alumnos.");return}const{movidos:s,duplicados:i,idsReasignados:r}=mt(e,t);O(),V(e),V(t),T===e&&R(e),T===t&&R(t),typeof K=="function"&&K("📦",`Módulo completo movido: ${(o==null?void 0:o.seccion.label)||e} → ${(a==null?void 0:a.seccion.label)||t}`,`${s} alumno(s)`);let l=`📦 ${s} alumno(s) movido(s)`;i>0&&(l+=` · ${i} ya existía(n)`),r>0&&(l+=` · ${r} ID(s) ajustado(s)`),p(l),w();const d=an(e,t);if(d){const m=F(d.origenPar),v=F(d.destinoPar),f=(((u=g[d.origenPar])==null?void 0:u.alumnos)||[]).length;if(f>0){const b=Je(d.origenPar);setTimeout(()=>{C("📦 Mover módulo par también","",()=>{const h=mt(d.origenPar,d.destinoPar);O(),V(d.origenPar),V(d.destinoPar),T===d.origenPar&&R(d.origenPar),T===d.destinoPar&&R(d.destinoPar),typeof K=="function"&&K("📦",`Módulo par movido: ${(m==null?void 0:m.seccion.label)||d.origenPar} → ${(v==null?void 0:v.seccion.label)||d.destinoPar}`,`${h.movidos} alumno(s)`);let y=`📦 M${b}: ${h.movidos} alumno(s) movido(s)`;h.duplicados>0&&(y+=` · ${h.duplicados} ya existía(n)`),h.idsReasignados>0&&(y+=` · ${h.idsReasignados} ID(s) ajustado(s)`),p(y),w()},`<div style="font-size:.88rem;line-height:1.65;color:var(--text)">
            También se detectó el módulo par <b style="color:var(--amber)">${(m==null?void 0:m.seccion.label)||d.origenPar}</b> con <b>${f} alumno(s)</b>.
            <br><br>¿Deseas moverlos también a <b style="color:var(--amber)">${(v==null?void 0:v.seccion.label)||d.destinoPar}</b>?
          </div>`),document.getElementById("mOk").textContent="📦 Sí, mover también"},120)}}}function rn(e){var s;const t=F(e),o=(((s=g[e])==null?void 0:s.alumnos)||[]).length;if(o===0){p("⚠️ Este módulo no tiene alumnos para mover.");return}const a=ue().filter(i=>i!==e).map(i=>{const r=F(i);return`<option value="${i}">${r.carrera.nombre} — ${r.seccion.label}</option>`}).join(""),n=`
    <div style="font-size:.85rem;margin-bottom:12px;line-height:1.6;color:var(--text)">
      Moviendo <b style="color:var(--amber)">${o} alumno(s)</b> desde
      <b>${(t==null?void 0:t.seccion.label)||e}</b>.<br>
      <span style="color:var(--muted);font-size:.78rem">Se transferirán alumnos, asistencias, notas y motivos. El módulo origen quedará vacío.</span>
    </div>
    <div class="fgroup">
      <div class="flabel">Módulo destino</div>
      <select class="finp" id="selectDestinoModulo">
        ${a}
      </select>
    </div>`;C("📦 Mover Módulo Completo","",()=>{var r;const i=(r=document.getElementById("selectDestinoModulo"))==null?void 0:r.value;i&&sn(e,i)},n),document.getElementById("mOk").textContent="📦 Mover módulo completo"}function ln(e){const t=document.getElementById(`chart-${e}`);if(!t)return;const o=g[e];if(!o||o.fechas.length===0){t.innerHTML='<div style="color:var(--muted);font-size:.78rem;text-align:center;padding:16px">Sin datos aún</div>';return}const a=o.fechas.slice(-10),n=60;t.innerHTML='<div class="chart-bars">'+a.map(s=>{const i=o.alumnos.length||1,r=o.alumnos.filter(m=>(o.asistencias[m.id]||{})[s]==="Presente").length,l=Math.round(r/i*100),d=Math.max(4,Math.round(l/100*n)),c=l>=80?"var(--green)":l>=60?"var(--yellow)":"var(--red)",u=s.slice(5).replace("-","/");return`<div class="chart-bar-col">
      <button class="chart-date-remove" onclick="quitarFechaModulo('${e}','${s}')" title="Quitar fecha ${u}" aria-label="Quitar fecha ${u}">×</button>
      <div class="chart-bar-val" style="color:${c}">${l}%</div>
      <div class="chart-bar" style="height:${d}px;background:${c}"></div>
      <div class="chart-bar-label">${u}</div>
    </div>`}).join("")+"</div>"}function cn(e,t){const o=g[e];if(!o||!t)return;const[a,n,s]=t.split("-"),i=s&&n&&a?`${s}/${n}/${a}`:t;C("Quitar fecha",`¿Deseas quitar la fecha ${i}? Se eliminarán las asistencias registradas ese día en este módulo.`,async()=>{o.fechas=(o.fechas||[]).filter(r=>r!==t),Object.values(o.asistencias||{}).forEach(r=>{r&&delete r[t]}),Object.values(o.motivos||{}).forEach(r=>{r&&delete r[t]}),O(),R(e);try{await Ve(e)}catch(r){p("Fecha quitada localmente, pero no se pudo sincronizar Firebase: "+r.message);return}w(),p(`Fecha ${i} quitada`)})}function At(e,t){var i;const o=g[e],a=o.alumnos.find(r=>r.id===t);if(!a)return;const n=Number.parseInt(((i=document.getElementById(`thr-${e}`))==null?void 0:i.value)||"3"),s=Object.values(o.asistencias[t]||{}).filter(r=>r==="Falta").length;s===n&&a.correo&&p(`⚠️ ${a.nombre} alcanzó ${s} faltas`)}function dn(e,t){var n;const o=g[e],a=((n=document.getElementById(`date-${e}`))==null?void 0:n.value)||U;o.alumnos.forEach(s=>{o.asistencias[s.id]||(o.asistencias[s.id]={}),o.asistencias[s.id][a]=t,Ce(e,s.id)}),o.fechas.includes(a)||(o.fechas.push(a),o.fechas.sort()),O(),Ce(e),R(e),p("✅ Todos marcados como Presente")}function un(e,t){const o=g[e].alumnos.find(l=>l.id===t),{prefix:a,num:n,isLegacy:s}=we(e),i=n===1,r=i?`¿Seguro que deseas eliminar a "${o==null?void 0:o.nombre}"? Se eliminará también de los demás módulos del mismo turno.`:`¿Seguro que deseas eliminar a "${o==null?void 0:o.nombre}" de este módulo?`;C("Eliminar alumno",r,()=>{const l=g[e];l.alumnos=l.alumnos.filter(d=>d.id!==t),delete l.asistencias[t],i&&o&&[2,3,4,5,6,7,8,9].forEach(d=>{const c=s?`${a}-${d}`:`${a}_${d}`;g[c]&&(g[c].alumnos=g[c].alumnos.filter(u=>u.nombre.trim().toLowerCase()!==o.nombre.trim().toLowerCase()))}),w(),O(),R(e),p(i?"✅ Alumno eliminado de todos los módulos":"✅ Alumno eliminado"),V(),o!=null&&o.fila&&Ve(e,o.fila,o.nombre)})}function mn(e){var d;const{prefix:t,num:o,isLegacy:a}=we(e),n=g[e];if(!((d=n==null?void 0:n.alumnos)!=null&&d.length)){p("⚠️ Este módulo no tiene alumnos");return}const s=de($),i=[2,3,4,5,6,7,8,9].filter(c=>c>o).filter(c=>{const u=a?`${t}-${c}`:`${t}_${c}`;return s.includes(u)});let r=0;const l=[];i.forEach(c=>{const u=a?`${t}-${c}`:`${t}_${c}`,m=g[u];if(!m)return;let v=0;n.alumnos.forEach(f=>{m.alumnos.some(h=>h.nombre.trim().toLowerCase()===f.nombre.trim().toLowerCase())||(m.alumnos.push({...f}),m.asistencias[f.id]||(m.asistencias[f.id]={}),v++)}),v>0?(ye(m),V(u),l.push(`M${c}: ${v} alumno(s)`),r+=v):l.push(`M${c}: ya sincronizado`)}),O(),r>0?p(`✅ ${l.join(" · ")}`):p("✓ Todos los módulos siguientes ya estaban sincronizados")}function pn(e){const t=F(e),o=t?`${t.seccion.label} — ${t.carrera.nombre}`:e;C(`➕ Agregar alumno — ${o}`,"",()=>{var m,v,f,b,h,y;const a=(m=document.getElementById("addNombreInp"))==null?void 0:m.value.trim();if(!a){p("⚠️ Escribe el nombre");return}const n=g[e],s=Date.now();n.alumnos.push({id:s,nombre:a,dni:((v=document.getElementById("addDniInp"))==null?void 0:v.value.trim())||"",fecha:((f=document.getElementById("addFechaInp"))==null?void 0:f.value)||"",edad:((b=document.getElementById("addEdadInp"))==null?void 0:b.value.trim())||"",correo:((h=document.getElementById("addCorreoInp"))==null?void 0:h.value.trim())||"",cel:((y=document.getElementById("addCelInp"))==null?void 0:y.value.trim())||""}),n.asistencias[s]={},ye(n);const i=n.alumnos.find(x=>x.id===s),{prefix:r,num:l,isLegacy:d}=we(e),c=[];[2,3,4,5,6,7,8,9].filter(x=>x>l).forEach(x=>{const E=d?`${r}-${x}`:`${r}_${x}`,D=g[E];if(!D)return;D.alumnos.some(H=>H.nombre.trim().toLowerCase()===a.toLowerCase())||(D.alumnos.push({...i}),D.asistencias[s]={},ye(D),c.push("M"+x),V(E))}),w(),R(e);const u=c.length?` · copiado a ${c.join(", ")}`:"";p(`✅ "${a}" agregado${u}`),gt(e)},`<div class="form-grid" style="margin-top:4px">
      <div class="fgroup" style="grid-column:1/-1"><div class="flabel">Apellidos y Nombres *</div><input class="finp" id="addNombreInp" placeholder="Ej: García López Ana" autofocus></div>
      <div class="fgroup"><div class="flabel">DNI</div><input class="finp" id="addDniInp" placeholder="12345678" maxlength="8"></div>
      <div class="fgroup"><div class="flabel">Fecha de nacimiento</div><input class="finp" type="date" id="addFechaInp"></div>
      <div class="fgroup"><div class="flabel">Edad</div><input class="finp" id="addEdadInp" placeholder="25" type="number" min="1" max="99"></div>
      <div class="fgroup"><div class="flabel">Correo</div><input class="finp" id="addCorreoInp" placeholder="correo@gmail.com" type="email"></div>
      <div class="fgroup"><div class="flabel">Celular</div><input class="finp" id="addCelInp" placeholder="999 999 999"></div>
    </div>`),setTimeout(()=>{var a;return(a=document.getElementById("addNombreInp"))==null?void 0:a.focus()},100)}function fn(e,t){const o=Number(t),a=g[e],n=a.alumnos.find(i=>i.id===o);if(!n)return;const s=`
    <div class="form-grid" style="margin-top:4px">
      <div class="fgroup" style="grid-column:1/-1">
        <div class="flabel">Apellidos y Nombres *</div>
        <input class="finp" id="edNombreInp" value="${n.nombre.replaceAll('"',"&quot;")}" placeholder="Ej: García López Ana">
      </div>
      <div class="fgroup">
        <div class="flabel">DNI</div>
        <input class="finp" id="edDniInp" value="${n.dni||""}" placeholder="12345678" maxlength="8">
      </div>
      <div class="fgroup">
        <div class="flabel">Edad</div>
        <input class="finp" id="edEdadInp" type="number" value="${n.edad||""}" placeholder="25" min="1" max="99">
      </div>
      <div class="fgroup">
        <div class="flabel">Fecha de nacimiento</div>
        <input class="finp" type="date" id="edFechaInp" value="${n.fecha||""}">
      </div>
      <div class="fgroup">
        <div class="flabel">Celular</div>
        <input class="finp" id="edCelInp" value="${n.cel||""}" placeholder="999 999 999">
      </div>
      <div class="fgroup" style="grid-column:1/-1">
        <div class="flabel">Correo electrónico</div>
        <input class="finp" type="email" id="edCorreoInp" value="${n.correo||""}" placeholder="correo@gmail.com">
      </div>
    </div>`;C(`✏️ Editar datos — ${n.nombre.split(" ").slice(0,2).join(" ")}`,"",()=>{var r,l,d,c,u,m;const i=(r=document.getElementById("edNombreInp"))==null?void 0:r.value.trim();if(!i){p("⚠️ El nombre es obligatorio");return}n.nombre=i,n.dni=((l=document.getElementById("edDniInp"))==null?void 0:l.value.trim())||"",n.edad=((d=document.getElementById("edEdadInp"))==null?void 0:d.value.trim())||"",n.fecha=((c=document.getElementById("edFechaInp"))==null?void 0:c.value)||"",n.cel=((u=document.getElementById("edCelInp"))==null?void 0:u.value.trim())||"",n.correo=((m=document.getElementById("edCorreoInp"))==null?void 0:m.value.trim())||"",ye(a),w(),R(e),O(),V(e),p(`✅ Datos de "${i}" actualizados`)},s),document.getElementById("mOk").textContent="💾 Guardar cambios",setTimeout(()=>{var i;return(i=document.getElementById("edNombreInp"))==null?void 0:i.focus()},100)}function ye(e){e.alumnos.sort((t,o)=>t.nombre.localeCompare(o.nombre,"es",{sensitivity:"base"}))}function gn(){const e=document.getElementById("pNombre").value.trim(),t=document.getElementById("pTel").value.trim();if(!e){p("⚠️ El nombre es obligatorio");return}if(!t){p("⚠️ El celular es obligatorio");return}const o={id:Date.now(),nombre:e,tel:t,clases:[]};B.push(o),B.sort((a,n)=>a.nombre.localeCompare(n.nombre,"es",{sensitivity:"base"})),["pNombre","pTel"].forEach(a=>{const n=document.getElementById(a);n&&(n.value="")}),fe(),p(`✅ "${e}" agregado`),xe()}function Tt(e,t,o,a,n,s){const i=B.find(l=>l.id===e);if(!i)return;const r=i.clases.findIndex(l=>l.fecha===t);r>=0&&i.clases[r].val===o&&!a?i.clases.splice(r,1):r>=0?i.clases[r]={fecha:t,val:o,horas:a||i.clases[r].horas||"",horaInicio:n||i.clases[r].horaInicio||"",horaFin:s||i.clases[r].horaFin||""}:i.clases.push({fecha:t,val:o,horas:a||"",horaInicio:n||"",horaFin:s||""}),i.clases.sort((l,d)=>l.fecha.localeCompare(d.fecha)),fe(),xe()}function vn(e){const t=B.find(a=>a.id===e);if(!t)return;const o=`
    <div style="display:flex;flex-direction:column;gap:12px;padding-top:4px">
      <div class="fgroup">
        <div class="flabel">Fecha de la clase</div>
        <input class="finp" type="date" id="rcFecha" value="${U}">
      </div>
      <div class="fgroup">
        <div class="flabel">Asistencia</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-green rc-val-btn" id="rcBtnP" onclick="selectRcVal('Presente')" style="flex:1">✅ Presente</button>
          <button class="btn btn-red rc-val-btn"   id="rcBtnF" onclick="selectRcVal('Falta')"    style="flex:1">❌ Falta</button>
          <button class="btn btn-outline rc-val-btn" id="rcBtnPm" onclick="selectRcVal('Permiso')" style="flex:1;border-color:var(--blue);color:var(--blue)">🔵 Permiso</button>
        </div>
        <input type="hidden" id="rcVal" value="Presente">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div class="fgroup">
          <div class="flabel">Hora inicio</div>
          <input class="finp" type="time" id="rcHoraInicio" style="width:100%" oninput="rcAutoHoras()">
        </div>
        <div class="fgroup">
          <div class="flabel">Hora fin</div>
          <input class="finp" type="time" id="rcHoraFin" style="width:100%" oninput="rcAutoHoras()">
        </div>
        <div class="fgroup">
          <div class="flabel">Horas dictadas</div>
          <input class="finp" type="number" id="rcHoras" min="0.5" max="12" step="0.5" placeholder="Auto" style="width:100%">
        </div>
      </div>
    </div>`;C(`📋 Registrar clase — ${t.nombre}`,"",()=>{const a=document.getElementById("rcFecha").value,n=document.getElementById("rcVal").value,s=document.getElementById("rcHoras").value.trim(),i=document.getElementById("rcHoraInicio").value,r=document.getElementById("rcHoraFin").value;if(!a){p("⚠️ Selecciona una fecha");return}Tt(e,a,n,s,i,r),w(),p("✅ Clase registrada")},o),document.getElementById("mOk").textContent="Guardar clase",setTimeout(()=>Bt("Presente"),60)}function Bt(e){document.getElementById("rcVal").value=e,["rcBtnP","rcBtnF","rcBtnPm"].forEach(t=>{const o=document.getElementById(t);if(!o)return;const a="rcBtn"+e[0]+(e==="Permiso"?"m":"");o.style.opacity=t===a?"1":"0.4",o.style.transform=t===a?"scale(1.04)":"scale(1)"})}function hn(){var r,l;const e=(r=document.getElementById("rcHoraInicio"))==null?void 0:r.value,t=(l=document.getElementById("rcHoraFin"))==null?void 0:l.value;if(!e||!t)return;const[o,a]=e.split(":").map(Number),[n,s]=t.split(":").map(Number),i=n*60+s-(o*60+a);i>0&&(document.getElementById("rcHoras").value=Math.round(i/60*10)/10)}function bn(e,t){const o=B.find(a=>a.id===e);o&&C("Quitar clase","¿Eliminar el registro de esta clase?",()=>{o.clases=o.clases.filter(a=>a.fecha!==t),w(),fe(),xe()})}function yn(e){C("Eliminar alumno","¿Seguro que deseas eliminar este alumno personalizado?",()=>{B=B.filter(t=>t.id!==e),w(),fe(),p("Alumno eliminado"),xe()})}function fe(){var a;const e=(((a=document.getElementById("persSearch"))==null?void 0:a.value)||"").toLowerCase(),t=B.filter(n=>{var s,i;return n.nombre.toLowerCase().includes(e)||((s=n.dni)==null?void 0:s.includes(e))||((i=n.correo)==null?void 0:i.toLowerCase().includes(e))}),o=document.getElementById("persList");if(t.length===0){o.innerHTML=`<div class="empty"><div class="ei">👤</div>${B.length===0?"Sin alumnos personalizados. Agrégalos con el formulario de arriba.":"Sin resultados."}</div>`;return}o.innerHTML=t.map((n,s)=>{const i=n.clases.length,r=n.clases.filter(u=>u.val==="Presente").length,l=n.clases.reduce((u,m)=>u+(Number.parseFloat(m.horas)||0),0),d=i>0?Math.round(r/i*100):0;let c="var(--red)";return d>=80?c="var(--green)":d>=60&&(c="var(--yellow)"),`
    <div class="pers-card">
      <div class="pers-card-top">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span style="font-size:.68rem;font-family:'JetBrains Mono',monospace;color:var(--muted);background:var(--s2);border:1px solid var(--border);border-radius:5px;padding:2px 7px">${String(s+1).padStart(2,"0")}</span>
            <div class="pers-name">${n.nombre}</div>
            ${d>0?`<span style="font-size:.72rem;font-weight:700;color:${c}">${d}%</span>`:""}
          </div>
          <div class="pers-meta" style="margin-top:6px">
            ${n.tel?`<div class="pmeta">📞 ${n.tel}</div>`:""}
            ${i>0?`<div class="pmeta" style="color:${c}">📊 ${r}/${i} clases · ${l}h dictadas</div>`:""}
          </div>
        </div>
        <div class="pers-actions">
          <button class="btn btn-outline" style="font-size:.72rem;padding:4px 10px" onclick="editarPersonalizado(${n.id})">✏️ Editar</button>
          <button class="btn btn-red" onclick="eliminarPersonalizado(${n.id})">✕</button>
        </div>
      </div>
      <div class="pers-clases">
        <div class="pers-clases-list">
          ${n.clases.length===0?'<span style="font-size:.78rem;color:var(--muted)">Sin clases registradas aún</span>':""}
          ${n.clases.map(u=>{let m="var(--blue)";u.val==="Presente"?m="var(--green)":u.val==="Falta"&&(m="var(--red)");const v=u.horaInicio&&u.horaFin?` ${u.horaInicio}–${u.horaFin}`:"",f=u.horas?` · ${u.horas}h`:"";return`<div class="clase-chip" style="cursor:pointer" title="Clic para eliminar" onclick="quitarClasePersonalizada(${n.id},'${u.fecha}')">
              <span class="cc-date">${u.fecha}</span>
              <span class="cc-val" style="color:${m}">${u.val}</span>
              ${v||f?`<span style="font-size:.68rem;color:var(--muted)">${v}${f}</span>`:""}
            </div>`}).join("")}
        </div>
        <div class="clase-add">
          <button class="btn btn-amber" style="font-size:.75rem;padding:5px 14px" onclick="showRegistrarClaseModal(${n.id})">➕ Registrar clase</button>
        </div>
      </div>
    </div>`}).join("")}function xn(e){const t=B.find(a=>a.id===e);if(!t)return;const o=`
    <div class="form-grid" style="grid-template-columns:1fr 1fr;margin-top:4px;gap:12px">
      <div class="fgroup" style="grid-column:1/-1">
        <div class="flabel">Apellidos y Nombres *</div>
        <input class="finp" id="epNombre" value="${t.nombre}">
      </div>
      <div class="fgroup">
        <div class="flabel">Celular *</div>
        <input class="finp" id="epTel" type="tel" value="${t.tel||""}">
      </div>
    </div>`;C("✏️ Editar alumno","",()=>{var s,i;const a=(s=document.getElementById("epNombre"))==null?void 0:s.value.trim(),n=(i=document.getElementById("epTel"))==null?void 0:i.value.trim();if(!a){p("⚠️ El nombre es obligatorio");return}t.nombre=a,t.tel=n||"",B.sort((r,l)=>r.nombre.localeCompare(l.nombre,"es",{sensitivity:"base"})),w(),fe(),p("✅ Datos actualizados"),xe()},o),document.getElementById("mOk").textContent="Guardar cambios"}function Te(e){const t=Z(e);return t.notas||(t.notas={}),t.notas}function Be(e){const t=document.getElementById(`notas-section-${e}`);if(!t)return;const o=Z(e),a=Te(e),n=Object.entries(a);if(!n.length){t.innerHTML='<div style="color:var(--muted);font-size:.8rem;padding:10px 0">Sin temas de evaluación. Crea uno con "＋ Nuevo tema".</div>';return}t.innerHTML=n.map(([s,i])=>{const r=Object.values(i.notas||{}).filter(c=>c!==""&&c!==null&&c!==void 0),l=r.length?Math.round(r.reduce((c,u)=>c+u,0)/r.length):null,d=r.filter(c=>c>=i.min).length;return`
    <div class="notas-tema">
      <div class="notas-tema-header" onclick="toggleNotasTema('${s}')">
        <div class="notas-tema-title">${i.nombre}</div>
        <div class="notas-tema-stats">
          <span>Mín: ${i.min}</span>
          ${l!==null?`<span>Prom: ${l}</span>`:""}
          <span>${d}/${o.alumnos.length} aprob.</span>
        </div>
        <span class="notas-tema-badge">▾</span>
        <button onclick="event.stopPropagation();eliminarTema('${e}','${s}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.8rem;padding:0 4px" title="Eliminar tema">✕</button>
      </div>
      <div class="notas-table-wrap" id="notasBody-${s}">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:var(--s2)">
            <th style="padding:8px 14px;text-align:left;font-size:.68rem;color:var(--muted);font-weight:700;text-transform:uppercase">Alumno</th>
            <th style="padding:8px 14px;text-align:center;font-size:.68rem;color:var(--muted);font-weight:700;text-transform:uppercase;width:110px">Nota (0-20)</th>
            <th style="padding:8px 14px;text-align:center;font-size:.68rem;color:var(--muted);font-weight:700;text-transform:uppercase;width:80px">Estado</th>
          </tr></thead>
          <tbody>
            ${o.alumnos.map(c=>{var f;const u=(f=i.notas)==null?void 0:f[c.id],m=u!==""&&u!==null&&u!==void 0,v=m&&u>=i.min;return`<tr>
                <td style="padding:8px 14px;font-size:.83rem">${c.nombre}</td>
                <td style="padding:6px 14px;text-align:center">
                  <input type="number" class="nota-inp" min="0" max="20" step="0.5"
                    value="${m?u:""}" placeholder="—"
                    onchange="setNota('${e}','${s}',${c.id},this.value)"
                    title="${c.nombre}">
                </td>
                <td style="padding:6px 14px;text-align:center">
                  ${m?`<span class="nota-badge ${v?"ap":"des"}">${v?"Aprobado":"Reprobado"}</span>`:'<span class="nota-badge vacio">Sin nota</span>'}
                </td>
              </tr>`}).join("")}
          </tbody>
        </table>
      </div>
    </div>`}).join("")}function $n(e){const t=document.getElementById(`notasBody-${e}`);t&&(t.style.display=t.style.display==="none"?"":"none")}function En(e){C("＋ Nuevo tema de evaluación","",()=>{var i,r;const o=(i=document.getElementById("ntNombre"))==null?void 0:i.value.trim();if(!o){p("⚠️ Escribe el nombre del tema");return}const a=Number.parseFloat((r=document.getElementById("ntMin"))==null?void 0:r.value)||11,n="tema_"+Date.now(),s=Te(e);s[n]={nombre:o,min:a,fecha:"",notas:{}},g[e].alumnos.forEach(l=>{s[n].notas[l.id]=""}),w(),Be(e),V(e),p(`✅ Tema "${o}" creado`)},`
    <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-top:4px">
      <div class="fgroup" style="grid-column:1/-1">
        <div class="flabel">Nombre del tema *</div>
        <input class="finp" id="ntNombre" placeholder="Ej: Examen parcial, Práctica 1..." autofocus>
      </div>
      <div class="fgroup">
        <div class="flabel">Nota mínima aprobatoria</div>
        <input class="finp" type="number" id="ntMin" value="11" min="0" max="20" style="width:80px">
      </div>
    </div>`),document.getElementById("mOk").textContent="Crear tema"}function In(e,t,o,a){const n=Te(e);n[t]&&(n[t].notas[o]=a===""||a===null?"":Number.parseFloat(a),Be(e),Wt(e))}function wn(e,t){C("Eliminar tema","¿Eliminar este tema y todas sus notas?",()=>{const o=Te(e);delete o[t],w(),Be(e),Ut(e),p("Tema eliminado")})}function ot(e){const t=Z(e);return t.participacion||(t.participacion={}),t.participacion}function nt(e){const t=document.getElementById(`part-section-${e}`);if(!t)return;const o=Z(e),a=ot(e),n=o.alumnos;if(!n.length){t.innerHTML="";return}t.innerHTML=`
          <div class="part-table-wrap">
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:var(--s2)">
        <th style="padding:8px 14px;text-align:left;font-size:.68rem;color:var(--muted);font-weight:700;text-transform:uppercase">Alumno</th>
        <th style="padding:8px 14px;text-align:center;font-size:.68rem;color:var(--muted);font-weight:700;text-transform:uppercase;width:120px">Participación (0–20)</th>
        <th style="padding:8px 14px;text-align:center;font-size:.68rem;color:var(--muted);font-weight:700;text-transform:uppercase;width:80px">Nota</th>
      </tr></thead>
      <tbody>
        ${n.map(s=>{const i=a[s.id],r=i!==""&&i!==null&&i!==void 0;let l="var(--muted)";return r&&(i>=11?l="var(--green)":i>=6?l="var(--yellow)":l="var(--red)"),`<tr>
            <td style="padding:8px 14px;font-size:.83rem">${s.nombre}</td>
            <td style="padding:6px 14px;text-align:center">
              <input type="number" class="part-inp" min="0" max="20" step="0.5"
                value="${r?i:""}" placeholder="—"
                onchange="setParticipacion('${e}',${s.id},this.value)"
                title="${s.nombre}">
            </td>
            <td style="padding:6px 14px;text-align:center">
              ${r?`<span style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:.83rem;color:${l}">${i}</span>`:'<span style="color:var(--muted);font-size:.78rem">—</span>'}
            </td>
          </tr>`}).join("")}
      </tbody>
    </table>
  </div>`}function Sn(e,t,o){const a=ot(e);a[t]=o===""||o===null?"":Number.parseFloat(o),nt(e),V(e)}function _n(e){const t=Te(e),o=Object.entries(t);if(!o.length){p("⚠️ Primero crea un tema de evaluación en Notas");return}const a=ot(e),s=g[e].alumnos.filter(r=>a[r.id]!==""&&a[r.id]!==null&&a[r.id]!==void 0);if(!s.length){p("⚠️ Primero ingresa puntos de participación");return}const i=`
    <div style="display:flex;flex-direction:column;gap:14px;padding-top:4px">
      <div style="background:var(--s2);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:.79rem;color:var(--muted)">
        Sumar la nota de participación de cada alumno a la nota del tema elegido.<br>
        <strong style="color:var(--rose)">Ejemplo:</strong> Nota tema 15 + Participación 3 = <strong style="color:var(--text)">18</strong>
      </div>
      <div class="fgroup">
        <div class="flabel">Tema al que se suma *</div>
        <select class="finp" id="sumaTemaId">
          ${o.map(([r,l])=>`<option value="${r}">${l.nombre}</option>`).join("")}
        </select>
      </div>
      <div style="font-size:.78rem;color:var(--muted)">
        Se sumarán los puntos de <strong style="color:var(--text)">${s.length}</strong> alumno(s) con participación registrada.
        El resultado se limita a 20.
      </div>
    </div>`;C("➕ Sumar participación a nota","",()=>{var d;const r=(d=document.getElementById("sumaTemaId"))==null?void 0:d.value;if(!r||!t[r]){p("⚠️ Selecciona un tema");return}let l=0;s.forEach(c=>{var f;const u=Number.parseFloat(a[c.id])||0,m=Number.parseFloat((f=t[r].notas)==null?void 0:f[c.id])||0,v=Math.min(20,Math.round((m+u)*10)/10);t[r].notas[c.id]=v,l++}),w(),Be(e),V(e),p(`✅ Participación sumada a ${l} alumno(s) en "${t[r].nombre}"`)},i),document.getElementById("mOk").textContent="Sumar participación"}function Nt(e,t,o,a){const{prefix:n,num:s}=we(o),i=`${n.includes("M")?"Mañana":n.includes("T")?"Tarde":n} Módulo ${s}`,r=a.split("-").reverse().join("/"),l=`Hola ${e.split(" ")[0]}, se le recuerda que el día ${r} registró una falta en ${i}. Por favor comuníquese con su docente.`;at("whatsapp",e,t,"",l,o,a)}function Mn(e,t,o,a){const{prefix:n,num:s}=we(o),i=`${n.includes("M")?"Mañana":n.includes("T")?"Tarde":n} Módulo ${s}`,r=a.split("-").reverse().join("/"),l=`Estimado/a ${e},

Le comunicamos que el día ${r} registró una falta en ${i}.

Por favor comuníquese con su docente para regularizar su asistencia.

Atentamente,
Instituto Redes & TICs`;at("correo",e,"",t,l,o,a)}function at(e,t,o,a,n,s,i){const r=e==="whatsapp";let l="";r||(l=`<div class="fgroup"><div class="flabel">Asunto</div>
        <input class="finp" id="msgAsunto" value="Inasistencia ${s.replace("M-","Mañana M").replace("T-","Tarde M")} — ${i.split("-").reverse().join("/")}">
      </div>`);const d=`
    <div style="display:flex;flex-direction:column;gap:12px;padding-top:4px">
      <div style="background:var(--s2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:.79rem">
        <div style="color:var(--muted);font-size:.72rem;margin-bottom:2px">Destinatario</div>
        <div style="font-weight:600;color:var(--text)">${t}</div>
        <div style="font-size:.72rem;color:var(--muted);margin-top:2px">${r?"📱 "+o:"✉️ "+a}</div>
      </div>
      <div class="fgroup">
        <div class="flabel">Mensaje${r?"":" (cuerpo)"}</div>
        <textarea class="finp" id="msgTexto" rows="6" style="resize:vertical;width:100%;font-size:.79rem;line-height:1.6">${n}</textarea>
      </div>
      ${l}
    </div>`;C(r?"📱 Enviar WhatsApp":"✉️ Enviar Correo","",()=>{var u,m;const c=(u=document.getElementById("msgTexto"))==null?void 0:u.value.trim();if(!c){p("⚠️ Escribe un mensaje");return}if(r){let v=o.replace(/[^0-9]/g,"");v.length===9&&(v="51"+v);const f="https://wa.me/"+v+"?text="+encodeURIComponent(c);window.open(f,"_blank")}else{const v=((m=document.getElementById("msgAsunto"))==null?void 0:m.value.trim())||"Inasistencia",f="mailto:"+a+"?subject="+encodeURIComponent(v)+"&body="+encodeURIComponent(c);window.open(f,"_blank")}w(),p(r?"📱 WhatsApp abierto":"✉️ Correo abierto")},d),document.getElementById("mOk").textContent=r?"📱 Abrir WhatsApp":"✉️ Abrir correo"}function Oe(){let e=0,t=0,o=0,a=0;const n=de($),s=3;n.forEach(l=>{g[l]||(g[l]={alumnos:[],retirados:[],asistencias:{},fechas:[],motivos:{},notas:{}});const d=g[l];d.alumnos||(d.alumnos=[]),d.asistencias||(d.asistencias={}),e+=d.alumnos.length,d.alumnos.forEach(c=>{const u=d.asistencias[c.id]||{};u[U]==="Presente"&&t++,u[U]==="Falta"&&o++,Object.values(u).filter(m=>m==="Falta").length>=s&&a++})}),document.getElementById("d-total").textContent=e,document.getElementById("d-pres").textContent=t,document.getElementById("d-falt").textContent=o,document.getElementById("d-alert").textContent=a,document.getElementById("d-pers").textContent=B.length;const i=document.getElementById("dashCards"),r=_.find(l=>l.id===$);if(!r){i.innerHTML="";return}i.innerHTML=r.secciones.map(l=>{const d=g[l.id];if(!d)return"";const c=d.alumnos.length;if(c===0)return`<div class="dash-card"><h4>${l.label}</h4><div class="dash-row"><span class="dr-name" style="color:var(--muted)">Sin datos</span><span></span></div></div>`;const u=d.alumnos.flatMap(h=>Object.values(d.asistencias[h.id]||{})),m=u.filter(h=>h==="Presente").length,v=u.length,f=v>0?Math.round(m/v*100):0;let b="var(--red)";return f>=80?b="var(--green)":f>=60&&(b="var(--yellow)"),`<div class="dash-card">
      <h4>${l.label}</h4>
      <div class="dash-row">
        <span class="dr-name" style="cursor:pointer;text-decoration:underline;text-decoration-color:var(--border2)" onclick="goPage('${l.id}')">${c} alumnos</span>
        <span class="dr-pct" style="color:${b}">${f}%</span>
      </div>
    </div>`}).join(""),Cn(),An(),Nn()}function Cn(){const e=de($),t=document.getElementById("mainDashChart");if(!t)return;let o=new Set;e.forEach(d=>{var c;(((c=g[d])==null?void 0:c.fechas)||[]).forEach(u=>o.add(u))});const a=[...o].sort().slice(-7);if(a.length===0)return;const n=[],s=[];a.forEach(d=>{const[c,u,m]=d.split("-");n.push(`${m}/${u}`);let v=0,f=0;e.forEach(h=>{const y=g[h];y&&y.alumnos.forEach(x=>{const E=(y.asistencias[x.id]||{})[d];E&&(v++,(E==="Presente"||E==="Permiso"||E==="Justificado")&&f++)})});const b=v>0?Math.round(f/v*100):0;s.push(b)}),window._mainDashChartInstance&&window._mainDashChartInstance.destroy();const i=getComputedStyle(document.documentElement).getPropertyValue("--amber").trim()||"#f59e0b",r=getComputedStyle(document.documentElement).getPropertyValue("--border2").trim()||"#242d45",l=getComputedStyle(document.documentElement).getPropertyValue("--muted").trim()||"#94a3b8";window._mainDashChartInstance=new Chart(t,{type:"line",data:{labels:n,datasets:[{label:"% Asistencia General",data:s,borderColor:i,backgroundColor:i+"22",fill:!0,tension:.4}]},options:{responsive:!0,maintainAspectRatio:!1,scales:{y:{min:0,max:100,grid:{color:r},ticks:{color:l}},x:{grid:{color:r},ticks:{color:l}}},plugins:{legend:{display:!1}}}})}function An(){const e=document.getElementById("dashboardAlertList");if(!e)return;const t=de($),o=[],a=_.find(n=>n.id===$);if(t.forEach(n=>{const s=g[n];if(!s)return;const i=((a==null?void 0:a.secciones)||[]).find(l=>l.id===n),r=i?i.label:n;s.alumnos.forEach(l=>{const d=Object.values(s.asistencias[l.id]||{}).filter(c=>c==="Falta").length;d>=3&&o.push({key:n,id:l.id,nombre:l.nombre,curso:r,faltas:d})})}),o.length===0){e.innerHTML='<div style="text-align:center;padding:10px;color:var(--muted);font-size:.8rem">✅ Ningún alumno con exceso de faltas</div>';return}e.innerHTML=o.sort((n,s)=>s.faltas-n.faltas).map(n=>`
        <div class="alert-item" style="cursor:pointer;" onclick="abrirFichaAlumno('${n.key}', ${n.id})" title="Ver ficha del alumno">
          <div>
            <div class="ai-name" style="text-decoration:underline dashed; text-underline-offset:3px">${n.nombre}</div>
            <div class="ai-course">${n.curso}</div>
          </div>
          <div class="ai-badge">${n.faltas} faltas</div>
        </div>
      `).join("")}function Tn(e,t){const o=g[e];if(!o)return;const a=o.alumnos.find(m=>m.id===t);if(!a)return;const n=_.find(m=>m.id===$),s=((n==null?void 0:n.secciones)||[]).find(m=>m.id===e),i=s?s.label:e;document.getElementById("fichaNombre").textContent=a.nombre,document.getElementById("fichaCarrera").textContent=i;const r=a.cel||"999 999 999 (Simulado)";document.getElementById("fichaTelefono").textContent=r,document.getElementById("btnContactarTwilio").onclick=()=>{Nt(a.nombre,r,e,U)};const l=document.getElementById("fichaInasistenciasList"),d=o.asistencias[t]||{},c=Object.keys(d).filter(m=>d[m]==="Falta").sort().reverse();c.length===0?l.innerHTML='<div style="padding:10px; color:var(--muted); font-size:0.8rem; text-align:center;">No registra inasistencias</div>':l.innerHTML=c.slice(0,5).map(m=>`<div style="padding:8px 12px; border-bottom:1px solid var(--border); font-size:0.8rem; display:flex; justify-content:space-between;">
            <span style="color:var(--text2); font-family:'JetBrains Mono',monospace;">${m}</span>
            <span style="color:var(--red); font-weight:600;">Falta</span>
          </div>`).join("");const u=document.getElementById("overlayFichaAlumno");u&&(u.style.display="flex")}function Bn(){const e=document.getElementById("overlayFichaAlumno");e&&(e.style.display="none")}function Nn(){const e=document.getElementById("dashboardActividadList")||document.querySelector(".dashboard-bottom tbody");if(!e)return;if(!oe||oe.length===0){e.innerHTML='<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px;">Sin actividad reciente.</td></tr>';return}const t=oe.slice(0,5);e.innerHTML=t.map(o=>{let n=new Date(o.ts||new Date).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:!0}),s=o.msg,i="";if(o.msg.includes(" — ")){const l=o.msg.split(" — ");s=l[0],i=l[1]}else i=o.msg,s="Sistema";let r="var(--text)";return i.includes("Presente")?r="var(--green)":i.includes("Falta")?r="var(--red)":i.includes("Permiso")||i.includes("Justificado")?r="var(--blue)":i.includes("retirado")||i.includes("eliminado")?r="var(--red)":i.includes("reactivado")?r="var(--green)":(i.includes("actualizada")||i.includes("hora"))&&(r="var(--amber)"),`
          <tr>
            <td style="font-family:'JetBrains Mono',monospace;color:var(--muted);font-size:.75rem">${n}</td>
            <td class="aname">${s}</td>
            <td><span style="color:${r};font-weight:600;font-size:.75rem">${o.icon} ${i}</span></td>
            <td>${o.ctx||"General"}</td>
          </tr>
        `}).join("")}let He=JSON.parse(localStorage.getItem("modulos_meta")||"{}");const Ne={informe_01:{tipo:"word",nombre:"Informe N° 01 (Evaluación Modular)",columnas:["Ex. Práctico","Ex. Teórico"]},informe_recuperacion:{tipo:"word",nombre:"Informe N° 01 - Recuperación",columnas:["Recuperación Ex. Teórico"]},registro_ofimatica:{tipo:"excel",nombre:"Registro de Curso (Estructura de 4 Módulos)",hojas:[{nombre:"Módulo 1",columnas:["P1","P2","P3","EXAMEN"]},{nombre:"Módulo 2",columnas:["P1","P2","P3","EXAMEN"]},{nombre:"Módulo 3",columnas:["P1","P2","P3","EXAMEN"]},{nombre:"Módulo 4",columnas:["P1","P2","P3","EXAMEN"]},{nombre:"Nota final",columnas:["Prom. M1","Prom. M2","Prom. M3","Prom. M4","Examen Final","Prom. General"]},{nombre:"Recuperaciones",columnas:["Rec. Ex. Teórico"]}]},registro_diseno:{tipo:"excel",nombre:"Registro de Taller (PHOTOSHOP, CORELDRAW…)",hojas:[{nombre:"PHOTOSHOP",columnas:["Ex. Práctico","Prácticas","Trabajos"]},{nombre:"CORELDRAW I",columnas:["Ex. Práctico","Prácticas","Trabajos"]},{nombre:"CORELDRAW II",columnas:["Ex. Práctico","Prácticas","Trabajos"]},{nombre:"ILLUSTRATOR",columnas:["Ex. Práctico","Prácticas","Trabajos"]}]}};let le={template:"",wordMod:""};function Pt(){const t='<option value="">(Seleccionar módulo...)</option>'+de($).map(a=>{const n=F(a);return`<option value="${a}">${n?n.seccion.label:a}</option>`}).join(""),o=`
      <div style="font-size:.78rem;color:var(--muted);margin-bottom:12px">
        Selecciona el tipo de documento a exportar y asigna los datos.
      </div>
      <div class="fgroup" style="margin-bottom:16px">
        <div class="flabel">Tipo de Documento</div>
        <select class="finp" id="expTemplate" onchange="renderExportForm()">
          <option value="">(Selecciona una plantilla...)</option>
          ${Object.entries(Ne).map(([a,n])=>`<option value="${a}">${n.nombre}</option>`).join("")}
        </select>
      </div>
      <div id="exportFormContainer"></div>
      <div style="display:none" id="exportModOptionsHidden">${t}</div>
      `;C("📥 Exportar Documentos","",()=>{Ft()},o),document.getElementById("mOk").textContent="📥 Generar",document.getElementById("mOk").style.display="none",le={template:"",wordMod:(T&&T.startsWith("redes_")?T:de($)[0])||"",wordMap:{},excelSheets:{}}}window.renderExportForm=function(){const e=document.getElementById("expTemplate").value,t=document.getElementById("exportFormContainer"),o=document.getElementById("mOk");if(!e){t.innerHTML="",o.style.display="none",le.template="";return}le.template=e,o.style.display="block";const a=Ne[e],n=document.getElementById("exportModOptionsHidden").innerHTML;let s="";if(a.tipo==="word")s+=`
          <div class="fgroup" style="margin-bottom:12px">
            <div class="flabel">Módulo Origen</div>
            <select class="finp" id="expWordMod" onchange="renderWordMapping('${e}')">
              ${n}
            </select>
          </div>
          <div id="expWordMappingPanel" style="background:var(--s2);padding:12px;border-radius:8px;border:1px solid var(--border)"></div>
          <div style="margin-top:12px">
            <div class="flabel" style="margin-bottom:4px">Metadatos del Documento</div>
            <input class="finp" id="expWordProf" placeholder="Nombre del Profesor" value="" style="margin-bottom:6px">
            <input class="finp" id="expWordLugar" placeholder="Lugar (ej: Cajamarca)" value="Cajamarca" style="margin-bottom:6px">
            <input class="finp" id="expWordTurno" placeholder="Turno (ej: Lunes - Miércoles - Viernes 14:00 - 16:00)" value="">
          </div>
        `,t.innerHTML=s,le.wordMod&&(document.getElementById("expWordMod").value=le.wordMod),window.renderWordMapping(e);else if(a.tipo==="excel"&&(s+='<div style="font-size:.8rem;font-weight:600;margin-bottom:8px">Mapeo de Hojas</div>',s+='<div style="display:flex;flex-direction:column;gap:12px;max-height:45vh;overflow-y:auto;padding-right:8px">',a.hojas.forEach((i,r)=>{s+=`
            <div style="background:var(--s2);padding:10px;border-radius:8px;border:1px solid var(--border)">
              <div class="fgroup" style="margin-bottom:8px">
                <div class="flabel" style="color:var(--amber)">📄 Hoja: ${i.nombre}</div>
                <select class="finp" id="expExcMod_${r}" onchange="renderExcelMapping('${e}', ${r})">
                  ${n}
                </select>
              </div>
              <div id="expExcMap_${r}" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"></div>
            </div>
          `}),s+="</div>",s+=`
          <div style="margin-top:12px">
            <div class="flabel" style="margin-bottom:4px">Metadatos (Generales)</div>
            <input class="finp" id="expExcCurso" placeholder="Nombre del Curso/Programa" style="margin-bottom:6px">
            <input class="finp" id="expExcProf" placeholder="Profesor" style="margin-bottom:6px">
            <input class="finp" id="expExcHorario" placeholder="Horario / Días" style="margin-bottom:6px">
            <div style="display:flex;gap:8px">
              <input class="finp" type="date" id="expExcFechaI" placeholder="Fecha inicio" title="Fecha inicio">
              <input class="finp" type="date" id="expExcFechaF" placeholder="Fecha fin" title="Fecha fin">
            </div>
          </div>
        `,t.innerHTML=s,le.wordMod)){const i=document.getElementById("expExcMod_0");i&&(i.value=le.wordMod,window.renderExcelMapping(e,0))}};function Lt(e){return!e||!g[e]||!g[e].notas?'<option value="">(Sin asignar)</option>':'<option value="">(Sin asignar)</option>'+Object.entries(g[e].notas).map(([o,a])=>`<option value="${o}">${a.nombre}</option>`).join("")}window.renderWordMapping=function(e){const t=document.getElementById("expWordMod").value;le.wordMod=t;const o=document.getElementById("expWordMappingPanel");if(!t){o.innerHTML='<div style="font-size:.75rem;color:var(--muted)">Selecciona un módulo arriba para mapear sus notas.</div>';return}const a=Ne[e],n=Lt(t);let s='<div style="font-size:.75rem;font-weight:600;margin-bottom:8px;color:var(--text)">Mapeo de Notas</div>';a.columnas.forEach(d=>{s+=`
          <div class="fgroup">
            <div class="flabel">Columna: ${d}</div>
            <select class="finp" id="expWordCol_${d.replaceAll(/\s+/g,"")}">${n}</select>
          </div>
        `}),o.innerHTML=s;const i=He[t]||{};document.getElementById("expWordProf").value=i.docente||"";const r=F(t);let l="";r&&r.seccion&&r.seccion.label&&(r.seccion.label.toLowerCase().includes("mañana")?l="Lunes - Miércoles - Viernes 09:00 - 13:00":r.seccion.label.toLowerCase().includes("tarde")&&(l="Lunes - Miércoles - Viernes 14:00 - 16:00")),document.getElementById("expWordTurno").value=l||i.horario||""};window.renderExcelMapping=function(e,t){const o=document.getElementById(`expExcMod_${t}`).value,a=document.getElementById(`expExcMap_${t}`);if(!o){a.innerHTML="";return}const s=Ne[e].hojas[t],i=Lt(o);let r="";if(s.columnas.forEach(l=>{r+=`
          <div class="fgroup" style="margin:0">
            <div class="flabel" style="font-size:.65rem">${l}</div>
            <select class="finp" style="font-size:.7rem;padding:4px" id="expExcCol_${t}_${l.replaceAll(/\s+/g,"")}">${i}</select>
          </div>
        `}),a.innerHTML=r,t===0){const l=He[o]||{};document.getElementById("expExcCurso").value||(document.getElementById("expExcCurso").value=l.curso||""),document.getElementById("expExcProf").value||(document.getElementById("expExcProf").value=l.docente||""),document.getElementById("expExcHorario").value||(document.getElementById("expExcHorario").value=l.horario||""),document.getElementById("expExcFechaI").value||(document.getElementById("expExcFechaI").value=l.fechaI||""),document.getElementById("expExcFechaF").value||(document.getElementById("expExcFechaF").value=l.fechaF||"")}};function Ft(){const e=le.template;if(!e)return;const t=Ne[e];t.tipo==="word"?Pn(e,t):Ln(e,t)}function Pn(e,t){var E,D;const o=document.getElementById("expWordMod").value;if(!o){p("⚠️ Selecciona un módulo origen");return}const a=g[o],n=document.getElementById("expWordProf").value.trim(),s=document.getElementById("expWordLugar").value.trim(),i=document.getElementById("expWordTurno").value.trim(),r={};t.columnas.forEach(M=>{const H=document.getElementById(`expWordCol_${M.replaceAll(/\s+/g,"")}`).value;r[M]=H});const l=[new docx.TableCell({children:[new docx.Paragraph({text:"N°",alignment:docx.AlignmentType.CENTER,style:"boldHeader"})],verticalAlign:docx.VerticalAlign.CENTER}),new docx.TableCell({children:[new docx.Paragraph({text:"Apellidos y Nombres",alignment:docx.AlignmentType.CENTER,style:"boldHeader"})],verticalAlign:docx.VerticalAlign.CENTER}),...t.columnas.map(M=>new docx.TableCell({children:[new docx.Paragraph({text:M,alignment:docx.AlignmentType.CENTER,style:"boldHeader"})],verticalAlign:docx.VerticalAlign.CENTER})),new docx.TableCell({children:[new docx.Paragraph({text:"Código de boleta",alignment:docx.AlignmentType.CENTER,style:"boldHeader"})],verticalAlign:docx.VerticalAlign.CENTER})],d=[new docx.TableRow({children:l,tableHeader:!0})];[...a.alumnos||[]].sort((M,H)=>M.nombre.localeCompare(H.nombre)).forEach((M,H)=>{const q=[new docx.TableCell({children:[new docx.Paragraph({text:String(H+1),alignment:docx.AlignmentType.CENTER})]}),new docx.TableCell({children:[new docx.Paragraph({text:M.nombre})]})];t.columnas.forEach(Q=>{const ie=r[Q];let k="";if(ie&&a.notas[ie]&&(k=a.notas[ie].notas[M.id],k==null||k==="")){const W=Object.entries(a.notas[ie].notas).find(([j])=>String(j)===String(M.id));k=(W==null?void 0:W[1])??""}q.push(new docx.TableCell({children:[new docx.Paragraph({text:k!==""?String(Number(k)):"",alignment:docx.AlignmentType.CENTER})]}))});const se=M.dni||`B-${String(Date.now()).slice(-6)}-${H+1}`;q.push(new docx.TableCell({children:[new docx.Paragraph({text:se,alignment:docx.AlignmentType.CENTER})]})),d.push(new docx.TableRow({children:q}))});const m=(He[o]||{}).curso||((D=(E=F(o))==null?void 0:E.seccion)==null?void 0:D.label)||"MÓDULO",v=e==="informe_01"?"INFORME N° 001-2025-CEPTRO-DIMAS":"INFORME N° 001-2025-CEPTRO-DIMAS (Recuperación)",f=e==="informe_01"?`Evaluación modular – ${m.toUpperCase()}`:`Evaluación modular – ${m} (Recuperación)`,b=new Date().toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"}),h=new Date().toLocaleString("es-ES",{month:"long"}),y=`Tengo el agrado de dirigirme a su digno despacho para saludarle y así mismo para informarle sobre la evaluación modular de ${m.toUpperCase()} de los estudiantes del turno de ${i}; la evaluación se desarrolló en el mes de ${h} obteniendo los resultados que se detallan en la siguiente tabla adjunta:`,x=new docx.Document({styles:{paragraphStyles:[{id:"Normal",name:"Normal",basedOn:"Normal",next:"Normal",run:{font:"Arial",size:22}},{id:"boldHeader",name:"Bold Header",basedOn:"Normal",run:{font:"Arial",size:22,bold:!0}},{id:"underlinedTitle",name:"Underlined Title",basedOn:"Normal",run:{font:"Arial",size:26,bold:!0,underline:{type:docx.UnderlineType.SINGLE}}}]},sections:[{properties:{},children:[new docx.Paragraph({text:v,alignment:docx.AlignmentType.CENTER,style:"underlinedTitle",spacing:{after:300}}),new docx.Paragraph({children:[new docx.TextRun({text:"AL :  ",bold:!0}),new docx.TextRun({text:"CEPTRO DIMAS"})],spacing:{after:100}}),new docx.Paragraph({children:[new docx.TextRun({text:"DEL : ",bold:!0}),new docx.TextRun({text:`Prof.: ${n}`})],spacing:{after:100}}),new docx.Paragraph({children:[new docx.TextRun({text:"ASUNTO : ",bold:!0}),new docx.TextRun({text:f})],spacing:{after:100}}),new docx.Paragraph({children:[new docx.TextRun({text:"FECHA: ",bold:!0}),new docx.TextRun({text:`${s}, ${b}`})],spacing:{after:300}}),new docx.Paragraph({text:y,spacing:{after:300},alignment:docx.AlignmentType.JUSTIFIED}),new docx.Table({rows:d,width:{size:100,type:docx.WidthType.PERCENTAGE}}),new docx.Paragraph({text:"",spacing:{after:800}}),new docx.Paragraph({text:"___________________________________",alignment:docx.AlignmentType.CENTER}),new docx.Paragraph({text:n,alignment:docx.AlignmentType.CENTER}),new docx.Paragraph({text:"Profesor",alignment:docx.AlignmentType.CENTER})]}]});docx.Packer.toBlob(x).then(M=>{var Q,ie;const H=window.URL.createObjectURL(M),q=document.createElement("a");q.href=H;const se=e==="informe_01"?"Informe_Modular":"Informe_Recuperacion";q.download=`${se}_${((ie=(Q=F(o))==null?void 0:Q.seccion)==null?void 0:ie.badge)||"Modulo"}_${U}.docx`,q.click(),p("📥 Documento Word generado exitosamente"),w()}).catch(M=>{console.error(M),p("⚠️ Error generando Word")})}function Ln(e,t){var d,c;const o=XLSX.utils.book_new(),a=document.getElementById("expExcCurso").value.trim(),n=document.getElementById("expExcProf").value.trim(),s=document.getElementById("expExcHorario").value.trim(),i=document.getElementById("expExcFechaI").value,r=document.getElementById("expExcFechaF").value;let l=new Set;if(t.hojas.forEach((u,m)=>{const v=document.getElementById(`expExcMod_${m}`).value;if(!v)return;l.add(v);const f=g[v];if(!f||!f.alumnos.length)return;const b={};u.columnas.forEach(j=>{b[j]=document.getElementById(`expExcCol_${m}_${j.replaceAll(/\s+/g,"")}`).value});const h=He[v]||{},y=[...f.fechas||[]].sort(),x=Array.from({length:6},(j,N)=>{const G=Math.floor(N*y.length/6),J=Math.floor((N+1)*y.length/6);return y.slice(G,J)}),E=[...f.alumnos].sort((j,N)=>j.nombre.localeCompare(N.nombre)),D=a||h.curso||u.nombre,M=n||h.docente||"",H=s||h.horario||"",q=i?_e(i):h.fechaI?_e(h.fechaI):"",se=r?_e(r):h.fechaF?_e(h.fechaF):"",Q=(j,N)=>{const G=b[N];if(!G||!f.notas[G])return"";let J=f.notas[G].notas[j.id];if(J==null||J===""){const I=Object.entries(f.notas[G].notas).find(([S])=>String(S)===String(j.id));J=(I==null?void 0:I[1])??""}return J===""?"":Number(J)},ie=(j,N)=>{if(!x[N]||!x[N].length)return"";const G=f.asistencias[j.id]||{};return x[N].filter(I=>(G[I]||"")==="Presente").length/x[N].length>.5?"P":"F"},k=j=>String.fromCharCode(65+j);let W;if(e==="registro_ofimatica"){const j=u.columnas.length,N=9,G=N+j,J=G+1,I=[],S=L=>{const X=Array(J).fill("");return X[2]=L,X};I.push(S(D)),I.push(S(M)),I.push(S(H)),I.push(S(q)),I.push(S(se)),I.push(Array(J).fill(""));const A=Array(J).fill("");A[0]="N° ORDEN",A[1]="APELLIDOS y NOMBRES",A[2]="ASISTENCIA",u.columnas.forEach((L,X)=>{A[N+X]=L}),A[G]="PROM",I.push(A);const ge=Array(J).fill("");for(let L=0;L<6;L++)ge[2+L]=L+1;I.push(ge),E.forEach((L,X)=>{const ve=9+X,re=Array(J).fill("");re[0]=X+1,re[1]=L.nombre;for(let ee=0;ee<6;ee++)re[2+ee]=ie(L,ee);u.columnas.forEach((ee,Se)=>{re[N+Se]=Q(L,ee)}),re[G]={t:"n",f:`AVERAGE(${k(N)}${ve}:${k(N+j-1)}${ve})`},I.push(re)}),W=XLSX.utils.aoa_to_sheet(I),W["!cols"]=[{wch:5},{wch:33},{wch:4.5},{wch:4.5},{wch:4.5},{wch:4.5},{wch:4.5},{wch:4.5},{wch:2.5},...u.columnas.map(()=>({wch:5.5})),{wch:6}],W["!rows"]=[],W["!rows"][5]={hpt:11},W["!rows"][6]={hpt:30},W["!rows"][7]={hpt:22};const Y=[];for(let L=0;L<5;L++)Y.push({s:{r:L,c:2},e:{r:L,c:J-1}});Y.push({s:{r:6,c:0},e:{r:7,c:0}}),Y.push({s:{r:6,c:1},e:{r:7,c:1}}),Y.push({s:{r:6,c:2},e:{r:6,c:7}}),u.columnas.forEach((L,X)=>Y.push({s:{r:6,c:N+X},e:{r:7,c:N+X}})),Y.push({s:{r:6,c:G},e:{r:7,c:G}}),W["!merges"]=Y}else{const j=u.columnas.length,N=21,G=25,J=26,I=17,S=[],A=()=>Array(J).fill("");S.push(A());const ge=A();ge[1]="REGISTRO DE EVALUACIÓN",ge[17]="ESPECIALIDAD",ge[22]="Computación e Informática",S.push(ge),S.push(A());const Y=A();Y[0]="TOTAL MATRICULADOS",Y[2]=E.length,Y[17]="MÓDULO",Y[22]="Diseño Gráfico",S.push(Y),S.push(A());const L=A();L[0]="ALUMNOS APROBADOS",L[17]="PROGRAMA",L[22]=u.nombre,S.push(L),S.push(A());const X=A();X[0]="ALUMNOS DESAPROBADOS",X[17]="DÍAS DE CLASE",X[22]=H||"Sábado",S.push(X),S.push(A());const ve=A();ve[0]="ALUMNOS INHABILITADOS",ve[17]="HORAS",ve[22]=h.horario||"",S.push(ve),S.push(A());const re=A();re[17]="FECHA DE INICIO",re[22]=q,S.push(re),S.push(A());const ee=A();ee[0]="CLASES DICTADAS",ee[2]=y.length,ee[17]="FECHA DE TÉRMINO",ee[22]=se,S.push(ee),S.push(A());const Se=A();Se[17]="PROFESORA",Se[22]=M,S.push(Se),S.push(A());const he=A();he[0]="N°",he[1]="APELLIDOS Y NOMBRES",he[2]="ASISTENCIA",he[20]="N°",u.columnas.forEach((z,me)=>{he[N+me]=z}),he[G]="NOTA FINAL",S.push(he);const rt=A();for(let z=0;z<6;z++)rt[2+z]=z+1;S.push(rt),E.forEach((z,me)=>{const lt=20+me,be=A();be[0]=me+1,be[1]=z.nombre,be[20]=me+1;for(let $e=0;$e<6;$e++)be[2+$e]=ie(z,$e);u.columnas.forEach(($e,zt)=>{be[N+zt]=Q(z,$e)}),be[G]={t:"n",f:`AVERAGE(${k(N)}${lt}:${k(N+j-1)}${lt})`},S.push(be)}),W=XLSX.utils.aoa_to_sheet(S),W["!cols"]=[{wch:5},{wch:30},{wch:4},{wch:4},{wch:4},{wch:4},{wch:4},{wch:4},{wch:3},{wch:3},{wch:3},{wch:3},{wch:3},{wch:3},{wch:3},{wch:3},{wch:3},{wch:3},{wch:3},{wch:3},{wch:5},...u.columnas.map(()=>({wch:7})),{wch:4},{wch:8}].slice(0,J),W["!rows"]=[],W["!rows"][I]={hpt:30},W["!rows"][I+1]={hpt:22};const te=[];[1,3,5,7,9,11,13,15].forEach(z=>{te.push({s:{r:z,c:17},e:{r:z,c:20}}),te.push({s:{r:z,c:22},e:{r:z,c:25}})}),[3,5,7,9,13].forEach(z=>te.push({s:{r:z,c:0},e:{r:z,c:1}})),[3,13].forEach(z=>te.push({s:{r:z,c:2},e:{r:z,c:5}})),te.push({s:{r:1,c:1},e:{r:1,c:4}}),te.push({s:{r:I,c:0},e:{r:I+1,c:0}}),te.push({s:{r:I,c:1},e:{r:I+1,c:1}}),te.push({s:{r:I,c:2},e:{r:I,c:7}}),te.push({s:{r:I,c:20},e:{r:I+1,c:20}}),u.columnas.forEach((z,me)=>te.push({s:{r:I,c:N+me},e:{r:I+1,c:N+me}})),te.push({s:{r:I,c:G},e:{r:I+1,c:G}}),W["!merges"]=te}XLSX.utils.book_append_sheet(o,W,u.nombre.slice(0,31))}),o.SheetNames.length>0){let u="";if(l.size===1){const v=[...l][0];u="_"+(((c=(d=F(v))==null?void 0:d.seccion)==null?void 0:c.badge)||v)}const m=e==="registro_ofimatica"?"Registro_Curso":"Registro_Taller";XLSX.writeFile(o,`${m}${u}_${U}.xlsx`),p(`📥 Excel generado con ${o.SheetNames.length} hoja(s)`),w()}else p("⚠️ No se seleccionaron módulos con alumnos para ninguna hoja.")}function _e(e){if(!e)return"";const[t,o,a]=e.split("-");return`${a}/${o}/${t}`}function Fn(){Pt()}function Pe(){return!!Fe}const zn=["fer250423@gmail.com"];function st(e){if(!ce)try{ce=firebase.initializeApp(e),Fe=firebase.firestore(ce),localStorage.setItem("fb_config",JSON.stringify(e)),On()}catch(t){console.error("Firebase init error:",t)}}function it(e){try{return JSON.parse(e)}catch{}try{const t=e.replace(/\/\/.*$/gm,"").replace(/(\w+)(\s*):/g,'"$1":').replaceAll("'",'"');return JSON.parse(t)}catch{}try{const t=e.match(/\{[\s\S]+\}/);if(t)return JSON.parse(t[0])}catch{}throw new Error("No se pudo parsear la configuración")}function We(){const e=localStorage.getItem("fb_config");let t=e||"";try{t=JSON.stringify(JSON.parse(t),null,2)}catch{}const o=`
    <div class="form-grid" style="grid-template-columns:1fr;gap:12px;margin-top:4px">
      <div class="fgroup">
        <div class="flabel">Configuración de Firebase (JSON)</div>
        <textarea class="finp" id="fbConfigInput" rows="10" style="font-family:'JetBrains Mono',monospace;font-size:.78rem" placeholder='{
  "apiKey": "AIzaSy...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}'>${e||""}</textarea>
      </div>
      <div style="font-size:.75rem;color:var(--muted)">
        <p>1. Ve a <a href="https://console.firebase.google.com" target="_blank" style="color:var(--amber)">Firebase Console</a></p>
        <p>2. Crea un proyecto → ⚙️ → Configuración del proyecto → Tus apps → Web</p>
        <p>3. Copia el objeto <code style="color:var(--green-l)">firebaseConfig</code> y pégalo aquí</p>
        <p>4. En Authentication → Sign-in method → Habilita Google</p>
        <p>5. Agrega tu correo a la lista de autorizados en el código</p>
      </div>
    </div>`;C("🔥 Configurar Firebase","",()=>{const a=document.getElementById("fbConfigInput").value.trim();if(!a){p("⚠️ Pega la configuración");return}try{const n=it(a);st(n),w(),p("✅ Firebase configurado")}catch(n){p("⚠️ Config inválida: "+n.message)}},o),document.getElementById("mOk").textContent="Guardar y conectar"}function On(){ce&&firebase.auth(ce).onAuthStateChanged(e=>{const t=document.getElementById("loginScreen"),o=document.getElementById("mainLayout");e?zn.includes(e.email)?(t.style.display="none",o.style.display="flex"):(document.getElementById("loginError").style.display="block",firebase.auth(ce).signOut()):(t.style.display="flex",o.style.display="none")})}function Hn(){if(!ce){const t=localStorage.getItem("fb_config");if(t)try{st(it(t))}catch(o){console.error("Config inválida guardada:",o),We();return}else{We();return}}const e=new firebase.auth.GoogleAuthProvider;firebase.auth(ce).signInWithPopup(e).then(t=>{const o=t.user;document.getElementById("loginScreen").style.display="none",document.getElementById("mainLayout").style.display="flex",console.log("Login exitoso:",o.email)}).catch(t=>{console.error("Error en login:",t),t.code==="auth/popup-blocked"?alert("El navegador bloqueó la ventana emergente. Permite popups para este sitio."):alert("Error al iniciar sesión: "+t.message)})}function Dn(){firebase.auth(ce).signOut().then(()=>{document.getElementById("loginScreen").style.display="flex",document.getElementById("mainLayout").style.display="none"})}const Rn={loginWithGoogle:Hn,logoutGoogle:Dn,applyTheme:Ue,toggleTheme:Ot,showToast:p,showModal:C,closeModal:w,goPage:ze,switchGrupoAndPage:xo,switchGrupo:Et,toggleSidebar:Ht,toggleCarreraBlock:yo,globalSearch:Dt,closeGlobalSearch:Rt,showFirebaseConfig:We,showExportModal:Pt,exportarBackupJSON:lo,importarBackupJSON:co,showAddCarreraModal:Zt,cargarAsistencia:wo,importExcel:Mo,showGoogleSheetsSyncModal:wt,showAddAlumnoModal:pn,propagarAlumnos:mn,showMoverModuloCompleto:rn,setDateQuick:Oo,onDateChange:Mt,setAsist:Do,setAsistConMotivo:Go,marcarTodos:dn,showPerfil:Wo,enviarWhatsApp:Nt,enviarCorreo:Mn,showMensajeModal:at,showEditarAlumno:fn,showMoverAlumno:Xo,eliminarAlumno:un,retirarAlumno:qo,reactivarAlumno:Vo,quitarFechaModulo:cn,renderPersonalizados:fe,agregarPersonalizado:gn,editarPersonalizado:xn,eliminarPersonalizado:yn,showRegistrarClaseModal:vn,registrarClasePersonalizada:Tt,quitarClasePersonalizada:bn,selectRcVal:Bt,rcAutoHoras:hn,showAddNotaModal:En,toggleNotasTema:$n,setNota:In,eliminarTema:wn,renderParticipacion:nt,setParticipacion:Sn,showSumarParticipacionModal:_n,renderMensual:Kt,renderHistorialMini:Qt,renderAdminCarreras:vt,clearHistorial:ro,renderHoras:pe,initHorasForm:xt,sincronizarHorasLog:Ye,showAgregarHoraManual:jo,setClaseBase:ao,actualizarHora:so,eliminarHora:io,showPromptClaseInfo:Ge,abrirFichaAlumno:Tn,cerrarFichaAlumno:Bn,renderExportForm,renderWordMapping,renderExcelMapping,generarExportacion:Ft,exportarTodo:Fn,fmtFechaMeta:_e,syncSheetTicsSabados:Ke,eliminarCarrera:Yt};Object.entries(Rn).forEach(([e,t])=>{window[e]=t});
