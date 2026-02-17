# Contributing to StegoChat

First off, thank you for considering contributing to StegoChat! It's people like you that make StegoChat such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by respect and professionalism. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if relevant**
- **Include your environment details** (OS, browser, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other applications if applicable**

### Pull Requests

- Fill in the required template
- Follow the TypeScript style guide
- Include appropriate test coverage
- Update documentation as needed
- End all files with a newline

## Development Setup

1. Fork the repo
2. Clone your fork
3. Install dependencies: `npm install`
4. Set up Supabase (see README.md)
5. Create a `.env` file with your Supabase credentials
6. Start the dev server: `npm run dev`

## Style Guidelines

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests after the first line

Examples:
```
Add steganography extraction error handling
Fix message bubble alignment issue
Update README with deployment instructions
```

### TypeScript Style Guide

- **No `any` types** - Use proper typing
- **Use interfaces or types** for object shapes
- **Follow React Hooks rules** - Add all dependencies
- **Use functional components** with hooks
- **Use arrow functions** for components
- **Use async/await** over promises where possible

### Component Guidelines

- One component per file
- Use PascalCase for component names
- Use kebab-case for file names (or PascalCase)
- Export components as named exports
- Include PropTypes or TypeScript interfaces

### Code Organization

```typescript
// 1. Imports
import { useState } from 'react';

// 2. Types/Interfaces
interface MyComponentProps {
  title: string;
}

// 3. Component
export const MyComponent = ({ title }: MyComponentProps) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Functions
  const handleClick = () => {
    // ...
  };
  
  // 6. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 7. Return JSX
  return <div>{title}</div>;
};
```

## Testing Guidelines

- Write tests for new features
- Ensure all tests pass before submitting PR
- Maintain or improve code coverage

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments for complex functions
- Update inline comments as needed

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🎉
