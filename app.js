// ===============================
// DOM Elements
// ===============================
const elements = {
  mobileMenuIcon: document.querySelector('.mobile-menu-icon'),
  mobileMenu: document.querySelector('.mobile-menu'),
  navLinks: document.querySelectorAll('.nav-links li a'),
  uploadArea: document.getElementById('uploadArea'),
  roomUpload: document.getElementById('room-upload'),
  previewContainer: document.getElementById('previewContainer'),
  imagePreview: document.getElementById('imagePreview'),
  clearBtn: document.getElementById('clearBtn'),
  generateBtn: document.getElementById('generateBtn'),
  roomPrompt: document.getElementById('roomPrompt'),
  furnitureSuggestions: document.getElementById('furnitureSuggestions'),
  contactForm: document.getElementById('contactForm'),
  googleSignInBtn: document.getElementById('googleSignIn') || document.getElementById('googleSignInButton'),
  signupModal: document.getElementById('signupModal'),
  closeModalBtn: document.getElementById('closeSignupModal'),
  profileWrapper: document.getElementById('profileWrapper'),
  profileCircle: document.getElementById('profileCircle'),
  profileDropdown: document.getElementById('profileDropdown'),
  profileEmail: document.getElementById('profileEmail'),
  logoutBtn: document.getElementById('logoutBtn'),
  resultContainer: document.getElementById('resultContainer'),
  resultImage: document.getElementById('resultImage')
};

// ===============================
// State
// ===============================
const state = {
  isLoggedIn: false,
  googleUser: null,
  selectedStyle: null,
  API_URL: "http://localhost:5000/api/generate-image" // Define your API endpoint
};

// ===============================
// Init
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadGoogleIdentityServices();
  restoreSession();
  setupStyleTemplates();
});

// ===============================
// Event Listeners
// ===============================
function setupEventListeners() {
  // Mobile menu toggle
  if (elements.mobileMenuIcon) {
    elements.mobileMenuIcon.addEventListener('click', toggleMobileMenu);
  }

  elements.navLinks.forEach(link =>
    link.addEventListener('click', closeMobileMenu)
  );

  document.addEventListener('click', (e) => {
    if (
      elements.mobileMenu &&
      !elements.mobileMenu.contains(e.target) &&
      e.target !== elements.mobileMenuIcon &&
      !elements.mobileMenuIcon.contains(e.target)
    ) {
      closeMobileMenu();
    }
  });

  // Upload
  if (elements.uploadArea) {
    elements.uploadArea.addEventListener('click', () => elements.roomUpload.click());
    setupDragAndDrop();
  }

  if (elements.roomUpload) {
    elements.roomUpload.addEventListener('change', handleFileUpload);
  }

  if (elements.clearBtn) {
    elements.clearBtn.addEventListener('click', clearUploadedImage);
  }

  // Generate AI button
  if (elements.generateBtn) {
    elements.generateBtn.addEventListener('click', handleGenerateClick);
  }

  // Contact form
  if (elements.contactForm) {
    elements.contactForm.addEventListener('submit', handleContactSubmit);
  }

  // Modal
  if (elements.closeModalBtn) {
    elements.closeModalBtn.addEventListener('click', closeSignupModal);
  }

  window.addEventListener('click', (e) => {
    if (e.target === elements.signupModal) {
      closeSignupModal();
    }
  });

  // Profile dropdown toggle
  if (elements.profileCircle) {
    elements.profileCircle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleProfileDropdown();
    });
  }

  // Close profile dropdown on outside click
  document.addEventListener('click', (e) => {
    if (
      elements.profileWrapper &&
      !elements.profileWrapper.contains(e.target) &&
      elements.profileDropdown &&
      elements.profileDropdown.style.display === 'block'
    ) {
      elements.profileDropdown.style.display = 'none';
    }
  });

  // Logout
  if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', handleLogout);
  }
}

// ===============================
// Mobile Menu
// ===============================
function toggleMobileMenu() {
  elements.mobileMenu.classList.toggle('active');
  const icon = this.querySelector('i');
  if (icon) {
    icon.classList.toggle('fa-times');
    icon.classList.toggle('fa-bars');
  }
}

