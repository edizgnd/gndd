let isAdmin = false;

// Proje kartlarını getir ve tıklanabilir yap
async function fetchProjects() {
  let res = await fetch("/api/projects");
  let arr = await res.json();
  let html = arr.map(p => `
    <div class="project-card" onclick="showProjectDetail(${p.id})">
      ${p.image ? `<img src="${p.image}">` : `<img src="https://placehold.co/300x120?text=Proje+Görseli">`}
      <h4>${p.title}</h4>
      <p>${p.desc}</p>
    </div>
  `).join("");
  document.getElementById("project-list").innerHTML = html;
  let ul = document.getElementById("admin-projects");
  if(ul) {
    ul.innerHTML = arr.map(p=>`<li>${p.title} <button onclick="deleteProject(${p.id})">Sil</button></li>`).join("");
  }
}
fetchProjects();

// Yönetici giriş
async function adminLogin() {
  let pw = document.getElementById("admin-pw").value;
  let res = await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pw})});
  if(res.ok) {
    isAdmin=true;
    document.getElementById("admin-login").style.display="none";
    document.getElementById("admin-panel").style.display="";
    fetchProjects();
  } else {
    document.getElementById("admin-msg").textContent = "Yanlış şifre!";
  }
}
function adminLogout() {
  isAdmin = false;
  document.getElementById("admin-login").style.display="";
  document.getElementById("admin-panel").style.display="none";
}
document.getElementById("project-form").onsubmit = async function(e) {
  e.preventDefault();
  let form = new FormData();
  form.append("title", document.getElementById("new-title").value);
  form.append("desc", document.getElementById("new-desc").value);
  let image = document.getElementById("new-img").files[0];
  if(image) form.append("image", image);
  let res = await fetch("/api/projects", {method:"POST", body:form});
  if(res.ok) {
    document.getElementById("project-form").reset();
    fetchProjects();
  }
};
async function deleteProject(id) {
  if(confirm("Silmek istediğinize emin misiniz?")) {
    await fetch("/api/projects/"+id, {method:"DELETE"});
    fetchProjects();
  }
}

// Proje detay modal aç
window.showProjectDetail = async function(id) {
  let res = await fetch("/api/projects");
  let arr = await res.json();
  const proj = arr.find(p=>p.id===id);
  let detail = await fetch(`/api/projects/${id}/details`).then(r=>r.json());
  let html = `
    <h2>${proj.title}</h2>
    <img src="${proj.image}" style="max-width:310px;"><br>
    <p>${proj.desc}</p>
    <div class="detail-images">
      ${(detail.images||[]).map(img=>`<img src="${img}">`).join("")}
    </div>
    <div class="detail-texts">
      ${(detail.texts||[]).map(t=>`<div>📝 ${t}</div>`).join("")}
    </div>
    <div id="detail-forms"></div>
  `;
  document.getElementById("project-detail-content").innerHTML = html;
  document.getElementById("project-detail-modal").style.display = "flex";

  // Yönetici için ekleme formları
  if (isAdmin) {
    document.getElementById("detail-forms").innerHTML = `
      <form id="add-detail-image-form" style="margin-top:10px;">
        <input type="file" id="detail-image-file">
        <button type="submit">Fotoğraf Ekle</button>
      </form>
      <form id="add-detail-text-form" style="margin-top:10px;">
        <input type="text" id="detail-text-input" placeholder="Ekstra açıklama" style="width:70%;">
        <button type="submit">Yazı Ekle</button>
      </form>
    `;
    document.getElementById("add-detail-image-form").onsubmit = async function(e) {
      e.preventDefault();
      let fileInput = document.getElementById("detail-image-file");
      let form = new FormData();
      form.append("image", fileInput.files[0]);
      await fetch(`/api/projects/${id}/details/image`, { method:"POST", body:form });
      showProjectDetail(id);
    }
    document.getElementById("add-detail-text-form").onsubmit = async function(e) {
      e.preventDefault();
      let text = document.getElementById("detail-text-input").value;
      await fetch(`/api/projects/${id}/details/text`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({text})
      });
      showProjectDetail(id);
    }
  }
};

window.closeProjectDetail = function() {
  document.getElementById("project-detail-modal").style.display = "none";
}

