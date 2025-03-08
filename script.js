// TMDB API Ayarları
const API_KEY = '1e9bb3810aee75696704e4709b0f8a1d'; // Gerçek API anahtarınızı buraya ekleyin
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const LANGUAGE = 'tr-TR';

// Uygulama durumu
let movieData = {
    movie1: null,
    movie2: null
};

let userSelections = JSON.parse(localStorage.getItem('cinematrixSelections')) || [];

// DOM Elementleri
const homeLink = document.getElementById('home-link');
const historyLink = document.getElementById('history-link');
const aboutLink = document.getElementById('about-link');
const homeSection = document.getElementById('home-section');
const historySection = document.getElementById('history-section');
const aboutSection = document.getElementById('about-section');
const movie1Element = document.getElementById('movie-1');
const movie2Element = document.getElementById('movie-2');
const skipPairButton = document.getElementById('skip-pair');
const historyContainer = document.getElementById('history-container');

// Event Listeners
document.addEventListener('DOMContentLoaded', init);
homeLink.addEventListener('click', showSection);
historyLink.addEventListener('click', showSection);
aboutLink.addEventListener('click', showSection);
skipPairButton.addEventListener('click', loadNewMoviePair);
movie1Element.querySelector('.select-btn').addEventListener('click', () => selectMovie(1));
movie2Element.querySelector('.select-btn').addEventListener('click', () => selectMovie(2));

// Film türleri için cache
let genresCache = {};

// Uygulama Başlatıcı
async function init() {
    await fetchGenres();
    loadNewMoviePair();
    renderHistory();
}

// Film türlerini getir
async function fetchGenres() {
    try {
        const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=${LANGUAGE}`);
        const data = await response.json();
        
        // Tür listesini cache'e ekle
        data.genres.forEach(genre => {
            genresCache[genre.id] = genre.name;
        });
    } catch (error) {
        console.error('Film türleri alınırken hata oluştu:', error);
    }
}

// Rastgele film getir
async function fetchRandomMovie() {
    try {
        // Rastgele popüler bir film sayfası seç
        const randomPage = Math.floor(Math.random() * 20) + 1;
        const response = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${LANGUAGE}&sort_by=popularity.desc&include_adult=false&page=${randomPage}`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            // Sayfadan rastgele bir film seç
            const randomIndex = Math.floor(Math.random() * data.results.length);
            const basicMovieData = data.results[randomIndex];
            
            // Film detaylarını al
            const detailsResponse = await fetch(`${BASE_URL}/movie/${basicMovieData.id}?api_key=${API_KEY}&language=${LANGUAGE}`);
            const movieDetails = await detailsResponse.json();
            
            return movieDetails;
        }
        return null;
    } catch (error) {
        console.error('Film verileri alınırken hata oluştu:', error);
        return null;
    }
}

// İki film yükle ve göster
async function loadNewMoviePair() {
    // Loading durumunu göster
    showLoadingState(movie1Element);
    showLoadingState(movie2Element);
    
    try {
        // İki film al
        const [movie1, movie2] = await Promise.all([
            fetchRandomMovie(),
            fetchRandomMovie()
        ]);
        
        // İki film de aynıysa yeniden yükle
        if (movie1 && movie2 && movie1.id === movie2.id) {
            return loadNewMoviePair();
        }
        
        // Film verilerini sakla
        movieData.movie1 = movie1;
        movieData.movie2 = movie2;
        
        // Filmleri görüntüle
        if (movie1) displayMovie(movie1Element, movie1);
        if (movie2) displayMovie(movie2Element, movie2);
        
    } catch (error) {
        console.error('Filmler yüklenirken hata oluştu:', error);
        hideLoadingState(movie1Element);
        hideLoadingState(movie2Element);
    }
}

// Film bilgilerini ekranda göster
function displayMovie(element, movie) {
    const posterElement = element.querySelector('.movie-poster');
    const titleElement = element.querySelector('.movie-title');
    const yearElement = element.querySelector('.movie-year');
    const ratingElement = element.querySelector('.movie-rating span');
    const genresElement = element.querySelector('.movie-genres');
    const overviewElement = element.querySelector('.movie-overview');
    const selectButton = element.querySelector('.select-btn');
    
    // Film posterini göster
    if (movie.poster_path) {
        posterElement.src = IMG_URL + movie.poster_path;
        posterElement.alt = movie.title;
        posterElement.style.display = 'block';
    } else {
        posterElement.src = 'https://via.placeholder.com/300x450?text=Poster+Yok';
        posterElement.alt = 'Poster Yok';
    }
    
    // Film bilgilerini göster
    titleElement.textContent = movie.title;
    
    // Yayın yılını göster
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Bilinmiyor';
    yearElement.textContent = releaseYear;
    
    // Puanı göster
    ratingElement.textContent = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    
    // Türleri göster
    genresElement.innerHTML = '';
    if (movie.genres && movie.genres.length > 0) {
        movie.genres.slice(0, 3).forEach(genre => {
            const genreTag = document.createElement('span');
            genreTag.classList.add('genre-tag');
            genreTag.textContent = genre.name;
            genresElement.appendChild(genreTag);
        });
    }
    
    // Özeti göster
    overviewElement.textContent = movie.overview || 'Bu film için özet bilgisi bulunmuyor.';
    
    // Buton ID'sini ayarla
    selectButton.dataset.id = movie.id;
    
    // Loading durumunu kaldır
    hideLoadingState(element);
}