function closeMobileMenu() {
  if (!elements.mobileMenu) return;
  elements.mobileMenu.classList.remove('active');
  const icon = elements.mobileMenuIcon && elements.mobileMenuIcon.querySelector('i');
  if (icon) {
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');
  }
}

// ===============================
// Upload
// ===============================
function setupDragAndDrop() {
  elements.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
  });

  elements.uploadArea.addEventListener('dragleave', () => {
    elements.uploadArea.classList.remove('dragover');
  });

  elements.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      elements.roomUpload.files = e.dataTransfer.files;
      handleFileUpload();
    }
  });
}

function handleFileUpload() {
  const file = elements.roomUpload.files[0];
  if (!file) return;

  if (file.type.match('image.*')) {
    const reader = new FileReader();
    reader.onload = function (e) {
      elements.imagePreview.src = e.target.result;
      elements.uploadArea.style.display = 'none';
      elements.previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    alert('Please upload an image file.');
  }
}

function clearUploadedImage(e) {
  e && e.preventDefault();
  elements.roomUpload.value = '';
  elements.previewContainer.style.display = 'none';
  elements.uploadArea.style.display = 'block';
}

// ===============================
// AI Generate
// ===============================
async function handleGenerateClick() {
  if (!state.isLoggedIn) {
    showSignupModal();
    return;
  }

  const file = elements.roomUpload.files && elements.roomUpload.files[0];
  const prompt = elements.roomPrompt && elements.roomPrompt.value;

  if (!file) {
    alert('Please upload a room photo!');
    return;
  }
  
  if (!prompt || !prompt.trim()) {
    alert('Please describe your dream room!');
    return;
  }

  showLoadingState();
  
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('image', file);
    formData.append('prompt', prompt);
    
    if (state.selectedStyle) {
      formData.append('style', state.selectedStyle);
    }

    const response = await fetch(state.API_URL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Failed to generate image");
    }

    const data = await response.json();

    if (data.imageUrl) {
      elements.resultImage.src = data.imageUrl;
      elements.resultContainer.style.display = "block";
    } else {
      alert("❌ No image returned from AI.");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    alert("❌ Something went wrong. Please try again.");
  } finally {
    resetGenerateButton();
  }
}

function showLoadingState() {
  elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
  elements.generateBtn.disabled = true;
}

function resetGenerateButton() {
  elements.generateBtn.innerHTML = 'Generate AI Design';
  elements.generateBtn.disabled = false;
}

// ===============================
// Contact
// ===============================
function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('name')?.value || '';
  const email = document.getElementById('email')?.value || '';
  const subject = document.getElementById('subject')?.value || '';
  const message = document.getElementById('message')?.value || '';
  console.log({ name, email, subject, message });
  alert('Thanks! We will get back to you soon.');
  e.target.reset();
}

// ===============================
// Modal
// ===============================
function showSignupModal() {
  if (elements.signupModal) elements.signupModal.style.display = 'flex';
}

function closeSignupModal() {
  if (elements.signupModal) elements.signupModal.style.display = 'none';
}

// ===============================
// Google Sign-in Loader
// ===============================
function loadGoogleIdentityServices() {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  script.onload = () => {
    if (window.google && elements.googleSignInBtn) {
      // Google sign-in initialization if needed
    }
  };
}

// ===============================
// Google callback
// ===============================
window.handleGoogleSignIn = function (response) {
  const payload = parseJwt(response.credential);

  const user = {
    id: payload.sub,
    name: payload.name || '',
    email: payload.email || '',
    picture: payload.picture || '',
  };

  localStorage.setItem('user', JSON.stringify(user));
  state.googleUser = user;
  state.isLoggedIn = true;

  applyLoggedInUI(user);
};

// ===============================
// Restore session on refresh
// ===============================
function restoreSession() {
  const raw = localStorage.getItem('user');
  if (!raw) return;
  try {
    const user = JSON.parse(raw);
    if (user && user.email) {
      state.googleUser = user;
      state.isLoggedIn = true;
      applyLoggedInUI(user);
    }
  } catch (e) {
    localStorage.removeItem('user');
  }
}

