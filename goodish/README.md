# Goodish

AI-powered projects that direct money and energy toward doing good in the world.

## Mission

Doing good is no longer hard. AI lowers the barrier so anyone can launch something that helps—side projects, small tools, micro-products.

Goodish builds and shares those projects, some nonprofit, some for-profit with % donated, and some for-profit with a real social/environmental mission.

The goal is to make it easy for anyone to build for good and inspire others to do the same.

## Monorepo Structure

```
goodish/
├── package.json                # Workspaces root
├── turbo.json                  # Turborepo configuration
├── tsconfig.base.json         # Base TypeScript config
├── .gitignore
├── README.md

├── apps/
│   ├── web/                   # Goodish.org main site (Next.js app)
│   │   ├── app/              # App Router pages
│   │   ├── public/           # Static assets
│   │   └── package.json
│   └── goodheart/            # GoodHeart sub-app (Next.js app)
│       ├── app/              # App Router pages
│       ├── public/           # Static assets
│       └── package.json

└── packages/
    ├── ui/                   # Shared UI components
    │   ├── components/       # React components
    │   └── package.json
    ├── config/              # Shared configs (tailwind, postcss, eslint)
    │   └── package.json
    └── lib/                 # Shared utilities (helpers, types)
        └── package.json
```

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS with custom Goodish color palette
- **Package Manager**: pnpm workspaces
- **Build Tool**: Turborepo
- **UI Components**: Custom component library with Goodish branding

## Color Palette

- **Deep Green**: #00473E ("Good")
- **Teal**: #00AFC1 ("ish")
- **Amber**: #FFB400 (Primary CTA)
- **Light Gray**: #E5E5E5
- **Charcoal**: #1A1A1A
- **White**: #FFFFFF

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Start both development servers:

```bash
pnpm dev
```

This will start:
- **Goodish.org**: http://localhost:3000
- **GoodHeart**: http://localhost:3001

### Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all apps and packages
- `pnpm lint` - Lint all code
- `pnpm clean` - Clean all build artifacts

## Adding a New Project

1. Create a new app in `apps/<project-name>/`
2. Copy the structure from `apps/goodheart/`
3. Update the port in `package.json` if needed
4. Add a project card to `/projects` page in `apps/web/app/projects/page.tsx`
5. Update the projects data with the new project information

## Deployment

Each app can be deployed independently to Vercel:

1. **Goodish.org**: Deploy `apps/web/` to Vercel
2. **GoodHeart**: Deploy `apps/goodheart/` to Vercel

The shared packages (`@goodish/ui`, `@goodish/lib`, `@goodish/config`) will be automatically included.

## Logo

Place the Goodish logo file as:
- `apps/web/public/goodish-logo.png`
- `apps/goodheart/public/goodish-logo.png`

## Contributing

1. Follow the existing code structure
2. Use the shared UI components from `@goodish/ui`
3. Maintain the Goodish brand guidelines
4. Ensure all pages include the email signup form

## License

Private - All rights reserved.
