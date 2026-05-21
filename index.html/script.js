// Bază de date extinsă (Imaginea pentru Timișoara a fost reparată)
const INITIAL_DATA = [
    { id: 1, city: "București", zone: "Tineretului", price: 118000, rooms: 2, type: "vanzare", owner: "Agentia Nord", img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600", lat: 44.412, lng: 26.112 },
    { id: 2, city: "Cluj-Napoca", zone: "Zorilor", price: 155000, rooms: 3, type: "vanzare", owner: "Imobiliare CJ", img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=600", lat: 46.758, lng: 23.592 },
    { id: 3, city: "Brașov", zone: "Centrul Vechi", price: 850, rooms: 2, type: "inchiriere", owner: "Mihai Popescu", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600", lat: 45.642, lng: 25.588 },
    // Imaginea de la Timișoara a fost înlocuită cu una validă
    { id: 4, city: "Timișoara", zone: "Complex Studențesc", price: 400, rooms: 1, type: "inchiriere", owner: "Elena Ionescu", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600", lat: 45.747, lng: 21.238 },
    { id: 5, city: "Constanța", zone: "Mamaia Nord", price: 145000, rooms: 2, type: "vanzare", owner: "SeaView Estates", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600", lat: 44.250, lng: 28.625 },
    { id: 6, city: "Iași", zone: "Copou", price: 650, rooms: 3, type: "inchiriere", owner: "Moldova Homes", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600", lat: 47.178, lng: 27.565 }
];

class Notification {
    static show(msg, type = 'info') {
        const c = document.getElementById('toastContainer');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'danger') icon = 'exclamation-circle';

        t.innerHTML = `<i class="fas fa-${icon}"></i> <span>${msg}</span>`;
        c.appendChild(t);
        setTimeout(() => t.classList.add('show'), 10);
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 400);
        }, 3500);
    }
}

class App {
    constructor() {
        this.props = JSON.parse(localStorage.getItem('eh_props')) || INITIAL_DATA;
        this.favs = JSON.parse(localStorage.getItem('eh_favs')) || [];
        this.user = localStorage.getItem('eh_user');
        this.usersDB = JSON.parse(localStorage.getItem('eh_users_db')) || []; // Bază de date simulată cu utilizatori
        this.theme = localStorage.getItem('eh_theme') || 'light';
        this.activeId = null;
        this.map = null;
        this.mapMarkers = null;

        this.initTheme();
        this.renderAuth();
        this.updateFavs();
        
        setTimeout(() => {
            this.initMap();
            this.render(this.props);
        }, 100);

        // Listeners Filtre
        ['searchInput', 'maxPrice', 'typeFilter', 'roomsFilter'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('input', () => this.applyFilters());
        });
    }

    initMap() {
        if (!document.getElementById('map')) return;
        this.map = L.map('map').setView([45.9, 24.9], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap'
        }).addTo(this.map);
        this.mapMarkers = L.layerGroup().addTo(this.map);
    }

    updateMap(data) {
        if(!this.mapMarkers) return;
        this.mapMarkers.clearLayers();
        
        data.forEach(p => {
            if (p.lat && p.lng) {
                const marker = L.marker([p.lat, p.lng]).bindPopup(`
                    <strong style="color:#2563eb">${p.city}</strong><br>
                    ${p.zone} <br>
                    <b>${p.price.toLocaleString()} €</b>
                `);
                this.mapMarkers.addLayer(marker);
            }
        });
    }

    render(data) {
        const grid = document.getElementById('propertiesGrid');
        if(!grid) return;
        grid.innerHTML = '';
        
        document.getElementById('resultsCount').innerText = `${data.length} rezultate`;
        document.getElementById('emptyState').style.display = data.length ? 'none' : 'block';

        data.forEach(p => {
            const isFav = this.favs.includes(p.id);
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => this.openDetails(p.id);
            card.innerHTML = `
                <button class="fav-btn ${isFav ? 'active' : ''}" onclick="app.toggleFav(event, ${p.id})">
                    <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
                </button>
                <img src="${p.img}" alt="${p.city}">
                <div class="card-body">
                    <div class="card-price">${p.price.toLocaleString()} €</div>
                    <h3>${p.city} - ${p.zone}</h3>
                    <p style="color: var(--text-muted); font-size: 14px; margin-top: 10px;">
                        <i class="fas fa-door-open"></i> ${p.rooms} Camere • ${p.type.toUpperCase()}
                    </p>
                </div>
            `;
            grid.appendChild(card);
        });

        this.updateMap(data); 
    }

    applyFilters() {
        const search = document.getElementById('searchInput').value.toLowerCase();
        const maxPrice = Number(document.getElementById('maxPrice').value) || Infinity;
        const type = document.getElementById('typeFilter').value;
        const rooms = Number(document.getElementById('roomsFilter').value);

        const filtered = this.props.filter(p => {
            return (p.city.toLowerCase().includes(search) || p.zone.toLowerCase().includes(search)) &&
                   p.price <= maxPrice &&
                   (type === 'all' || p.type === type) &&
                   p.rooms >= rooms;
        });

        document.getElementById('gridTitle').innerText = "Rezultate căutare";
        this.render(filtered);
    }

    resetFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('maxPrice').value = '';
        document.getElementById('typeFilter').value = 'all';
        document.getElementById('roomsFilter').value = '1';
        document.getElementById('roomsVal').innerText = '1';
        this.resetView();
    }

    resetView() {
        document.getElementById('gridTitle').innerText = "Proprietăți recomandate";
        this.render(this.props);
    }

    toggleFav(e, id) {
        e.stopPropagation();
        const idx = this.favs.indexOf(id);
        if (idx > -1) {
            this.favs.splice(idx, 1);
            Notification.show("Eliminat din favorite");
        } else {
            this.favs.push(id);
            Notification.show("Adăugat la favorite! ❤️", "success");
        }
        localStorage.setItem('eh_favs', JSON.stringify(this.favs));
        this.updateFavs();
        
        if (document.getElementById('gridTitle').innerText === "Favoritele tale") {
            this.showFavorites();
        } else {
            const btn = e.currentTarget;
            btn.classList.toggle('active');
            btn.innerHTML = `<i class="fa-${idx > -1 ? 'regular' : 'solid'} fa-heart"></i>`;
        }
    }

    updateFavs() { 
        if(document.getElementById('favCount')) 
            document.getElementById('favCount').innerText = this.favs.length; 
    }
    
    showFavorites() {
        document.getElementById('gridTitle').innerText = "Favoritele tale";
        this.render(this.props.filter(p => this.favs.includes(p.id)));
    }

    openDetails(id) {
        const p = this.props.find(x => x.id === id);
        this.activeId = id;
        
        document.getElementById('mImg').src = p.img;
        document.getElementById('mTitle').innerText = p.city;
        document.getElementById('mZone').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${p.zone}`;
        document.getElementById('mPrice').innerText = `${p.price.toLocaleString()} €`;
        document.getElementById('mRooms').innerText = p.rooms;
        document.getElementById('mOwner').innerText = p.owner;
        
        // CALCULATOR DE RATĂ
        const calcDiv = document.getElementById('mortgageCalculator');
        if (p.type === 'vanzare') {
            const avans = p.price * 0.15; // 15% avans
            const credit = p.price - avans;
            const dobandaAnuala = 0.07; // 7%
            const luni = 30 * 12; // 30 ani
            const dobandaLuni = dobandaAnuala / 12;
            const rata = (credit * dobandaLuni) / (1 - Math.pow(1 + dobandaLuni, -luni));
            
            calcDiv.style.display = 'block';
            calcDiv.innerHTML = `
                <div style="background: var(--bg-body); padding: 15px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                    <h4 style="margin-bottom: 5px; color: var(--text-main);"><i class="fas fa-calculator"></i> Calculator Rată Credit</h4>
                    <p style="font-size: 13px; color: var(--text-muted);">Calcul estimativ pentru 30 ani, avans 15% (${avans.toLocaleString()} €) și dobândă de 7%.</p>
                    <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary); margin-top: 10px;">~ ${Math.round(rata).toLocaleString()} € / lună</div>
                </div>
            `;
        } else {
            calcDiv.style.display = 'none';
        }
        
        const delBtn = document.getElementById('deleteBtn');
        delBtn.style.display = (this.user && (this.user === p.owner || this.user === 'admin')) ? 'block' : 'none';

        this.openModal('detailsModal');
    }

    openMessageModal() {
        this.closeModals(); 
        this.openModal('messageModal'); 
    }

    sendMessage(e) {
        e.preventDefault();
        this.closeModals();
        Notification.show("Mesajul tău a fost trimis cu succes către proprietar!", "success");
    }

    renderAuth() {
        const area = document.getElementById('authArea');
        const adminPanel = document.getElementById('adminPanel');
        
        // Generăm iconița de soare sau lună în funcție de temă
        const themeIcon = this.theme === 'dark' ? 'sun' : 'moon';

        if (this.user) {
            area.innerHTML = `
                <button id="themeToggleBtn" onclick="app.toggleTheme()" style="margin-right: 15px; font-size: 1.2rem; color: var(--text-main);"><i id="themeIcon" class="fas fa-${themeIcon}"></i></button>
                <strong style="color:var(--text-main); margin-right:10px;">Salut, ${this.user}</strong>
                <button class="btn-danger" style="padding: 6px 12px;" onclick="app.logout()"><i class="fas fa-sign-out-alt"></i></button>
            `;
            if(adminPanel) adminPanel.style.display = 'block';
        } else {
            area.innerHTML = `
                <button id="themeToggleBtn" onclick="app.toggleTheme()" style="margin-right: 15px; font-size: 1.2rem; color: var(--text-main);"><i id="themeIcon" class="fas fa-${themeIcon}"></i></button>
                <button class="btn-outline" style="margin-right: 10px;" onclick="app.openModal('loginModal')"><i class="fas fa-sign-in-alt"></i> Login</button>
                <button class="btn-primary" onclick="app.openModal('registerModal')"><i class="fas fa-user-plus"></i> Register</button>
            `;
            if(adminPanel) adminPanel.style.display = 'none';
        }
    }

    // NOU: Funcția de înregistrare
    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const pass = document.getElementById('regPass').value;

        // Verificăm dacă emailul există deja
        if(this.usersDB.find(u => u.email === email)) {
            Notification.show("Acest email este deja înregistrat!", "danger");
            return;
        }

        const newUser = { name, email, pass };
        this.usersDB.push(newUser);
        localStorage.setItem('eh_users_db', JSON.stringify(this.usersDB));

        // Autentificăm utilizatorul automat după înregistrare
        this.user = name;
        localStorage.setItem('eh_user', name);
        this.renderAuth();
        this.closeModals();
        e.target.reset(); // Golim formularul
        Notification.show(`Cont creat cu succes! Bine ai venit, ${name}.`, "success");
    }

    // MODIFICAT: Funcția de login cu email și parolă
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPass').value;

        // Păstrăm un "backdoor" pentru admin ca să îți fie mai ușor la testare
        if(email === 'admin' && pass === 'admin') {
            this.user = 'admin';
            localStorage.setItem('eh_user', 'admin');
            this.renderAuth();
            this.closeModals();
            e.target.reset();
            Notification.show(`Autentificare admin reușită!`, "success");
            return;
        }

        const foundUser = this.usersDB.find(u => u.email === email && u.pass === pass);

        if (foundUser) {
            this.user = foundUser.name;
            localStorage.setItem('eh_user', foundUser.name);
            this.renderAuth();
            this.closeModals();
            e.target.reset(); // Golim formularul
            Notification.show(`Autentificare reușită! Salut, ${foundUser.name}.`, "success");
        } else {
            Notification.show("Email sau parolă incorecte!", "danger");
        }
    }

    logout() {
        this.user = null;
        localStorage.removeItem('eh_user');
        this.renderAuth();
        Notification.show("Te-ai delogat.");
    }

    handleUpload(e) {
        e.preventDefault();
        const noPhotoURL = "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600";
        
        const newP = {
            id: Date.now(),
            city: document.getElementById('addCity').value,
            zone: document.getElementById('addZone').value,
            price: Number(document.getElementById('addPrice').value),
            rooms: Number(document.getElementById('addRooms').value),
            type: document.getElementById('addType').value,
            owner: this.user,
            img: noPhotoURL, 
            lat: 45.9 + (Math.random() * 0.5 - 0.25), 
            lng: 24.9 + (Math.random() * 0.5 - 0.25)
        };

        this.props.unshift(newP);
        localStorage.setItem('eh_props', JSON.stringify(this.props));
        e.target.reset();
        Notification.show("Proprietatea a fost publicată!", "success");
        this.resetFilters();
    }

    handleDelete() {
        if(!confirm("Ștergi acest anunț?")) return;
        this.props = this.props.filter(p => p.id !== this.activeId);
        localStorage.setItem('eh_props', JSON.stringify(this.props));
        this.closeModals();
        Notification.show("Anunț șters.");
        this.resetFilters();
    }

    initTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateThemeIcon();
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('eh_theme', this.theme);
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const icon = document.getElementById('themeIcon');
        if(icon) icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    openModal(id) { 
        const m = document.getElementById(id);
        if(m) m.classList.add('active'); 
    }
    
    closeModals() { 
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active')); 
    }
    
    checkCloseModal(e) { 
        if(e.target.classList.contains('modal-overlay')) this.closeModals(); 
    }
}

// Inițializare aplicație la încărcarea paginii
window.onload = () => { window.app = new App(); };
