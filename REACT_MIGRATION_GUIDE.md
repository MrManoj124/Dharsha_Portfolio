# React Migration Guide

This document outlines the path to migrate this portfolio from vanilla JavaScript to React when needed.

## Current Architecture (Vanilla JS)

The current implementation uses:
- **Vanilla JavaScript** with class-based components
- **Data attributes** (`data-component`, `data-filter`, `data-category`) for component identification
- **Component classes** that encapsulate functionality
- **Security utilities** as a static class
- **Event delegation** for optimal performance

### Current Components
1. **ProjectFilter** - Handles project filtering by category
2. **SecurityManager** - CSRF tokens, input sanitization, validation
3. **ContactFormHandler** - Form submission with security
4. **UI Components** - Navbar, notifications, animations

---

## Migration Path to React

### Phase 1: Project Setup
```bash
# Install React and dependencies
npm create vite@latest portfolio -- --template react
cd portfolio
npm install
npm install react-router-dom axios zustand
npm install DOMPurify  # For XSS protection
```

### Phase 2: Component Structure

#### 2.1 Filter Component
```jsx
// components/ProjectFilter.jsx
import { useState } from 'react';
import '../styles/filters.css';

export default function ProjectFilter({ onFilterChange }) {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filters = ['all', 'agile', 'waterfall', 'lean'];
  
  const handleFilter = (filter) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };
  
  return (
    <div className="filter_controls">
      {filters.map(filter => (
        <button
          key={filter}
          className={`filter_btn ${activeFilter === filter ? 'active' : ''}`}
          onClick={() => handleFilter(filter)}
        >
          {filter.charAt(0).toUpperCase() + filter.slice(1)}
        </button>
      ))}
    </div>
  );
}
```

#### 2.2 Projects Container
```jsx
// components/ProjectsSection.jsx
import { useState, useMemo } from 'react';
import ProjectCard from './ProjectCard';
import ProjectFilter from './ProjectFilter';
import projectsData from '../data/projects';

export default function ProjectsSection() {
  const [filter, setFilter] = useState('all');
  
  const filteredProjects = useMemo(() => {
    if (filter === 'all') return projectsData;
    return projectsData.filter(p => p.category === filter);
  }, [filter]);
  
  return (
    <section id="projects">
      <div className="section_header">
        <h2>Featured <span className="gradient_text">Projects</span></h2>
      </div>
      <ProjectFilter onFilterChange={setFilter} />
      <div className="projects_grid">
        {filteredProjects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
```

#### 2.3 Contact Form with Security
```jsx
// components/ContactForm.jsx
import { useState } from 'react';
import { useSecurityManager } from '../hooks/useSecurityManager';

export default function ContactForm() {
  const { generateCSRFToken, sanitizeHTML, validate } = useSecurityManager();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const csrfToken = generateCSRFToken();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: sanitizeHTML(value)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validate('contact', formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        // Reset form and show success
        setFormData({ name: '', email: '', message: '' });
        setErrors({});
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="contact_form">
      {/* Form fields with validation display */}
    </form>
  );
}
```

### Phase 3: State Management (Zustand)

```jsx
// store/portfolioStore.js
import { create } from 'zustand';

export const usePortfolioStore = create((set) => ({
  selectedFilter: 'all',
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  
  csrfToken: '',
  setCsrfToken: (token) => set({ csrfToken: token }),
  
  formData: { name: '', email: '', message: '' },
  setFormData: (data) => set({ formData: data })
}));
```

### Phase 4: Custom Hooks

```jsx
// hooks/useSecurityManager.js
import DOMPurify from 'dompurify';

export function useSecurityManager() {
  const generateCSRFToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };
  
  const sanitizeHTML = (str) => {
    return DOMPurify.sanitize(str, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [] 
    });
  };
  
  const validate = (type, data) => {
    // Validation logic here
    return { isValid: true, errors: {} };
  };
  
  return { generateCSRFToken, sanitizeHTML, validate };
}
```

### Phase 5: Data Structure

```jsx
// data/projects.js
export default [
  {
    id: 1,
    title: 'Enterprise Software Implementation',
    category: 'agile',
    description: '...',
    tags: ['Agile', 'Scrum', 'MS Project', 'Jira'],
    image: 'icon-name'
  },
  // More projects...
];

// data/blogPosts.js
export default [
  {
    id: 1,
    title: 'Mastering Agile Sprint Planning',
    category: 'Agile',
    date: '2026-03-10',
    excerpt: '...',
    content: '...'
  },
  // More posts...
];
```

### Phase 6: Routing Structure

```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Footer from './components/Footer';

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogPost />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
```

### Phase 7: Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
})
```

---

## Backend API Endpoints (To Be Implemented)

### Contact Form Submission
```
POST /api/contact
Headers:
  - Content-Type: application/json
  - X-CSRF-Token: <token>
  
Body:
{
  "name": "string",
  "email": "string",
  "message": "string",
  "timestamp": "ISO string"
}

Response:
{
  "success": true,
  "message": "Message sent successfully"
}
```

### Blog Posts API
```
GET /api/blog              # Get all blog posts
GET /api/blog/:id          # Get single blog post
GET /api/blog?category=... # Filter by category
```

---

## Security Considerations for React Version

1. **XSS Prevention**: Use DOMPurify for sanitization
2. **CSRF Protection**: Always include CSRF tokens in forms
3. **Input Validation**: Validate on both client and server
4. **Content Security Policy**: Implement strict CSP headers
5. **HTTPS**: Ensure all external resources use HTTPS
6. **Dependencies**: Regularly update and audit npm packages

---

## Performance Optimization for React

1. **Code Splitting**: Use React lazy loading
2. **Memoization**: Use React.memo, useMemo, useCallback
3. **Bundle Analysis**: Use `npm run analyze`
4. **Image Optimization**: Use responsive images with WebP
5. **Service Workers**: PWA for offline support

---

## Migration Checklist

- [ ] Set up React project with Vite
- [ ] Create component structure
- [ ] Migrate CSS modules
- [ ] Migrate data to component state/Zustand
- [ ] Implement routing
- [ ] Add security hooks and utilities
- [ ] Set up API endpoints
- [ ] Test all functionality
- [ ] Optimize performance
- [ ] Deploy to production
- [ ] Monitor and iterate

---

## Current Vanilla JS Components Ready for Migration

Each component in `script.js` is designed as a class with clear responsibilities:

| Class | Migration Target | Priority |
|-------|-----------------|----------|
| ProjectFilter | `ProjectFilter.jsx` | High |
| SecurityManager | `useSecurityManager` hook | High |
| ContactFormHandler | `ContactForm.jsx` | High |
| Mobile menu | `Navigation.jsx` | Medium |
| Animations | CSS/Framer Motion | Medium |

---

## Timeline Estimate

- Phase 1-2: 2-3 weeks
- Phase 3-4: 1-2 weeks
- Phase 5-6: 1 week
- Phase 7+: Testing & optimization: 1-2 weeks

**Total: 5-8 weeks** for full React migration

---

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [React Router Documentation](https://reactrouter.com)
