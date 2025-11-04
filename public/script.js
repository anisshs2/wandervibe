// Navigation Toggle for Mobile
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenu) {
    mobileMenu.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking nav links
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        // Skip if href is just "#" or invalid
        if (!href || href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Add fade-in-up class to elements
const animatedElements = document.querySelectorAll('.highlight-card, .destination-card, .story-card');
animatedElements.forEach(el => {
    el.classList.add('fade-in-up');
    observer.observe(el);
});

// AI-Powered Search with Groq
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// AI-Powered Search with Groq (Removed for now)
// TODO: Implement backend API to securely handle Groq requests
const GROQ_API_KEY = ''; // Removed for security
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Rate limiting configuration based on Groq limits
const RATE_LIMITS = {
    requestsPerMinute: 30,
    requestsPerDay: 1000,
    tokensPerMinute: 12000,
    tokensPerDay: 100000
};

// Rate limiting tracking
let requestHistory = [];
let estimatedTokensUsed = 0;
let dailyRequestCount = parseInt(localStorage.getItem('dailyRequestCount') || '0');
let dailyTokenCount = parseInt(localStorage.getItem('dailyTokenCount') || '0');
let lastResetDate = localStorage.getItem('lastResetDate') || new Date().toDateString();

// Reset daily counters if it's a new day
if (lastResetDate !== new Date().toDateString()) {
    dailyRequestCount = 0;
    dailyTokenCount = 0;
    localStorage.setItem('dailyRequestCount', '0');
    localStorage.setItem('dailyTokenCount', '0');
    localStorage.setItem('lastResetDate', new Date().toDateString());
}

// Predefined destinations on our website
const knownDestinations = [
    'Bali, Indonesia',
    'Santorini, Greece',
    'Rome, Italy',
    'Swiss Alps'
];

async function searchWithGroq(query) {
    try {
        // Simple rate limiting check
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        requestHistory = requestHistory.filter(timestamp => timestamp > oneMinuteAgo);

        if (requestHistory.length >= RATE_LIMITS.requestsPerMinute) {
            searchResults.innerHTML = `
                <div class="error-message">
                    <h3>Rate limit reached</h3>
                    <p>You've made ${RATE_LIMITS.requestsPerMinute} requests in the last minute. Please wait a moment before trying again.</p>
                    <p><small>Current usage: ${dailyRequestCount}/${RATE_LIMITS.requestsPerDay} daily requests, ${dailyTokenCount}/${RATE_LIMITS.tokensPerDay} daily tokens</small></p>
                </div>
            `;
            searchResults.classList.add('show');
            return;
        }

        requestHistory.push(now);

        // Show loading state
        searchResults.classList.add('show');
        searchResults.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Current supported Groq model
                messages: [
                    {
                        role: 'system',
                        content: `You are a knowledgeable travel guide assistant. Provide detailed, engaging, and helpful information about travel destinations. Include information about:
                        - Best time to visit
                        - Top attractions
                        - Local cuisine
                        - Cultural tips
                        - Budget considerations
                        - Travel tips

                        Format your response in a friendly, conversational way with clear sections. Keep responses concise but informative (around 250-300 words).`
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('API Error Response:', errorBody);
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        // Log usage information from Groq API
        if (data.usage) {
            console.log('Groq API Usage:', data.usage);
            // Update our tracking with actual usage
            dailyTokenCount += data.usage.total_tokens;
            localStorage.setItem('dailyTokenCount', dailyTokenCount.toString());
        }

        // Update request count
        dailyRequestCount++;
        localStorage.setItem('dailyRequestCount', dailyRequestCount.toString());

        // Display results
        displaySearchResults(query, aiResponse);

    } catch (error) {
        console.error('Search error:', error);
        let errorMessage = 'Unknown error occurred';

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Network error - CORS or connectivity issue';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Failed to connect to Groq API - check network connection';
        } else {
            errorMessage = error.message;
        }

        searchResults.innerHTML = `
            <div class="error-message">
                <h3>Oops! Something went wrong</h3>
                <p><strong>Error:</strong> ${errorMessage}</p>
                <p>This might be due to:</p>
                <ul>
                    <li>Browser blocking CORS requests from file:// URLs</li>
                    <li>Groq API service temporarily unavailable</li>
                    <li>Network connectivity issues</li>
                    <li>API key authentication problems</li>
                </ul>
                <p style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <strong>To fix CORS issues:</strong>
                    <br>1. Use Firebase hosting or any web server
                    <br>2. Or try testing with a browser that has CORS disabled (not recommended for regular use)
                    <br>3. Check browser console for more detailed error messages
                </p>
            </div>
        `;
        searchResults.classList.add('show');
    }
}

function displaySearchResults(query, aiResponse) {
    // Format the AI response with better HTML structure
    const formattedResponse = aiResponse
        .split('\n')
        .map(line => {
            if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                return `<h4>${line.replace(/\*\*/g, '')}</h4>`;
            }
            if (line.trim().startsWith('- ')) {
                return `<li>${line.substring(2)}</li>`;
            }
            if (line.trim()) {
                return `<p>${line}</p>`;
            }
            return '';
        })
        .join('');

    searchResults.innerHTML = `
        <div class="search-result-header">
            <h3><i class="fas fa-robot"></i> AI Travel Guide Response</h3>
            <p class="search-query">About: "${query}"</p>
        </div>
        <div class="ai-response">
            ${formattedResponse}
        </div>
        <div class="search-actions">
            <button onclick="clearSearch()" class="btn-clear">Clear Search</button>
        </div>
    `;
}

function clearSearch() {
    searchResults.classList.remove('show');
    searchInput.value = '';
}

// Search event listeners (only if elements exist)
if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchWithGroq(query);
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                searchWithGroq(query);
            }
        }
    });
}