// İlk açılışta CadCrowd projelerini otomatik ekle
(async function autoSeedCadcrowd() {
  let res = await fetch("/api/projects");
  let arr = await res.json();
  if(arr.length > 0) return;

  let cadProjects = [
    {
      title: "Zincir Tahrikli Lineer Hareket Sistemi",
      desc: "Zincir mekanizmasıyla çalışan, yüksek hassasiyetli endüstriyel lineer pozisyonlama sistemi. Otomasyon hatlarında verimlilik ve hassasiyet için optimize edilmiştir.",
      image: "https://placehold.co/300x120/00b4d8/fff?text=Lineer+Sistem"
    },
    {
      title: "Dikey Helezon Konveyör Sistemi",
      desc: "Enerji verimliliği yüksek, modüler ve bakımı kolay dikey malzeme taşıma sistemi. Fabrika içi ürün transferlerinde uzun ömürlü çözüm.",
      image: "https://placehold.co/300x120/ffd166/222?text=Helezon+Konveyör"
    },
    {
      title: "Troleyli Konveyör Ünitesi",
      desc: "Montaj ve taşıma hatları için geliştirilmiş, ergonomik ve ayarlanabilir troleyli konveyör ünitesi. Operasyonel verimlilik ve esneklik sağlar.",
      image: "https://placehold.co/300x120/43aa8b/fff?text=Troleyli+Konveyör"
    },
    {
      title: "Ultra Hafif Metal Valiz Tekerleği",
      desc: "Uzun ömürlü, sessiz ve dayanıklı, tamamen metalden üretilmiş hafif valiz tekeri tasarımı. Son teknoloji üretim teknikleriyle geliştirilmiştir.",
      image: "https://placehold.co/300x120/4361ee/fff?text=Valiz+Tekerleği"
    },
    {
      title: "Lüks Kişisel Savunma Aksesuarları",
      desc: "CNC işlenmiş, ergonomik ve şık kişisel koruma aksesuarları. Yüksek kalite standartlarına uygun, fonksiyonel ve estetik çözümler.",
      image: "https://placehold.co/300x120/ff006e/fff?text=Savunma+Aksesuarı"
    },
    {
      title: "Lüks Ev Spor Seti – Fitness Bench ve Ayarlanabilir Dambıl",
      desc: "Ev spor alanları için çok fonksiyonlu fitness bench ve entegre ayarlanabilir dambıl seti. Premium malzeme ve mühendislik ile tasarlandı.",
      image: "https://placehold.co/300x120/8338ec/fff?text=Ev+Spor+Seti"
    },
    {
      title: "Katodik Kaplama Besleme Hatları",
      desc: "Endüstriyel yüzey kaplama proseslerinde kullanılan, üretime uygun şekilde tasarlanmış katodik kaplama besleme hatlarının 3D modellemesi ve teknik resimleri.",
      image: "https://placehold.co/300x120/fc9d03/fff?text=Kaplama+Hatları"
    },
    {
      title: "Otomatik Tartım Konveyör Sistemleri",
      desc: "Üretim hatlarında otomatik ürün tartımı ve transferi sağlayan, entegre konveyör sistemlerinin tasarımı ve devreye alınması.",
      image: "https://placehold.co/300x120/00b4d8/fff?text=Tartım+Konveyör"
    },
    {
      title: "Asansör Mekanizmaları",
      desc: "Endüstriyel taşıma ve kaldırma çözümlerinde kullanılan, yüksek güvenlikli ve verimli asansör mekanizmalarının mühendislik ve tasarım süreçleri.",
      image: "https://placehold.co/300x120/ffbe0b/fff?text=Asansör+Mekanizması"
    },
    {
      title: "Özel Platformlar ve İmalata Uygun Revizyonlar",
      desc: "Müşteri ihtiyacına özel geliştirilen platform sistemleri ve imalat kolaylığı sağlayan tasarım revizyonları. Prototipten üretime anahtar teslim çözümler.",
      image: "https://placehold.co/300x120/3a86ff/fff?text=Platform+Revizyon"
    }
  ];
  for(let prj of cadProjects) {
    let form = new FormData();
    form.append("title", prj.title);
    form.append("desc", prj.desc);
    form.append("image", prj.image);
    await fetch("/api/projects", {
      method: "POST",
      body: form
    });
  }
  fetchProjects();
})();