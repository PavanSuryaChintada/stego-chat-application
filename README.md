# 🔐 StegoChat

<div align="center">

![StegoChat Banner](https://res.cloudinary.com/dvxwlajla/image/upload/v1760621853/stego_favicon_b9rtie.png)

**Secure Messaging with Hidden Encryption**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple)](https://vitejs.dev/)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**StegoChat** is a modern, secure messaging application that combines **end-to-end encryption** with **steganography** to hide encrypted messages within images. Built with React, TypeScript, and Supabase, it provides a beautiful user interface powered by shadcn/ui components and offers real-time messaging capabilities.

### What is Steganography?

Steganography is the practice of concealing messages within other non-secret data. StegoChat uses **LSB (Least Significant Bit)** steganography to hide encrypted text within image files, making your communications virtually undetectable.

---

## ✨ Features

### 🔒 Security Features
- **End-to-End Encryption** using Web Crypto API
- **LSB Steganography** to hide messages in images
- **Optional Passcode Protection** for extra security
- **Checksum Verification** to ensure data integrity
- **Secure Image Storage** via Supabase Storage

### 💬 Messaging Features
- **Real-time Messaging** with instant delivery
- **Text Messages** with automatic encryption
- **Steganographic Messages** hidden within images
- **User Search** to find and connect with others
- **Message History** with timestamp tracking
- **Chat List** with last message preview

### 🎨 User Experience
- **Modern Dark Theme** with gradient accents
- **Responsive Design** works on all devices
- **Beautiful Animations** for smooth interactions
- **Toast Notifications** for user feedback
- **Intuitive UI** powered by shadcn/ui components
- **Avatar System** with fallback initials

---

## 🖼️ Screenshots

<div align="center">

### Authentication Page
![Auth Page](docs/screenshots/auth.png)

### Chat Interface
![Chat Interface](docs/screenshots/chat.png)

### Steganography Modal
![Stego Modal](docs/screenshots/stego-modal.png)

</div>

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - UI library
- **TypeScript 5.8** - Type safety
- **Vite 5.4** - Build tool & dev server
- **React Router 6** - Client-side routing
- **TailwindCSS 3.4** - Utility-first CSS
- **shadcn/ui** - Beautiful UI components
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Storage for images
  - Row Level Security (RLS)

### Security & Cryptography
- **Web Crypto API** - Native browser encryption
- **LSB Steganography** - Custom implementation
- **AES-GCM** - Symmetric encryption algorithm
- **PBKDF2** - Key derivation function

### Development Tools
- **ESLint 9** - Linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- **Git**
- **Supabase Account** (free tier available)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/PavanSuryaChintada/stego-chat-application.git
cd stego-chat-application
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to Project Settings → API

#### Set Up Database Tables

Run the following SQL in the Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES profiles(id) NOT NULL,
  user2_id UUID REFERENCES profiles(id) NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  receiver_id UUID REFERENCES profiles(id) NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'stego')),
  encrypted_content TEXT,
  image_url TEXT,
  has_passcode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Chats policies
CREATE POLICY "Users can view their own chats"
  ON chats FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies
CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Create storage bucket for stego images
INSERT INTO storage.buckets (id, name, public)
VALUES ('stego-images', 'stego-images', true);

-- Storage policies
CREATE POLICY "Anyone can view stego images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stego-images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'stego-images' AND auth.role() = 'authenticated');

-- Create function to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace with your actual Supabase credentials from Project Settings → API.

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

---

## 📱 Usage

### 1. **Sign Up / Sign In**
   - Create a new account with email and password
   - Or sign in if you already have an account

### 2. **Search for Users**
   - Use the search bar to find other users
   - Click on a user to start a chat

### 3. **Send Text Messages**
   - Type your message in the input field
   - Messages are automatically encrypted before sending
   - Recipients can decrypt messages instantly

### 4. **Send Steganographic Messages**
   - Click the image icon to open the stego modal
   - Upload an image (PNG recommended)
   - Enter your secret message
   - Optionally add a passcode for extra security
   - The message will be hidden within the image using LSB steganography

### 5. **Receive Messages**
   - Text messages decrypt automatically
   - Click on steganographic images to extract hidden messages
   - Enter passcode if the message is passcode-protected

---

## 📁 Project Structure

```
stego-chat-application/
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── ChatSidebar.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── StegoModal.tsx
│   │   └── PasscodeModal.tsx
│   ├── integrations/     # Third-party integrations
│   │   └── supabase/    # Supabase client setup
│   ├── pages/           # Route pages
│   │   ├── Auth.tsx
│   │   └── Index.tsx
│   ├── utils/           # Utility functions
│   │   ├── crypto.ts    # Encryption utilities
│   │   └── steganography.ts  # Steganography implementation
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── supabase/            # Supabase configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development (with source maps)
npm run build:dev

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

### Code Quality

The project uses ESLint with TypeScript support to maintain code quality:
- Strict TypeScript checking
- React Hooks rules
- No `any` types allowed
- Consistent code formatting

---

## 🧪 How It Works

### Encryption Flow

1. **Message Encryption**
   - User types a message
   - Generate random salt and IV
   - Derive encryption key from password/passcode using PBKDF2
   - Encrypt message using AES-GCM
   - Encode ciphertext and metadata to base64

2. **Steganography**
   - Convert encrypted message to binary
   - Embed binary data into the LSB of image pixels
   - Add length header and checksum for integrity
   - Upload modified image to Supabase Storage

3. **Message Extraction**
   - Download image from storage
   - Extract binary data from LSB of pixels
   - Verify checksum
   - Decrypt using the same key derivation process
   - Display original message

### Security Features

- **AES-GCM Encryption**: Industry-standard authenticated encryption
- **PBKDF2 Key Derivation**: Secure key generation from passwords
- **Random Salt & IV**: Prevents rainbow table attacks
- **Checksum Verification**: Detects data corruption or tampering
- **Row Level Security**: Database-level access control

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use proper typing (no `any` types)
- Follow React Hooks rules
- Write meaningful commit messages
- Update documentation when needed
- Test your changes thoroughly

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Pavan Surya Chintada**

- GitHub: [@PavanSuryaChintada](https://github.com/PavanSuryaChintada)
- Repository: [stego-chat-application](https://github.com/PavanSuryaChintada/stego-chat-application)

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [Supabase](https://supabase.com/) - Backend platform
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Lucide](https://lucide.dev/) - Icons
- [TailwindCSS](https://tailwindcss.com/) - Styling

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/PavanSuryaChintada/stego-chat-application/issues) page
2. Create a new issue if your problem isn't already listed
3. Provide detailed information about the problem

---

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PavanSuryaChintada/stego-chat-application)

### Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/PavanSuryaChintada/stego-chat-application)

### Environment Variables for Deployment

Remember to set these environment variables in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by [Pavan Surya Chintada](https://github.com/PavanSuryaChintada)

</div>