// Add some CSS for the error message and search results
const style = document.createElement('style');
style.textContent = `
    .error-message {
        color: #e74c3c;
        padding: 1rem;
    }

    .error-message h3 {
        color: #c0392b;
        margin-bottom: 1rem;
    }

    .error-message ul {
        margin-left: 1.5rem;
        margin-top: 0.5rem;
    }

    .error-message a {
        color: #3498db;
        text-decoration: underline;
    }

    .search-result-header {
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 1rem;
        margin-bottom: 1.5rem;
    }

    .search-query {
        color: #666;
        font-style: italic;
        margin-top: 0.5rem;
    }

    .ai-response h4 {
        color: #2c3e50;
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
        font-size: 1.1rem;
    }

    .ai-response p {
        color: #555;
        margin-bottom: 1rem;
        line-height: 1.8;
    }

    .ai-response li {
        color: #555;
        margin-bottom: 0.5rem;
        margin-left: 1.5rem;
        line-height: 1.6;
    }

    .search-actions {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 2px solid #f0f0f0;
        text-align: center;
    }

    .btn-clear {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .btn-clear:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    }
`;
document.head.appendChild(style);

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-content');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        hero.style.opacity = 1 - scrolled / 700;
    }
});

// Load content from Firestore
async function loadFirestoreContent() {
    try {
        const { collection, getDocs } = window.firestoreModules;
        const db = window.db;

        // Load highlights
        const highlightsSnapshot = await getDocs(collection(db, 'highlights'));
        const highlightsGrid = document.querySelector('.highlights-grid');
        if (highlightsGrid && !highlightsSnapshot.empty) {
            highlightsGrid.innerHTML = '';
            highlightsSnapshot.forEach(doc => {
                const data = doc.data();
                const highlightId = doc.id;
                const card = `
                    <div class="highlight-card fade-in-up">
                        <div class="card-image">
                            <img src="${data.imageUrl}" alt="${data.title}">
                        </div>
                        <div class="card-content">
                            <h3>${data.title}</h3>
                            <p>${data.description}</p>
                            <a href="highlight.html?id=${highlightId}" class="card-link">Read More</a>
                        </div>
                    </div>
                `;
                highlightsGrid.innerHTML += card;
            });
        }

        // Load destinations
        const destinationsSnapshot = await getDocs(collection(db, 'destinations'));
        const destinationsGrid = document.querySelector('.destinations-grid');
        if (destinationsGrid && !destinationsSnapshot.empty) {
            destinationsGrid.innerHTML = '';
            destinationsSnapshot.forEach(doc => {
                const data = doc.data();
                const destId = doc.id;
                const tags = data.tags ? data.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '';
                const card = `
                    <article class="destination-card fade-in-up">
                        <div class="destination-image">
                            <img src="${data.imageUrl}" alt="${data.name}">
                        </div>
                        <div class="destination-content">
                            <h3>${data.name}</h3>
                            <p>${data.description}</p>
                            <div class="destination-tags">
                                ${tags}
                            </div>
                            <a href="destination.html?id=${destId}" class="destination-link">Explore ${data.name.split(',')[0]}</a>
                        </div>
                    </article>
                `;
                destinationsGrid.innerHTML += card;
            });
        }

        // Load stories
        const storiesSnapshot = await getDocs(collection(db, 'stories'));
        const storiesGrid = document.querySelector('.stories-grid');
        if (storiesGrid && !storiesSnapshot.empty) {
            storiesGrid.innerHTML = '';
            storiesSnapshot.forEach(doc => {
                const data = doc.data();
                const card = `
                    <article class="story-card fade-in-up">
                        <div class="story-image">
                            <img src="${data.imageUrl}" alt="${data.title}">
                        </div>
                        <div class="story-content">
                            <div class="story-meta">
                                <span class="story-category">${data.category}</span>
                            </div>
                            <h3>${data.title}</h3>
                            <p>${data.description}</p>
                            <a href="#" class="story-link">Read Full Story</a>
                        </div>
                    </article>
                `;
                storiesGrid.innerHTML += card;
            });
        }

        // Re-observe animated elements after dynamic content is loaded
        const animatedElements = document.querySelectorAll('.highlight-card, .destination-card, .story-card');
        animatedElements.forEach(el => {
            observer.observe(el);
        });

        console.log('Content loaded from Firestore successfully!');
    } catch (error) {
        console.error('Error loading Firestore content:', error);
    }
}

// Wait for Firebase to initialize, then load content
window.addEventListener('load', () => {
    // Give Firebase a moment to initialize
    setTimeout(loadFirestoreContent, 500);
});

// FAQ Accordion
document.addEventListener('DOMContentLoaded', () => {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');

            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });

            // Open clicked item if it wasn't active
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
});

console.log('Travel Blog Website Loaded Successfully!');
console.log('Remember to add your Groq API key to enable AI-powered search.');