// ===============================
// Apply logged-in UI
// ===============================
function applyLoggedInUI(user) {
  closeSignupModal();
  if (elements.googleSignInBtn) {
    elements.googleSignInBtn.style.display = 'none';
  }

  if (elements.profileWrapper) {
    elements.profileWrapper.style.display = 'flex';
  }
  if (elements.profileCircle) {
    const initial = (user.name && user.name[0]) || (user.email && user.email[0]) || 'U';
    elements.profileCircle.textContent = initial.toUpperCase();
  }
  if (elements.profileEmail) {
    elements.profileEmail.textContent = user.email || '';
  }
}

// ===============================
// Logout
// ===============================
function handleLogout() {
  localStorage.removeItem('user');
  state.googleUser = null;
  state.isLoggedIn = false;

  if (elements.profileDropdown) elements.profileDropdown.style.display = 'none';
  if (elements.profileWrapper) elements.profileWrapper.style.display = 'none';

  if (elements.googleSignInBtn) {
    elements.googleSignInBtn.style.display = 'block';
  }

  showSignupModal();
}

// ===============================
// Profile Dropdown
// ===============================
function toggleProfileDropdown() {
  if (!elements.profileDropdown) return;
  elements.profileDropdown.style.display =
    elements.profileDropdown.style.display === 'block' ? 'none' : 'block';
}

// ===============================
// JWT helper
// ===============================
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}

// ===============================
// Style Selection
// ===============================
function setupStyleTemplates() {
  const styleNames = [
    "Modern Minimalist",
    "Cozy Bohemian", 
    "Industrial Chic",
    "Scandinavian",
    "Coastal Retreat"
  ];

  // Apply style names to template elements
  document.querySelectorAll('.template').forEach((template, index) => {
    if (index < styleNames.length) {
      template.setAttribute('data-style', styleNames[index]);
      const nameElement = template.querySelector('.style-name');
      if (nameElement) {
        nameElement.textContent = styleNames[index];
      }
    }
  });

  // Add click event listeners to templates
  document.querySelectorAll('.template').forEach(template => {
    template.addEventListener('click', () => {
      const styleName = template.getAttribute('data-style');
      
      // Remove selection from all templates
      document.querySelectorAll('.template').forEach(t => {
        t.style.border = '2px solid transparent';
        t.style.transform = 'scale(1)';
        const nameEl = t.querySelector('.style-name');
        if (nameEl) nameEl.style.display = 'none';
      });

      // Apply selection to clicked template
      template.style.border = '2px solid #4e54c8';
      template.style.transform = 'scale(1.03)';
      const nameEl = template.querySelector('.style-name');
      if (nameEl) nameEl.style.display = 'block';

      // Store the selected style
      state.selectedStyle = styleName;

      // Update the prompt with the selected style
      if (elements.roomPrompt) {
        elements.roomPrompt.value = `Design my room in ${styleName} style`;
        elements.roomPrompt.focus();
      }

      // Show confirmation message
      showStyleConfirmation(styleName);
    });
  });
}

function showStyleConfirmation(styleName) {
  const confirmation = document.createElement('div');
  confirmation.textContent = `✓ ${styleName} style selected`;
  confirmation.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #4e54c8;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 1000;
    font-size: 14px;
  `;
  document.body.appendChild(confirmation);

  setTimeout(() => {
    document.body.removeChild(confirmation);
  }, 2000);
}

// ===============================
// EmailJS Contact Form
// ===============================
function sendMail(event) {
  event.preventDefault();

  const params = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    subject: document.getElementById("subject").value,
    message: document.getElementById("message").value,
  };

  const serviceID = "service_16vdc3s";
  const templateID = "template_pajzlda";

  emailjs.send(serviceID, templateID, params)
    .then(res => {
      console.log("✅ Email sent:", res);
      alert("Message sent successfully!");
      document.getElementById("contactForm").reset();
    })
    .catch(err => {
      console.error("❌ Email failed:", err);
      alert("Message failed to send. Try again later.");
    });
}