// Loading durumunu göster
function showLoadingState(element) {
    const posterElement = element.querySelector('.movie-poster');
    const loadingElement = element.querySelector('.loading-spinner');
    const titleElement = element.querySelector('.movie-title');
    const overviewElement = element.querySelector('.movie-overview');
    
    posterElement.style.display = 'none';
    loadingElement.style.display = 'block';
    titleElement.textContent = 'Film Yükleniyor...';
    overviewElement.textContent = 'Film bilgileri yükleniyor...';
    
    element.querySelector('.movie-year').textContent = '';
    element.querySelector('.movie-rating span').textContent = '';
    element.querySelector('.movie-genres').innerHTML = '';
}

// Loading durumunu gizle
function hideLoadingState(element) {
    const loadingElement = element.querySelector('.loading-spinner');
    loadingElement.style.display = 'none';
}

// Film seçimi yap
function selectMovie(movieNumber) {
    const winner = movieNumber === 1 ? movieData.movie1 : movieData.movie2;
    const loser = movieNumber === 1 ? movieData.movie2 : movieData.movie1;
    
    if (!winner || !loser) return;
    
    // Seçimi kaydet
    const selection = {
        date: new Date().toISOString(),
        winnerId: winner.id,
        winnerTitle: winner.title,
        winnerPoster: winner.poster_path,
        loserId: loser.id,
        loserTitle: loser.title,
        loserPoster: loser.poster_path
    };
    
    userSelections.unshift(selection); // En son seçim en üstte
    
    // Maksimum 100 seçim sakla
    if (userSelections.length > 100) {
        userSelections = userSelections.slice(0, 100);
    }
    
    // Local storage'a kaydet
    localStorage.setItem('cinematrixSelections', JSON.stringify(userSelections));
    
    // Seçim geçmişini güncelle
    renderHistory();
    
    // Yeni film çifti yükle
    loadNewMoviePair();
}

// Seçim geçmişini göster
function renderHistory() {
    if (userSelections.length === 0) {
        historyContainer.innerHTML = '<div class="no-history">Henüz hiç seçim yapmadınız.</div>';
        return;
    }
    
    historyContainer.innerHTML = '';
    
    userSelections.forEach(selection => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        
        const formattedDate = new Date(selection.date).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        historyItem.innerHTML = `
            <img src="${selection.winnerPoster ? IMG_URL + selection.winnerPoster : 'https://via.placeholder.com/80x120?text=Poster+Yok'}" alt="${selection.winnerTitle}" class="history-poster">
            <div class="history-details">
                <div class="history-date">${formattedDate}</div>
                <div>
                    <span class="history-winner">${selection.winnerTitle}</span>
                    <span>></span>
                    <span class="history-loser">${selection.loserTitle}</span>
                </div>
            </div>
        `;
        
        historyContainer.appendChild(historyItem);
    });
}

// Bölümleri göster/gizle
function showSection(e) {
    if (e) e.preventDefault();
    
    const targetId = e.currentTarget.id;
    
    // Tüm linklerin active class'ını kaldır
    homeLink.classList.remove('active');
    historyLink.classList.remove('active');
    aboutLink.classList.remove('active');
    
    // Tüm bölümleri gizle
    homeSection.classList.add('hidden-section');
    homeSection.classList.remove('active-section');
    historySection.classList.add('hidden-section');
    historySection.classList.remove('active-section');
    aboutSection.classList.add('hidden-section');
    aboutSection.classList.remove('active-section');
    
    // Seçilen bölümü göster
    if (targetId === 'home-link') {
        homeLink.classList.add('active');
        homeSection.classList.remove('hidden-section');
        homeSection.classList.add('active-section');
    } else if (targetId === 'history-link') {
        historyLink.classList.add('active');
        historySection.classList.remove('hidden-section');
        historySection.classList.add('active-section');
        renderHistory(); // Seçim geçmişini güncelle
    } else if (targetId === 'about-link') {
        aboutLink.classList.add('active');
        aboutSection.classList.remove('hidden-section');
        aboutSection.classList.add('active-section');
    }
}