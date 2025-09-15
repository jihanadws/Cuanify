#!/bin/bash
# Environment Setup Script for Family Finance PWA

echo "🚀 Family Finance PWA - Environment Setup"
echo "========================================"

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local already exists"
    echo "📝 Please update your Supabase credentials in .env.local"
else
    echo "📄 Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "✅ .env.local created"
    echo "📝 Please edit .env.local and add your Supabase credentials"
fi

echo ""
echo "🔧 Next Steps:"
echo "1. Edit .env.local and add your Supabase URL and Anon Key"
echo "2. Get credentials from: Supabase Dashboard → Settings → API"
echo "3. Run 'npm run dev' to start the application"
echo ""
echo "📖 For detailed setup instructions, see SUPABASE_SETUP.md"