const GITHUB_USER = "coldoutt";
const GITHUB_REPO = "web";
const BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${BRANCH}/photo`;

let msnry;
const circle = document.getElementById('progress-circle');
const circumference = 2 * Math.PI * 18;
const btnTop = document.getElementById('back-to-top');
const overlay = document.getElementById('gallery-overlay');

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

// Функция прокрутки вверх
function scrollToTop() {
  const target = !overlay.classList.contains('hidden') ? overlay : window;
  target.scrollTo({ top: 0, behavior: 'smooth' });
}

// Отслеживание скролла
const handleScroll = (e) => {
  const scrollY = e.target === overlay ? overlay.scrollTop : window.scrollY;
  btnTop.classList.toggle('visible', scrollY > 600);
};

window.addEventListener('scroll', handleScroll);
overlay.addEventListener('scroll', handleScroll);

// Инициализация сайта
async function initSite() {
  try {
    const response = await fetch(`data.json?v=${new Date().getTime()}`);
    const data = await response.json();
    const years = Object.keys(data).sort((a, b) => b - a);

    years.forEach(year => {
      const navLink = document.createElement('a');
      navLink.innerText = year;
      navLink.className = "hover:text-white transition-colors cursor-pointer";
      navLink.onclick = () => document.getElementById(`year-${year}`).scrollIntoView();
      document.getElementById('nav-years').appendChild(navLink);

      const section = document.createElement('section');
      section.id = `year-${year}`;
      section.className = 'mb-24 reveal';
      
      const tripsHtml = data[year].map(trip => {
        const fNum = trip.folder.split('_')[0];
        const fileName = `${year}_${fNum}_01.jpg`;
        const coverUrl = `${RAW_BASE}/${year}/${trip.folder}/${fileName}`;
        return `
          <div onclick="openGallery('${trip.title}', '${year}', '${trip.folder}', '${fNum}', ${trip.count})" class="group cursor-pointer">
            <div class="aspect-[4/5] bg-zinc-900 overflow-hidden mb-1"><img src="${coverUrl}" class="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-1000"></div>
            <h3 class="text-white text-3xl font-thin lowercase tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity duration-500">${trip.title}</h3>
          </div>`;
      }).join('');

      section.innerHTML = `<div class="border-b border-zinc-900 pb-2 mb-10"><h2 class="text-5xl md:text-6xl font-extralight text-white tracking-tighter">${year}</h2></div>
                           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">${tripsHtml}</div>`;
      document.getElementById('years-container').appendChild(section);
    });

    const obs = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) e.target.classList.add('active') }));
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  } catch (e) { console.error(e); }
}

// Открытие папки и подгрузка Masonry
async function openGallery(title, year, folderFull, fNum, count) {
  const grid = document.getElementById('gallery-grid');
  const loader = document.getElementById('loader-container');
  grid.innerHTML = '';
  document.getElementById('gallery-title').innerText = title;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  circle.style.strokeDashoffset = circumference;
  loader.style.opacity = "1";
  btnTop.classList.remove('visible');

  msnry = new Masonry(grid, {
    itemSelector: '.grid-item',
    columnWidth: '.grid-item',
    percentPosition: true,
    gutter: 20
  });

  for (let i = 1; i <= count; i++) {
    const photoNum = String(i).padStart(2, '0');
    const fileName = `${year}_${fNum}_${photoNum}.jpg`;
    const imgUrl = `${RAW_BASE}/${year}/${folderFull}/${fileName}`;

    const item = document.createElement('div');
    item.className = 'grid-item loading';
    grid.appendChild(item);
    msnry.appended(item);

    await new Promise(resolve => {
      const img = new Image();
      img.src = imgUrl;
      img.onload = () => {
        item.classList.remove('loading');
        item.appendChild(img);
        imagesLoaded(item, () => {
          img.classList.add('loaded');
          msnry.layout();
          circle.style.strokeDashoffset = circumference - (i / count) * circumference;
          resolve();
        });
        img.onclick = () => {
            document.getElementById('lightbox-img').src = imgUrl;
            document.getElementById('lightbox').classList.add('active');
        };
      };
      img.onerror = resolve;
    });
  }
  setTimeout(() => loader.style.opacity = "0", 800);
}

function closeGallery() { 
    overlay.classList.add('hidden'); 
    document.body.style.overflow = 'auto'; 
}

function closeLightbox() { 
    document.getElementById('lightbox').classList.remove('active'); 
}

initSite();