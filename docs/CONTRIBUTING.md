# Contributing to Rasan

Thank you for your interest in contributing to Rasan! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Reporting Bugs](#reporting-bugs)
8. [Suggesting Features](#suggesting-features)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards others

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (for local development)
- Code editor (VS Code recommended)

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Rasan.git
   cd Rasan
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/Rasan.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase credentials
   ```

6. **Run development server**
   ```bash
   npm run dev
   ```

---

## Development Workflow

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/add-wishlist`)
- `fix/` - Bug fixes (e.g., `fix/payment-error`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/optimize-queries`)
- `test/` - Test additions/updates (e.g., `test/add-cart-tests`)

### Workflow Steps

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow coding standards
   - Add tests for new features
   - Update documentation

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Keep your branch updated**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Fill in the PR template
   - Request review

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use strict mode

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// Bad
function getUser(id: any): any {
  // ...
}
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types
- Add JSDoc comments for complex components

```typescript
/**
 * MealCard component displays a meal with image, name, and price
 */
interface MealCardProps {
  meal: Meal;
  onAddToCart: (meal: Meal) => void;
}

export function MealCard({ meal, onAddToCart }: MealCardProps) {
  // Component implementation
}
```

### File Organization

```
component-name/
├── component-name.tsx       # Component implementation
├── component-name.test.tsx  # Component tests
├── component-name.module.css # Component styles (if needed)
└── index.ts                 # Export
```

### Naming Conventions

- **Components**: PascalCase (e.g., `MealCard.tsx`)
- **Utilities**: camelCase (e.g., `formatCurrency.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_CART_ITEMS`)
- **Types/Interfaces**: PascalCase (e.g., `User`, `OrderItem`)

### Code Style

- Use Prettier for formatting
- Use ESLint for linting
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in objects/arrays

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint
```

---

## Testing Guidelines

### Unit Tests

Write unit tests for:
- Utility functions
- Business logic
- Data transformations
- Calculations

```typescript
// Example unit test
describe('formatCurrency', () => {
  it('should format currency in INR', () => {
    expect(formatCurrency(100)).toBe('₹100')
  })
})
```

### Component Tests

Write component tests for:
- User interactions
- Rendering logic
- Props handling
- State management

```typescript
// Example component test
describe('MealCard', () => {
  it('should call onAddToCart when button clicked', async () => {
    const handleAddToCart = jest.fn()
    render(<MealCard meal={mockMeal} onAddToCart={handleAddToCart} />)
    
    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }))
    expect(handleAddToCart).toHaveBeenCalledWith(mockMeal)
  })
})
```

### E2E Tests

Write E2E tests for:
- Critical user flows
- Multi-step processes
- Integration points

```typescript
// Example E2E test
test('user can complete order', async ({ page }) => {
  await page.goto('/meals')
  await page.click('[data-testid="meal-card"]')
  await page.click('button:has-text("Add to Cart")')
  await page.click('[data-testid="cart-icon"]')
  await page.click('button:has-text("Checkout")')
  // ... complete checkout flow
})
```

### Running Tests

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage
npm run test:coverage
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests added for new features
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Branch is up to date with main

### PR Title Format

Use conventional commits format:

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: format code`
- `refactor: restructure code`
- `test: add tests`
- `chore: update dependencies`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
```

### Review Process

1. Automated checks run (tests, linting)
2. Code review by maintainers
3. Address feedback
4. Approval from at least one maintainer
5. Merge to main

---

## Reporting Bugs

### Before Reporting

- Check existing issues
- Verify it's reproducible
- Test on latest version
- Gather relevant information

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

---

## Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired solution

**Describe alternatives you've considered**
Alternative solutions considered

**Additional context**
Mockups, examples, etc.
```

---

## Development Tips

### Useful Commands

```bash
# Type checking
npm run type-check

# Format code
npm run format

# Lint code
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

### Debugging

- Use React DevTools
- Use browser DevTools
- Check Supabase logs
- Review error messages
- Use console.log sparingly

### Performance

- Use React.memo for expensive components
- Implement code splitting
- Optimize images
- Use proper caching
- Monitor bundle size

---

## Questions?

If you have questions:
- Check documentation
- Search existing issues
- Ask in discussions
- Contact maintainers

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Rasan! 🎉
